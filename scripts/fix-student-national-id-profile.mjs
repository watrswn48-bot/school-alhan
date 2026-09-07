import fs from 'node:fs';

const path = 'src/components/CumulativeProfileModal.tsx';
let source = fs.readFileSync(path, 'utf8');

const anchor = `                <span className="flex items-center gap-1 font-mono">\n                  <Phone className="w-3.5 h-3.5 text-sky-400" />\n                  ولي الأمر: {student.guardianPhone || 'غير مسجل'}\n                </span>`;

const addition = `${anchor}\n                <span className="flex items-center gap-1 font-mono">\n                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />\n                  الرقم القومي: {student.nationalId || 'غير مسجل'}\n                </span>`;

if (!source.includes('الرقم القومي: {student.nationalId')) {
  if (!source.includes(anchor)) {
    throw new Error('Student profile header anchor not found.');
  }
  source = source.replace(anchor, addition);
  fs.writeFileSync(path, source);
  console.log('Student national ID added to the cumulative profile header.');
} else {
  console.log('Student national ID is already present in the cumulative profile header.');
}
