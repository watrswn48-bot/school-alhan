import fs from 'node:fs';

const path = 'src/components/CumulativeProfileModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const startToken = '        {/* STUDENT REGISTRATION DETAILS */}';
const marker = '        {/* DYNAMIC LEVEL / YEAR STAGE STEPPER SELECTOR */}';

// Remove the separate registration strip so the data can live directly in the student header.
if (content.includes(startToken) && content.includes(marker)) {
  const start = content.indexOf(startToken);
  const end = content.indexOf(marker, start);
  content = content.slice(0, start) + content.slice(end);
}

const nationalIdEnd = `                </span>\n                <span className="text-amber-300 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">`;
const details = `                <div className="w-full flex flex-wrap items-center gap-2 pt-1 text-[11px] border-t border-slate-800/80 mt-1">\n                  <span className="font-black text-slate-300">بيانات التسجيل:</span>\n                  {student.notes && <span className="text-slate-400">ملاحظات: {student.notes}</span>}\n                  {student.graduationYear && (\n                    <span className="font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">\n                      خريج {student.graduationYear}\n                    </span>\n                  )}\n                </div>\n`;

if (!content.includes(details.trim())) {
  const pos = content.indexOf(nationalIdEnd);
  if (pos === -1) throw new Error('National ID header location not found');
  content = content.slice(0, pos) + details + content.slice(pos);
}

fs.writeFileSync(path, content);
