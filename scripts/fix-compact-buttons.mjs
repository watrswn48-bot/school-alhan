import fs from 'node:fs';

const loginPath = 'src/components/LoginModule.tsx';
let login = fs.readFileSync(loginPath, 'utf8');

// Make the two login-mode buttons icon-only while keeping accessible labels.
login = login.replace(
  /(<button\s+onClick=\{\(\) => \{\s*setLoginTab\('servant'\);\s*setErrorMessage\(null\);\s*\}\}\s+className=\{`[^`]*`\})\s*>\s*<ShieldCheck className="w-4 h-4"\s*\/?>\s*الخدام والإدارة\s*<\/button>/s,
  `$1 aria-label="دخول الخدام والإدارة" title="الخدام والإدارة">\n            <ShieldCheck className="w-5 h-5" />\n          </button>`
);
login = login.replace(
  /(<button\s+onClick=\{\(\) => \{\s*setLoginTab\('student'\);\s*setErrorMessage\(null\);\s*\}\}\s+className=\{`[^`]*`\})\s*>\s*<User className="w-4 h-4"\s*\/?>\s*الطالب وولي الأمر\s*<\/button>/s,
  `$1 aria-label="دخول الطالب وولي الأمر" title="الطالب وولي الأمر">\n            <User className="w-5 h-5" />\n          </button>`
);

// QR camera buttons become icon-only.
login = login.replace(
  /(onClick=\{\(\) => setIsScannerOpen\(true\)\}\s+className="[^"]+")\s*>\s*<QrCode className="w-5 h-5"\s*\/?>\s*مسح الـ QR Code عبر الكاميرا\s*<\/button>/s,
  `$1 aria-label="مسح QR" title="مسح QR">\n              <QrCode className="w-5 h-5" />\n            </button>`
);
login = login.replace(
  /(onClick=\{\(\) => setIsScannerOpen\(true\)\}\s+className="[^"]+")\s*>\s*<QrCode className="w-5 h-5"\s*\/?>\s*مسح الـ QR Code لبطاقة الهوية\s*<\/button>/s,
  `$1 aria-label="مسح QR" title="مسح QR">\n              <QrCode className="w-5 h-5" />\n            </button>`
);

// Login submit buttons become icon-only.
login = login.replace(
  /(type="submit"\s+disabled=\{!secretCodeInput\.trim\(\)\}\s+className="[^"]+")\s*>\s*دخول الخادم\s*<ArrowLeft className="w-4 h-4"\s*\/?>\s*<\/button>/s,
  `$1 aria-label="دخول الخادم" title="دخول">\n                <ArrowLeft className="w-5 h-5" />\n              </button>`
);
login = login.replace(
  /(type="submit"\s+disabled=\{!studentInput\.trim\(\)\}\s+className="[^"]+")\s*>\s*دخول الطالب\s*<ArrowLeft className="w-4 h-4"\s*\/?>\s*<\/button>/s,
  `$1 aria-label="دخول الطالب" title="دخول">\n                <ArrowLeft className="w-5 h-5" />\n              </button>`
);

// Remove the demo-credentials block from the login screen if it is still present.
login = login.replace(
  /\s*\{\/\* Quick Test Demo Credentials \*\/\}[\s\S]*?(?=\n\s*\<\/div\>\s*\n\s*\}\)\}\s*\n\s*\{\/\* TAB 2)/,
  ''
);

fs.writeFileSync(loginPath, login);

const profilePath = 'src/components/CumulativeProfileModal.tsx';
let profile = fs.readFileSync(profilePath, 'utf8');

// Remove the old absolute close button from the profile header.
profile = profile.replace(
  /\s*\{session\.mode !== 'student' && \(\s*<button\s*onClick=\{onClose\}\s*className="absolute left-3 top-3 sm:left-5 sm:top-5 z-30 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-700\/60 rounded-2xl transition-colors no-print"\s*aria-label="إغلاق الملف الشخصي"\s*title="إغلاق"\s*>\s*<X className="w-5 h-5"\s*\/?>\s*<\/button>\s*\)\}\s*/s,
  '\n'
);

// Put the close X immediately beside the student-card button.
const cardButton = /\s*<button\s*onClick=\{\(\) => onGenerateIDCard\(student\)\}\s*className="w-10 h-10 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center shadow-sm"\s*>\s*<QrCode className="w-4 h-4"\s*\/?>\s*<\/button>/s;
if (!cardButton.test(profile)) {
  throw new Error('Profile ID card button not found');
}
profile = profile.replace(cardButton, (match) => `${match}\n\n              {session.mode !== 'student' && (\n                <button\n                  onClick={onClose}\n                  className="w-10 h-10 bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 border border-slate-700 rounded-2xl transition-all flex items-center justify-center shadow-sm"\n                  aria-label="إغلاق الملف الشخصي"\n                  title="إغلاق"\n                >\n                  <X className="w-4 h-4" />\n                </button>\n              )}`);

fs.writeFileSync(profilePath, profile);
console.log('Applied compact login buttons and placed profile close/card buttons together.');
