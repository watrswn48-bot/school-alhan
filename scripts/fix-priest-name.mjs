import fs from 'node:fs';

const path = 'src/services/storage.ts';
let source = fs.readFileSync(path, 'utf8');

source = source.replaceAll('القمص يوحنا عبد المسيح', 'أبونا فيلبس ميلاد');

const marker = "export async function initStorage(onDataUpdated?: () => void) {";
const migration = `export function migratePriestName() {\n  const raw = localStorage.getItem(STORAGE_KEYS.SERVANTS);\n  if (!raw) return;\n  try {\n    const servants: Servant[] = JSON.parse(raw);\n    let changed = false;\n    servants.forEach((servant) => {\n      if (servant.id === 'srv-admin-01' && servant.fullName !== 'أبونا فيلبس ميلاد') {\n        servant.fullName = 'أبونا فيلبس ميلاد';\n        changed = true;\n      }\n    });\n    if (changed) {\n      localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(servants));\n      const admin = servants.find((servant) => servant.id === 'srv-admin-01');\n      if (admin) enqueueMutation('save_servant', admin);\n    }\n  } catch {\n    // Ignore malformed legacy servant data.\n  }\n}\n\n`;

if (!source.includes('export function migratePriestName()')) {
  source = source.replace(marker, migration + marker);
}

source = source.replace(
  'export async function initStorage(onDataUpdated?: () => void) {\n',
  'export async function initStorage(onDataUpdated?: () => void) {\n  migratePriestName();\n'
);

fs.writeFileSync(path, source, 'utf8');
console.log('Priest account renamed to أبونا فيلبس ميلاد and legacy local data migration added.');
