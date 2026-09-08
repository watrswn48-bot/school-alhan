import fs from 'node:fs';

const path = 'src/components/CumulativeProfileModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const startToken = '              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300 pt-1">';
const endToken = '\n              </div>\n            </div>\n\n            {/* Action Buttons */}';

const start = content.indexOf(startToken);
if (start === -1) throw new Error('Profile info row start not found');
const end = content.indexOf(endToken, start);
if (end === -1) throw new Error('Profile info row end not found');

const replacement = `              <div className="space-y-2 pt-1 text-xs text-slate-300">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    الطالب: {student.phone || 'غير مسجل'}
                  </span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    ولي الأمر: {student.guardianPhone || 'غير مسجل'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    الرقم القومي: {student.nationalId || 'غير مسجل'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-amber-300 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                    الخدمة: {student.level} - {student.year}
                  </span>
                  <span className="text-sky-300 font-bold bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                    المدرسة: {student.schoolLevel || 'غير مسجل'} - {student.schoolYear || 'غير مسجل'}
                  </span>
                  {student.graduationYear && (
                    <span className="font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      خريج {student.graduationYear}
                    </span>
                  )}
                </div>

                {student.notes && (
                  <div className="text-[11px] text-slate-400 text-center sm:text-right">
                    ملاحظة: {student.notes}
                  </div>
                )}
              </div>`;

content = content.slice(0, start) + replacement + content.slice(end + 1);
fs.writeFileSync(path, content);
