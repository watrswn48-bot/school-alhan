import fs from 'node:fs';

const loginPath = 'src/components/LoginModule.tsx';
let login = fs.readFileSync(loginPath, 'utf8');

// Keep the two login-mode buttons compact, but restore their visible labels.
login = login.replace(
  /(<button\s+onClick=\{\(\) => \{\s*setLoginTab\('servant'\);\s*setErrorMessage\(null\);\s*\}\}\s+className=\{`[^`]*`\})\s+aria-label="دخول الخدام والإدارة" title="الخدام والإدارة">\s*<ShieldCheck className="w-5 h-5"\s*\/?>\s*<\/button>/s,
  `$1 aria-label="دخول الخدام والإدارة" title="الخدام والإدارة">\n            <ShieldCheck className="w-4 h-4" />\n            مسئول\n          </button>`
);
login = login.replace(
  /(<button\s+onClick=\{\(\) => \{\s*setLoginTab\('student'\);\s*setErrorMessage\(null\);\s*\}\}\s+className=\{`[^`]*`\})\s+aria-label="دخول الطالب وولي الأمر" title="الطالب وولي الأمر">\s*<User className="w-5 h-5"\s*\/?>\s*<\/button>/s,
  `$1 aria-label="دخول الطالب وولي الأمر" title="الطالب وولي الأمر">\n            <User className="w-4 h-4" />\n            طالب\n          </button>`
);
login = login.replace(/(<button[^>]*onClick=\{\(\) => setIsScannerOpen\(true\)\}[^>]*aria-label="مسح QR"[^>]*>)[\s\S]*?(<\/button>)/g, '$1\n              <QrCode className="w-5 h-5" />\n            $2');
login = login.replace(/(<button[^>]*type="submit"[^>]*aria-label="دخول الخادم"[^>]*>)[\s\S]*?(<\/button>)/g, '$1\n                <ArrowLeft className="w-5 h-5" />\n              $2');
login = login.replace(/(<button[^>]*type="submit"[^>]*aria-label="دخول الطالب"[^>]*>)[\s\S]*?(<\/button>)/g, '$1\n                <ArrowLeft className="w-5 h-5" />\n              $2');
login = login.replace(/\s*\{\/\* Quick Test Demo Credentials \*\/\}[\s\S]*?(?=\n\s*\<\/div\>\s*\n\s*\}\)\}\s*\n\s*\{\/\* TAB 2)/, '');
fs.writeFileSync(loginPath, login);

const profilePath = 'src/components/CumulativeProfileModal.tsx';
let profile = fs.readFileSync(profilePath, 'utf8');
profile = profile.replace(/\s*\{session\.mode !== 'student' && \(\s*<button\s*onClick=\{onClose\}\s*className="absolute left-3 top-3 sm:left-5 sm:top-5 z-30 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-700\/60 rounded-2xl transition-colors no-print"\s*aria-label="إغلاق الملف الشخصي"\s*title="إغلاق"\s*>\s*<X className="w-5 h-5"\s*\/?>\s*<\/button>\s*\)\}\s*/s, '\n');
const cardButton = /\s*<button\s*onClick=\{\(\) => onGenerateIDCard\(student\)\}\s*className="w-10 h-10 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center shadow-sm"\s*>\s*<QrCode className="w-4 h-4"\s*\/?>\s*<\/button>/s;
if (cardButton.test(profile)) profile = profile.replace(cardButton, (match) => `${match}\n\n              {session.mode !== 'student' && (\n                <button onClick={onClose} className="w-10 h-10 bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 border border-slate-700 rounded-2xl transition-all flex items-center justify-center shadow-sm" aria-label="إغلاق الملف الشخصي" title="إغلاق">\n                  <X className="w-4 h-4" />\n                </button>\n              )}`);
fs.writeFileSync(profilePath, profile);

await import('./fix-school-classes-safe.mjs');
console.log('Compact buttons and school class layer applied.');
