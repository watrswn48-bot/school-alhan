import fs from 'node:fs';

const path = 'src/components/CumulativeProfileModal.tsx';
let source = fs.readFileSync(path, 'utf8');

const marker = "الرقم القومي: {student.nationalId || 'غير مسجل'}";
const addition = `                <span className="flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ${marker}
                </span>`;

if (source.includes(marker)) {
  console.log('Student national ID is already present in the cumulative profile header.');
} else {
  const guardianRegex = /(\s*<span[^>]*>\s*<Phone[^>]*\/>\s*ولي الأمر:\s*\{student\.guardianPhone\s*\|\|\s*'غير مسجل'\}\s*<\/span>)/m;
  if (guardianRegex.test(source)) {
    source = source.replace(guardianRegex, `$1\n${addition}`);
    fs.writeFileSync(path, source, 'utf8');
    console.log('Student national ID added beside the guardian phone in the cumulative profile.');
  } else {
    // This patch must never block the rest of the deployment if the profile was already
    // changed by another patch. Later validation/build steps remain authoritative.
    console.log('National ID insertion point not found; leaving the existing profile unchanged.');
  }
}
