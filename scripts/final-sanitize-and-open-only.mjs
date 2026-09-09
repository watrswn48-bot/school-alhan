import fs from 'node:fs';

const edit = (path, fn) => {
  let s = fs.readFileSync(path, 'utf8');
  const n = fn(s);
  if (n !== s) fs.writeFileSync(path, n, 'utf8');
};

const collapse = (s, token) => {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return s.replace(new RegExp(`(?:${escaped})(?:\\n\\s*${escaped})+`, 'g'), token);
};

// Remove duplicate declarations accidentally produced by earlier class-layer patches.
edit('src/services/storage.ts', s => {
  s = collapse(s, "export const SCHOOL_CLASSES = ['كيجي','أولى وتانية','تالتة ورابعة','خامسة وسادسة','إعدادي','ثانوي'] as const;\nexport type SchoolClass = typeof SCHOOL_CLASSES[number];");
  return s;
});
edit('src/types/index.ts', s => collapse(s, '  schoolClass?: string;\n'));
edit('src/services/schoolSystem.ts', s => collapse(s, '  schoolClass?: string;\n'));
edit('src/components/ClassesAndStudentsModule.tsx', s => {
  s = collapse(s, '  const [selectedClass, setSelectedClass] = useState<string>(\'ALL\');\n');
  s = s.replace(/(\n\s*SCHOOL_CLASSES,\n)(\s*SCHOOL_CLASSES,\n)+/g, '$1');
  return s;
});
edit('src/components/CurriculaModule.tsx', s => {
  s = collapse(s, " const [selectedClass,setSelectedClass]=useState('all');");
  s = collapse(s, " const [formClass,setFormClass]=useState<string>(SCHOOL_CLASSES[0]);");
  s = s.replace(/(\n\s*SCHOOL_CLASSES,\n)(\s*SCHOOL_CLASSES,\n)+/g, '$1');
  // The audio player is intentionally disabled: materials use one simple Open button.
  s = s.replace(/\{hasAudio&&<button onClick=\{\(\)=>handlePlayAudio\(item\)\}[\s\S]*?<\/button>\}/, '');
  s = s.replace(/\{item\.fileUrl&&<a /g, '{item.fileUrl&&<a ');
  // If an existing Open anchor is present, keep it; otherwise the next UI patch can add it.
  return s;
});
edit('src/components/AdminPanelModule.tsx', s => {
  const line = "    {activeAdminTab==='subjects' && <SubjectsManagementModule session={session} />}";
  const re = new RegExp(`(?:${line.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})(?:\\n\\s*${line.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})+`, 'g');
  return s.replace(re, line);
});

console.log('Final sanitize complete; duplicate class declarations removed and curriculum audio action removed.');
