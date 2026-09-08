import fs from 'node:fs';

const path = 'src/components/CumulativeProfileModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const marker = '        {/* DYNAMIC LEVEL / YEAR STAGE STEPPER SELECTOR */}';
const startToken = '        {/* STUDENT REGISTRATION DETAILS */}';
const endToken = marker;

const section = `        {/* STUDENT REGISTRATION DETAILS */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]">
            <span className="font-black text-slate-200">الخدمة:</span>
            <span className="text-amber-300 font-bold">{student.level} - {student.year}</span>
            <span className="font-black text-slate-200">المدرسة:</span>
            <span className="text-sky-300 font-bold">{student.schoolLevel || 'غير مسجل'} - {student.schoolYear || 'غير مسجل'}</span>
            <span className="font-black text-slate-200">هاتف الطالب:</span>
            <span className="text-slate-300 font-mono">{student.phone || 'غير مسجل'}</span>
            <span className="font-black text-slate-200">ولي الأمر:</span>
            <span className="text-slate-300 font-mono">{student.guardianPhone || 'غير مسجل'}</span>
            {student.notes && <span className="text-slate-400">ملاحظة: {student.notes}</span>}
            {student.graduationYear && (
              <span className="font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
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
