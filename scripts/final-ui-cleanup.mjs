import fs from 'node:fs';

const p = 'src/components/CumulativeProfileModal.tsx';
let s = fs.readFileSync(p, 'utf8');

// Remove the obsolete curriculum tab completely. Curricula stays in the main curricula section.
s = s.replace(/\n?import \{ CurriculaModule \} from ['"]\.\/CurriculaModule['"];\n?/, '\n');
s = s.replace(/<button\s+onClick=\{\(\) => setActiveTab\('curricula'\)\}[\s\S]*?<\/button>/m, '');
s = s.replace(/\| 'curricula'/g, '');
s = s.replace(/\{activeTab === 'curricula' &&[\s\S]*?\n\s*\}/m, '');

// Keep staff close button isolated in the corner and make header actions icon-only.
s = s.replace(/className="absolute left-6 top-6 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-2xl transition-colors no-print z-20"/, 'className="absolute left-3 top-3 sm:left-5 sm:top-5 z-30 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-700/60 rounded-2xl transition-colors no-print"');
s = s.replace(/className="px-4 py-2\.5 bg-rose-500\/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500\/30 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"/, 'className="w-10 h-10 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-2xl text-xs font-bold transition-all flex items-center justify-center shadow-sm"');
s = s.replace(/\n\s*تسجيل الخروج\n\s*<\/button>/m, '\n                </button>');
s = s.replace(/className="px-4 py-2\.5 bg-amber-500\/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500\/40 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"/, 'className="w-10 h-10 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500\/40 rounded-2xl text-xs font-bold transition-all flex items-center justify-center shadow-sm"');
s = s.replace(/\n\s*طباعة التقرير\n\s*<\/button>/m, '\n                </button>');
s = s.replace(/className="px-4 py-2\.5 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"/, 'className="w-10 h-10 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center shadow-sm"');
s = s.replace(/\n\s*بطاقة الهوية الذكية\n\s*<\/button>/m, '\n                </button>');

fs.writeFileSync(p, s);

const cp = 'src/components/CurriculaModule.tsx';
let c = fs.readFileSync(cp, 'utf8');
// The subject selected from إضافة المواد is the real subject field. Remove the redundant optional material-name field.
c = c.replace(/<input\s+type="text"\s+value=\{formFileName\}[\s\S]*?placeholder="اسم المادة \(اختياري\)"[\s\S]*?\/>/m, '');
// Also remove the unused standalone state if it becomes unused; keep file-name state because uploaded files use it automatically.
fs.writeFileSync(cp, c);

console.log('Final UI cleanup applied safely and idempotently.');
