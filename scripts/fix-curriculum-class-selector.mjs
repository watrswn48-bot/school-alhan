import fs from 'node:fs';
const path='src/components/CurriculaModule.tsx';
let s=fs.readFileSync(path,'utf8');
const options='{SCHOOL_CLASSES.map(c=><option key={c}>{c}</option>)}';
const re=/<select value=\{formClass\}[^>]*>\{SCHOOL_CLASSES\.map\(c=>.*?\)<\/select>/;
const replacement=`<label className="block text-xs font-bold text-slate-300">الفصل\n<select value={formClass} onChange={e=>{setFormClass(e.target.value);setFormSubject('');}} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs" required>${options}</select>\n</label>`;
if(re.test(s) && !s.includes('>الفصل\n<select value={formClass}')) s=s.replace(re,replacement);
fs.writeFileSync(path,s,'utf8');
console.log('Curriculum upload class selector fixed.');
