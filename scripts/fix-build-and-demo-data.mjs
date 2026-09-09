import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s);

// Keep the admin permission declaration idempotent so repeated CI patches never create duplicates.
{
  const p = 'src/App.tsx';
  let s = read(p);
  s = s.replace(/\n\s*const canOpenAdmin\s*=.*?;(?=\n)/g, '');
  s = s.replace(
    /const isAdministrator=session\.role==='admin'\|\|session\.userId==='srv-admin-01';/,
    "const isAdministrator=session.role==='admin'||session.userId==='srv-admin-01';\n  const canOpenAdmin=isAdministrator||sessionHasPermission(session,'canViewAdminPanel');",
  );
  write(p, s);
}

// Remove duplicate canViewAdminPanel entries that older patch scripts may have inserted.
{
  const p = 'src/services/permissions.ts';
  let s = read(p);
  s = s.replace(/'canManageAcademicYear','canViewAdminPanel'(?:,'canViewAdminPanel')+/g, "'canManageAcademicYear','canViewAdminPanel'");
  s = s.replace(/canViewAdminPanel: 'ظهور وفتح لوحة الإدارة'(?:,\s*canViewAdminPanel: 'ظهور وفتح لوحة الإدارة')+/g, "canViewAdminPanel: 'ظهور وفتح لوحة الإدارة'");
  write(p, s);
}

// Never recreate deleted demo students just because browser storage is empty.
// Real records are restored from Firebase; the seed function remains in the source only for legacy compatibility.
{
  const p = 'src/services/storage.ts';
  let s = read(p);
  const old = /\n\s*\/\/ Check if students exist locally, if not seed initial dataset\n\s*const existingStudents = localStorage\.getItem\(STORAGE_KEYS\.STUDENTS\);\n\s*if \(!existingStudents\) \{\n\s*seedInitialData\(\);\n\s*\/\/ Automatically push seeded initial data to Firebase so Firestore has all records\n\s*syncAllToFirebase\(\)\.catch\(\(err\) => \{\n\s*console\.warn\('Failed to sync initial data:', err\);\n\s*\}\);\n\s*\}/m;
  if (old.test(s)) {
    s = s.replace(old, "\n  // Do not seed demo data automatically. Empty local storage must stay empty until real data is added or pulled from Firebase.\n  const existingStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);\n  void existingStudents;");
  } else {
    s = s.replace(/\n\s*if \(!existingStudents\) \{\n\s*seedInitialData\(\);[\s\S]*?\n\s*\}/m, "\n  // Demo data seeding is intentionally disabled.");
  }
  write(p, s);
}

console.log('Build/demo-data safeguards applied.');
