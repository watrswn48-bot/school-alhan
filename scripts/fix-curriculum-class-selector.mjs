import fs from 'node:fs';
const path='src/components/CurriculaModule.tsx';
let s=fs.readFileSync(path,'utf8');
const options='{SCHOOL_CLASSES.map(c=><option key={c}>{c}</option>)}';
// Make the class selector in the upload form explicit and keep the subject selector tied to it.
s=s.replace(/<select value=\{formClass\} onChange=\{e=>\{setFormClass\(e\.target\.value\);setFormSubject\('\'\);\}\}[^>]*>\{SCHOOL_CLASSES\.map\(c=>.*?\)</select>/,
`<label className="block text-xs font-bold text-slate-300">الفصل\n<select value={formClass} onChange={e=>{setFormClass(e.target.value);setFormSubject('');}} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs" required>${options}</select>\n</label>`);
if(!s.includes('الفصل')||!s.includes(options)){
  console.log('Curriculum class selector already explicit or pattern not found; leaving file unchanged.');
}else{
  fs.writeFileSync(path,s,'utf8');
  console.log('Curriculum upload class selector fixed.');
}
