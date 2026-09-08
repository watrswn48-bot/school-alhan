import fs from 'node:fs';

const path = 'src/components/CumulativeProfileModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const startToken = '            {/* Main Info */}';
const actionMarker = '            {/* Action Buttons */}';
const start = content.indexOf(startToken);
const end = content.indexOf(actionMarker, start);

if (start === -1) throw new Error('Main Info section start not found');
if (end === -1) throw new Error('Action buttons marker not found');

const replacement = `            {/* Main Info */}
            <div className="text-center sm:text-right space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight break-words">
                  {student.fullName}
                </h2>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  {student.studentCode}
                </span>
              </div>

              <div className="space-y-2 pt-1 text-xs text-slate-300">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
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
                  <span className="text-amber-300 font-bold bg-amber-500/5 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                    الخدمة: {student.level} - {student.year}
                  </span>
                  <span className="text-sky-300 font-bold bg-sky-500/5 backdrop-blur-sm px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                    المدرسة: {student.schoolLevel || 'غير مسجل'} - {student.schoolYear || 'غير مسجل'}
                  </span>
                  {student.graduationYear && (
                    <span className="font-black text-emerald-300 bg-emerald-500/5 backdrop-blur-sm border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      خريج {student.graduationYear}
                    </span>
                  )}
                </div>
              </div>
            </div>

`;

content = content.slice(0, start) + replacement + content.slice(end);

// Remove the school logo badge beside the student photo to save header space.
const badgeStart = content.indexOf('            {/* School Logo Badge */}');
const photoStart = content.indexOf('            {/* Photo & QR Code */}', badgeStart);
if (badgeStart >= 0 && photoStart > badgeStart) {
  content = content.slice(0, badgeStart) + content.slice(photoStart);
}

// Student portal: keep only logout; staff/admin retain the close button.
const closeButtonStart = content.indexOf('          <button\n            onClick={onClose}\n');
if (closeButtonStart >= 0) {
  const closeButtonEnd = content.indexOf('          </button>', closeButtonStart);
  if (closeButtonEnd > closeButtonStart) {
    const button = content.slice(closeButtonStart, closeButtonEnd + '          </button>'.length);
    content = content.slice(0, closeButtonStart) + `{session.mode !== 'student' && (\n${button}\n          )}` + content.slice(closeButtonEnd + '          </button>'.length);
  }
}

// Remove the old manual promotion action; progression is automatic now.
content = content.replace(/\n\s*\{session\.role === 'admin' && onTriggerPromotion && \(\n[\s\S]*?\n\s*\)\}/, '');
content = content.replace(/\n\s*onTriggerPromotion\?: \(student: Student\) => void;/, '');
content = content.replace(/\n\s*onTriggerPromotion,/, '');

content = content.replace('opacity-[0.06] pointer-events-none rounded-full', 'opacity-[0.10] pointer-events-none rounded-full');
content = content.replace('الهيكل التراكمي لـ 16 سنة دراسية', 'الهيكل التراكمي للمراحل والسنوات الدراسية');

fs.writeFileSync(path, content);
