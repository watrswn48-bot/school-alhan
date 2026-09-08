import fs from 'node:fs';

const path = 'src/components/CumulativeProfileModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Registration data belongs directly in the profile header under the national ID.
// Remove any legacy standalone registration-details section so it cannot duplicate the header.
const startToken = '        {/* STUDENT REGISTRATION DETAILS */}';
const endToken = '        {/* DYNAMIC LEVEL / YEAR STAGE STEPPER SELECTOR */}';
const start = content.indexOf(startToken);
if (start !== -1) {
  const end = content.indexOf(endToken, start);
  if (end === -1) throw new Error('Profile stage selector marker not found');
  content = content.slice(0, start) + content.slice(end);
}

fs.writeFileSync(path, content);
