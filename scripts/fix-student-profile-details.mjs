import fs from 'node:fs';

const path = 'src/components/CumulativeProfileModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const marker = '        {/* DYNAMIC LEVEL / YEAR STAGE STEPPER SELECTOR */}';
const startToken = '        {/* STUDENT REGISTRATION DETAILS */}';

if (!content.includes(startToken)) {
  const section = `        {/* STUDENT REGISTRATION DETAILS */}
        <div className="bg-slate-900 border-b border-slate-800 p-5 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black text-slate-100">بيانات الطالب الأساسية</h3>
            {student.graduationYear && (
              <span className="mr-auto text-xs font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                خريج سنة {student.graduationYear}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-[11px] text-slate-500 mb-1">الاسم بالكامل</div>
              <div className="text-sm font-bold text-slate-100">{student.fullName}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-[11px] text-slate-500 mb-1">كود الطالب</div>
              <div className="text-sm font-bold text-amber-300 font-mono">{student.studentCode}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-[11px] text-slate-500 mb-1">رتبة الشماس</div>
              <div className="text-sm font-bold text-slate-100">{student.deaconRank}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-[11px] text-slate-500 mb-1">الرقم القومي</div>
              <div className="text-sm font-bold text-slate-100 font-mono">{student.nationalId}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-[11px] text-slate-500 mb-1">رقم الطالب</div>
              <div className="text-sm font-bold text-slate-100 font-mono">{student.phone}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-[11px] text-slate-500 mb-1">رقم ولي الأمر</div>
              <div className="text-sm font-bold text-slate-100 font-mono">{student.guardianPhone}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-[11px] text-slate-500 mb-1">المرحلة في مدرسة الألحان</div>
              <div className="text-sm font-bold text-amber-300">{student.level}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-[11px] text-slate-500 mb-1">السنة في مدرسة الألحان</div>
              <div className="text-sm font-bold text-amber-300">{student.year}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-[11px] text-slate-500 mb-1">المرحلة الدراسية</div>
              <div className="text-sm font-bold text-sky-300">{student.schoolLevel}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3">
              <div className="text-[11px] text-slate-500 mb-1">السنة الدراسية</div>
              <div className="text-sm font-bold text-sky-300">{student.schoolYear}</div>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-800 p-3 sm:col-span-2 lg:col-span-3">
              <div className="text-[11px] text-slate-500 mb-1">ملاحظات التسجيل</div>
              <div className="text-sm font-bold text-slate-200 whitespace-pre-wrap">{student.notes}</div>
            </div>
          </div>
        </div>

`;
  if (!content.includes(marker)) throw new Error('Profile stage selector marker not found');
  content = content.replace(marker, section + marker);
  fs.writeFileSync(path, content);
}
