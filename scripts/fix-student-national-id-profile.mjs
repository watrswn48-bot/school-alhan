import fs from 'node:fs';

const path = 'src/components/CumulativeProfileModal.tsx';
let source = fs.readFileSync(path, 'utf8');

const marker = 'الرقم القومي: {student.nationalId || \'غير مسجل\'}';
const addition = `                <span className="flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ${marker}
                </span>`;

if (source.includes(marker)) {
  console.log('Student national ID is already present in the cumulative profile header.');
} else {
  const guardianRegex = /(\s*<span className="flex items-center gap-1 font-mono">\s*<Phone className="w-3\.5 h-3\.5 text-sky-400" \/>\s*ولي الأمر: \{student\.guardianPhone \|\| 'غير مسجل'\}\s*<\/span>)/;
  if (!guardianRegex.test(source)) throw new Error('Guardian phone block not found in student profile.');
  source = source.replace(guardianRegex, `$1\n${addition}`);
  fs.writeFileSync(path, source, 'utf8');
  console.log('Student national ID added beside the guardian phone in the cumulative profile.');
}
