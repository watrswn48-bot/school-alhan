import fs from 'node:fs';

const schoolPath = 'src/services/schoolSystem.ts';
let school = fs.readFileSync(schoolPath, 'utf8');

const oldAdvance = `function advanceChantStage(student: Student): Student {
  const levels = getAcademicLevels();
  const years = getAcademicYears();
  let nextL = student.levelIndex;
  let nextY = student.yearIndex + 1;
  if (nextY >= years.length) { nextY = 0; nextL += 1; }
  if (nextL >= levels.length) return student;
  const history = Array.isArray(student.history) ? [...student.history] : [];
  const current = history.find(h => h.levelIndex === student.levelIndex && h.yearIndex === student.yearIndex);
  if (current) { current.status = 'passed'; current.archivedAt = new Date().toISOString(); }
  const next = history.find(h => h.levelIndex === nextL && h.yearIndex === nextY);
  if (next) next.status = 'active';
  return { ...student, levelIndex: nextL, yearIndex: nextY, level: levels[nextL], year: years[nextY], history };
}`;

const newAdvance = `function advanceChantStage(student: Student, graduationAcademicYear?: string): Student {
  const levels = getAcademicLevels();
  const years = getAcademicYears();
  const history = Array.isArray(student.history) ? [...student.history] : [];
  const current = history.find(h => h.levelIndex === student.levelIndex && h.yearIndex === student.yearIndex);
  if (current) { current.status = 'passed'; current.archivedAt = new Date().toISOString(); }
  let nextL = student.levelIndex;
  let nextY = student.yearIndex + 1;
  if (nextY >= years.length) { nextY = 0; nextL += 1; }
  if (nextL >= levels.length) {
    const endYear = Number((graduationAcademicYear || currentAcademicYear()).split('/')[1]);
    return { ...student, history, graduationYear: Number.isFinite(endYear) ? endYear : new Date().getFullYear(), graduatedAt: new Date().toISOString() };
  }
  const next = history.find(h => h.levelIndex === nextL && h.yearIndex === nextY);
  if (next) next.status = 'active';
  return { ...student, levelIndex: nextL, yearIndex: nextY, level: levels[nextL], year: years[nextY], history, graduationYear: undefined, graduatedAt: undefined };
}`;

if (school.includes(oldAdvance)) school = school.replace(oldAdvance, newAdvance);
const oldPromoted = `const promoted = advanceChantStage(updated);`;
if (school.includes(oldPromoted)) school = school.replace(oldPromoted, `const promoted = advanceChantStage(updated, last || year);`);
fs.writeFileSync(schoolPath, school, 'utf8');

const adminPath = 'src/components/AdminPanelModule.tsx';
let admin = fs.readFileSync(adminPath, 'utf8');
if (!admin.includes("./GraduatesModule")) admin = admin.replace("import { ALL_SERVANT_PERMISSIONS", "import { GraduatesModule } from './GraduatesModule';\nimport { ALL_SERVANT_PERMISSIONS");
admin = admin.replace("useState<'servants' | 'branding' | 'backup'>('servants')", "useState<'servants' | 'graduates' | 'branding' | 'backup'>('servants')");
admin = admin.replace("(['servants','إدارة الخدام والصلاحيات'],['branding','شعار الأكاديمية والموقع'],['backup','النسخ الاحتياطي والاستعادة'])", "(['servants','إدارة الخدام والصلاحيات'],['graduates','الخريجون'],['branding','شعار الأكاديمية والموقع'],['backup','النسخ الاحتياطي والاستعادة'])");
const anchor = "    {activeAdminTab==='servants' && <div";
if (!admin.includes("activeAdminTab==='graduates'")) admin = admin.replace(anchor, "    {activeAdminTab==='graduates' && <GraduatesModule session={session} />}\n\n" + anchor);
fs.writeFileSync(adminPath, admin, 'utf8');

const workflowPath = '.github/workflows/deploy.yml';
let workflow = fs.readFileSync(workflowPath, 'utf8');
if (!workflow.includes('Apply graduates management patch')) workflow = workflow.replace("      - name: Apply priest name migration\n        run: node scripts/fix-priest-name.mjs", "      - name: Apply graduates management patch\n        run: node scripts/fix-graduates-management.mjs\n      - name: Apply priest name migration\n        run: node scripts/fix-priest-name.mjs");
if (!workflow.includes('src/components/GraduatesModule.tsx')) workflow = workflow.replace('src/components/AddStudentModule.tsx', 'src/components/AddStudentModule.tsx src/components/GraduatesModule.tsx');
if (!workflow.includes('scripts/fix-graduates-management.mjs')) workflow = workflow.replace('scripts/fix-priest-name.mjs src/services/egyptTime.ts', 'scripts/fix-priest-name.mjs scripts/fix-graduates-management.mjs src/services/egyptTime.ts');
fs.writeFileSync(workflowPath, workflow, 'utf8');
console.log('Graduate tracking, final-year graduation marking, and admin graduate search patch applied.');
