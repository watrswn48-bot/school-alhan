import fs from 'node:fs';

const path = 'src/components/CumulativeProfileModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const marker = '        {/* DYNAMIC LEVEL / YEAR STAGE STEPPER SELECTOR */}';
const startToken = '        {/* STUDENT REGISTRATION DETAILS */}';
const endToken = marker;

const section = `        {/* STUDENT REGISTRATION DETAILS */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-black text-slate-300">بيانات التسجيل:</span>
            <span className="text-slate-400">{student.notes}</span>
            {student.graduationYear && (
              <span className="mr-auto text-[11px] font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                خريج {student.graduationYear}
              </span>
            )}
          </div>
        </div>

`;

if (content.includes(startToken) && content.includes(endToken)) {
  const start = content.indexOf(startToken);
  const end = content.indexOf(endToken, start);
  content = content.slice(0, start) + section + content.slice(end);
} else {
  if (!content.includes(marker)) throw new Error('Profile stage selector marker not found');
  content = content.replace(marker, section + marker);
}

fs.writeFileSync(path, content);
