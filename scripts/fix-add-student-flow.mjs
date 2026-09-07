import fs from 'node:fs';

const appPath = 'src/App.tsx';
const classesPath = 'src/components/ClassesAndStudentsModule.tsx';

const app = fs.readFileSync(appPath, 'utf8');
const appPatched = app.replace(
  '<div key={dataVersion} className="min-h-[70vh]">',
  '<div className="min-h-[70vh]">'
);
if (appPatched !== app) fs.writeFileSync(appPath, appPatched, 'utf8');

let classes = fs.readFileSync(classesPath, 'utf8');

const addButtonBlock = /\n\s*\{\/\* Add Student Button \*\/\}\n\s*\{canEdit && \(\n\s*<button\n\s*onClick=\{handleOpenAdd\}\n\s*className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500\/20 transition-all flex items-center gap-2"\n\s*>\n\s*<UserPlus className="w-4 h-4" \/>\n\s*إضافة طالب\n\s*<\/button>\n\s*\)\}/;
classes = classes.replace(addButtonBlock, '');

const handleOpenAddBlock = /\n\s*const handleOpenAdd = \(\) => \{[\s\S]*?\n\s*\};\n\n(?=\s*const handleOpenEdit)/;
classes = classes.replace(handleOpenAddBlock, '\n');

fs.writeFileSync(classesPath, classes, 'utf8');

console.log('Student add flow patch applied.');
