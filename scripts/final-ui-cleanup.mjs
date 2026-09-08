import fs from 'node:fs';

// This script is intentionally limited to the exact UI request that motivated it:
// keep the subject selector sourced from إضافة المواد and remove only the redundant
// optional free-text material-name input. Profile/admin JSX is owned by the dedicated
// admin/profile patch and must not be modified here.
const cp = 'src/components/CurriculaModule.tsx';
let c = fs.readFileSync(cp, 'utf8');

const redundantInput = /<input\s+type="text"\s+value=\{formFileName\}[\s\S]*?placeholder="اسم المادة \(اختياري\)"[\s\S]*?\/>/m;
if (redundantInput.test(c)) {
  c = c.replace(redundantInput, '');
  fs.writeFileSync(cp, c, 'utf8');
  console.log('Removed only the redundant optional material-name input.');
} else {
  console.log('Redundant optional material-name input already removed or not present.');
}
