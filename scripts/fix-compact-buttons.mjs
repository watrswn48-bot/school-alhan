import fs from 'node:fs';

function replaceOnce(path, from, to) {
  const content = fs.readFileSync(path, 'utf8');
  if (!content.includes(from)) {
    throw new Error(`Expected block not found in ${path}`);
  }
  fs.writeFileSync(path, content.replace(from, to));
}

const login = 'src/components/LoginModule.tsx';

replaceOnce(login,
`            <button\n              onClick={() => {\n              setLoginTab('servant');\n              setErrorMessage(null);\n            }}\n            className={\`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 \${\n              loginTab === 'servant'\n                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'\n                : 'text-slate-400 hover:text-slate-200'\n            }\`}\n          >\n            <ShieldCheck className="w-4 h-4" />\n            الخدام والإدارة\n          </button>`,
`          <button\n            onClick={() => {\n              setLoginTab('servant');\n              setErrorMessage(null);\n            }}\n            className={\`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 \${\n              loginTab === 'servant'\n                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'\n                : 'text-slate-400 hover:text-slate-200'\n            }\`}\n            aria-label="دخول الخدام والإدارة"\n            title="الخدام والإدارة"\n          >\n            <ShieldCheck className="w-5 h-5" />\n          </button>`);

replaceOnce(login,
`          <button\n            onClick={() => {\n              setLoginTab('student');\n              setErrorMessage(null);\n            }}\n            className={\`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 \${\n              loginTab === 'student'\n                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'\n                : 'text-slate-400 hover:text-slate-200'\n            }\`}\n          >\n            <User className="w-4 h-4" />\n            الطالب وولي الأمر\n          </button>`,
`          <button\n            onClick={() => {\n              setLoginTab('student');\n              setErrorMessage(null);\n            }}\n            className={\`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 \${\n              loginTab === 'student'\n                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'\n                : 'text-slate-400 hover:text-slate-200'\n            }\`}\n            aria-label="دخول الطالب وولي الأمر"\n            title="الطالب وولي الأمر"\n          >\n            <User className="w-5 h-5" />\n          </button>`);

const removeDemo = /\n            \{\/\* Quick Test Demo Credentials \*\}[\s\S]*?\n            <\/div>\n          <\/div>/;
let current = fs.readFileSync(login, 'utf8');
current = current.replace(removeDemo, '\n          </div>');
fs.writeFileSync(login, current);

replaceOnce(login,
`              <QrCode className="w-5 h-5" />\n              مسح الـ QR Code عبر الكاميرا`,
`              <QrCode className="w-5 h-5" />`);
replaceOnce(login,
`              <QrCode className="w-5 h-5" />\n              مسح الـ QR Code لبطاقة الهوية`,
`              <QrCode className="w-5 h-5" />`);
replaceOnce(login,
`                دخول الخادم\n                <ArrowLeft className="w-4 h-4" />`,
`                <ArrowLeft className="w-5 h-5" />`);
replaceOnce(login,
`                دخول الطالب\n                <ArrowLeft className="w-4 h-4" />`,
`                <ArrowLeft className="w-5 h-5" />`);

current = fs.readFileSync(login, 'utf8');
current = current.replace(/(onClick=\{\(\) => setIsScannerOpen\(true\)\}\n\s*className=\"[^\"]*\")/g, '$1 aria-label="مسح QR" title="مسح QR"');
current = current.replace(/(type="submit"\n\s*disabled=\{!secretCodeInput\.trim\(\)\}\n\s*className=\"[^\"]*\")/g, '$1 aria-label="دخول الخادم" title="دخول"');
current = current.replace(/(type="submit"\n\s*disabled=\{!studentInput\.trim\(\)\}\n\s*className=\"[^\"]*\")/g, '$1 aria-label="دخول الطالب" title="دخول"');
fs.writeFileSync(login, current);

const profile = 'src/components/CumulativeProfileModal.tsx';
let profileContent = fs.readFileSync(profile, 'utf8');
const closeBlock = /\n\{session\.mode !== 'student' && \(\n\s*<button\n\s*onClick=\{onClose\}[\s\S]*?<\/button>\n\s*\)\}\n/;
if (!closeBlock.test(profileContent)) throw new Error('Profile close button block not found');
profileContent = profileContent.replace(closeBlock, '\n');
const cardBlock = `              <button\n                onClick={() => onGenerateIDCard(student)}\n                className="w-10 h-10 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center shadow-sm"\n              >\n                <QrCode className="w-4 h-4" />\n              </button>`;
if (!profileContent.includes(cardBlock)) throw new Error('Profile ID card button not found');
const compactClose = `              ${cardBlock}\n\n              {session.mode !== 'student' && (\n                <button\n                  onClick={onClose}\n                  className="w-10 h-10 bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-400 border border-slate-700 rounded-2xl transition-all flex items-center justify-center shadow-sm"\n                  aria-label="إغلاق الملف الشخصي"\n                  title="إغلاق"\n                >\n                  <X className="w-4 h-4" />\n                </button>\n              )}`;
profileContent = profileContent.replace(cardBlock, compactClose);
fs.writeFileSync(profile, profileContent);

console.log('Applied compact login buttons and placed profile close/card buttons together.');
