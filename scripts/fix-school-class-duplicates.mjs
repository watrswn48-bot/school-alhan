import fs from 'node:fs';

const edit = (path, transform) => {
  const before = fs.readFileSync(path, 'utf8');
  const after = transform(before);
  if (after !== before) fs.writeFileSync(path, after, 'utf8');
};

const schoolClassesBlock = "export const SCHOOL_CLASSES = ['كيجي','أولى وتانية','تالتة ورابعة','خامسة وسادسة','إعدادي','ثانوي'] as const;\nexport type SchoolClass = typeof SCHOOL_CLASSES[number];";

edit('src/services/storage.ts', (s) => {
  const escaped = schoolClassesBlock.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&');
  return s.replace(new RegExp(`(?:${escaped}\\n?){2,}`, 'g'), `${schoolClassesBlock}\n`);
});

edit('src/types/index.ts', (s) => {
  s = s.replace(/(?:schoolClass\\?: string;\\s*){2,}/g, 'schoolClass?: string;\n');
  return s;
});

edit('src/components/ClassesAndStudentsModule.tsx', (s) => {
  return s.replace(/(?:  const \[selectedClass, setSelectedClass\] = useState<string>\('ALL'\);\\n){2,}/g, "  const [selectedClass, setSelectedClass] = useState<string>('ALL');\n");
});

edit('src/components/CurriculaModule.tsx', (s) => {
  return s.replace(/(?: const \[selectedClass,setSelectedClass\]=useState\('all'\);){2,}/g, " const [selectedClass,setSelectedClass]=useState('all');");
});

console.log('Removed duplicate school-class declarations created by overlapping patches.');
