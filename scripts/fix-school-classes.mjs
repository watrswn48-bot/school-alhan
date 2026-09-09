import fs from 'node:fs';

const files = {
  types: 'src/types/index.ts',
  storage: 'src/services/storage.ts',
  system: 'src/services/schoolSystem.ts',
  subjects: 'src/components/SubjectsManagementModule.tsx',
  addStudent: 'src/components/AddStudentModule.tsx',
  curricula: 'src/components/CurriculaModule.tsx',
  results: 'src/components/ResultsEntryModule.tsx',
  lectures: 'src/components/LectureSystemModule.tsx',
  classes: 'src/components/ClassesAndStudentsModule.tsx',
};
const read = p => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s, 'utf8');
const replace = (s, a, b, label) => {
  if (!s.includes(a)) throw new Error(`Class patch target not found: ${label}`);
  return s.replace(a, b);
};

// 1) Central class vocabulary. A class is independent from the 8-year chant matrix.
let s = read(files.storage);
s = replace(s, "export const ACADEMIC_YEARS: AcademicYear[] = [\n  'السنة الأولى',\n  'السنة الثانية',\n  'السنة الثالثة',\n  'السنة الرابعة',\n];", "export const ACADEMIC_YEARS: AcademicYear[] = [\n  'السنة الأولى',\n  'السنة الثانية',\n  'السنة الثالثة',\n  'السنة الرابعة',\n];\n\nexport const SCHOOL_CLASSES = [\n  'كيجي',\n  'أولى وتانية',\n  'تالتة ورابعة',\n  'خامسة وسادسة',\n  'إعدادي',\n  'ثانوي',\n] as const;\nexport type SchoolClass = typeof SCHOOL_CLASSES[number];", 'storage classes');
write(files.storage, s);

s = read(files.types);
s = replace(s, '  yearIndex: number;\n  schoolLevel?: string;', '  yearIndex: number;\n  schoolClass?: string;\n  schoolLevel?: string;', 'Student class field');
s = replace(s, 'export interface Lecture { id: string; title: string; speaker: string; speakerServantId?: string; levelName: AcademicLevel; yearName?: AcademicYear;', 'export interface Lecture { id: string; title: string; speaker: string; speakerServantId?: string; levelName: AcademicLevel; yearName?: AcademicYear; schoolClass?: string;', 'Lecture class field');
s = replace(s, 'export interface CurriculumMaterial { id: string; title: string; subject: string; levelName: string; yearName?: string;', 'export interface CurriculumMaterial { id: string; title: string; subject: string; levelName: string; yearName?: string; schoolClass?: string;', 'Curriculum class field');
write(files.types, s);

// 2) Subjects: class is part of the unique subject scope and student lookup.
s = read(files.system);
s = replace(s, '  yearName: string;\n  term: AcademicTerm;', '  yearName: string;\n  schoolClass?: string;\n  term: AcademicTerm;', 'ChantSubject class field');
s = replace(s, 'if (!name || !input.levelName || !input.yearName || !input.term) throw new Error(\'اسم المادة والسنة والترم بيانات مطلوبة.\');', "if (!name || !input.levelName || !input.yearName || !input.schoolClass || !input.term) throw new Error('اسم المادة والمستوى والسنة والفصل والترم بيانات مطلوبة.');", 'subject validation');
s = replace(s, "s.name.trim() === name && s.levelName === input.levelName && s.yearName === input.yearName && s.term === input.term", "s.name.trim() === name && s.levelName === input.levelName && s.yearName === input.yearName && s.schoolClass === input.schoolClass && s.term === input.term", 'subject duplicate scope');
s = replace(s, "yearName: input.yearName,\n    term: input.term,", "yearName: input.yearName,\n    schoolClass: input.schoolClass,\n    term: input.term,", 'subject save scope');
s = replace(s, "return getChantSubjects().filter(s => s.levelName === student.level && s.yearName === student.year && s.term === term);", "return getChantSubjects().filter(s => s.levelName === student.level && s.yearName === student.year && s.schoolClass === student.schoolClass && s.term === term);", 'subjectsForStudent class');
s = replace(s, "const requiredSubjects = getChantSubjects().filter(s => s.levelName === student.level && s.yearName === student.year);", "const requiredSubjects = getChantSubjects().filter(s => s.levelName === student.level && s.yearName === student.year && s.schoolClass === student.schoolClass);", 'pass required subjects class');
write(files.system, s);

// 3) Add Student: explicit class, alongside the regular-school education data.
s = read(files.addStudent);
s = replace(s, "import { DEACON_RANKS, SCHOOL_LEVELS, SCHOOL_YEARS, getAcademicLevels, getAcademicYears, saveStudent } from '../services/storage';", "import { DEACON_RANKS, SCHOOL_CLASSES, SCHOOL_LEVELS, SCHOOL_YEARS, getAcademicLevels, getAcademicYears, saveStudent } from '../services/storage';", 'add student imports');
s = replace(s, "levelIndex: 0, yearIndex: 0, schoolLevel: SCHOOL_LEVELS[0] || '',", "levelIndex: 0, yearIndex: 0, schoolClass: SCHOOL_CLASSES[0], schoolLevel: SCHOOL_LEVELS[0] || '',", 'add student form class');
s = replace(s, "if (!form.schoolLevel || !form.schoolYear || !form.level || !form.year || !form.deaconRank)", "if (!form.schoolLevel || !form.schoolYear || !form.schoolClass || !form.level || !form.year || !form.deaconRank)", 'add student validation class');
s = replace(s, '<div className="sm:col-span-2 pt-2 border-t border-slate-800"><span className="text-xs font-bold text-sky-400 block mb-2">🏫 بيانات التعليم والمدرسة (المدرسة العادية):</span></div>', '<div className="sm:col-span-2 pt-2 border-t border-slate-800"><span className="text-xs font-bold text-violet-400 block mb-2">📚 فصل مدرسة الألحان:</span></div><div><label className="label">الفصل: <span className="req">*</span></label><select required value={form.schoolClass} onChange={e=>set("schoolClass",e.target.value)} className="field">{SCHOOL_CLASSES.map(x=><option key={x}>{x}</option>)}</select><p className="text-[10px] text-slate-500 mt-1">الفصل يحدد حسب السن ومرحلة التعليم: كيجي، أولى وتانية، تالتة ورابعة، خامسة وسادسة، إعدادي، ثانوي.</p></div><div className="sm:col-span-2 pt-2 border-t border-slate-800"><span className="text-xs font-bold text-sky-400 block mb-2">🏫 بيانات التعليم والمدرسة (المدرسة العادية):</span></div>', 'add student class UI');
write(files.addStudent, s);

// 4) Subjects management: choose the class and show it in the list.
s = read(files.subjects);
s = replace(s, "import { getAcademicLevels, getAcademicYears } from '../services/storage';", "import { SCHOOL_CLASSES, getAcademicLevels, getAcademicYears } from '../services/storage';", 'subjects imports');
s = replace(s, "  const [yearName, setYearName] = useState(years[0] || 'السنة الأولى');\n  const [term,", "  const [yearName, setYearName] = useState(years[0] || 'السنة الأولى');\n  const [schoolClass, setSchoolClass] = useState<string>(SCHOOL_CLASSES[0]);\n  const [term,", 'subjects class state');
s = replace(s, "items.filter(x => x.levelName === levelName && x.yearName === yearName && x.term === term)", "items.filter(x => x.levelName === levelName && x.yearName === yearName && x.schoolClass === schoolClass && x.term === term)", 'subjects grouped class');
s = replace(s, "await saveChantSubject({ name, levelName, yearName, term, createdBy", "await saveChantSubject({ name, levelName, yearName, schoolClass, term, createdBy", 'subjects save class');
s = replace(s, "<label className=\"block text-xs font-bold text-slate-300\">الترم<select", "<label className=\"block text-xs font-bold text-slate-300\">الفصل<select value={schoolClass} onChange={e=>setSchoolClass(e.target.value)} className=\"mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm\">{SCHOOL_CLASSES.map(x=><option key={x}>{x}</option>)}</select></label>\n        <label className=\"block text-xs font-bold text-slate-300\">الترم<select", 'subjects class UI');
s = replace(s, "<select value={yearName} onChange={e=>setYearName(e.target.value)} className=\"bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1\">{years.map(x=><option key={x}>{x}</option>)}</select>\n          <select value={term}", "<select value={yearName} onChange={e=>setYearName(e.target.value)} className=\"bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1\">{years.map(x=><option key={x}>{x}</option>)}</select>\n          <select value={schoolClass} onChange={e=>setSchoolClass(e.target.value)} className=\"bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1\">{SCHOOL_CLASSES.map(x=><option key={x}>{x}</option>)}</select>\n          <select value={term}", 'subjects filter class UI');
s = replace(s, "{s.levelName} • {s.yearName} • {s.term}", "{s.levelName} • {s.yearName} • {s.schoolClass} • {s.term}", 'subjects list class');
write(files.subjects, s);

// 5) Curriculum: class filters and the selected class scopes the subject dropdown.
s = read(files.curricula);
s = replace(s, "import { getAcademicLevels, getAcademicYears } from '../services/storage';", "import { SCHOOL_CLASSES, getAcademicLevels, getAcademicYears } from '../services/storage';", 'curricula imports');
s = replace(s, "const [formSubject,setFormSubject]=useState(''); const [formLevel", "const [formSubject,setFormSubject]=useState(''); const [formClass,setFormClass]=useState(SCHOOL_CLASSES[0]); const [formLevel", 'curricula form class');
s = replace(s, "const [selectedYear,setSelectedYear]=useState(studentYear||'all');", "const [selectedYear,setSelectedYear]=useState(studentYear||'all'); const [selectedClass,setSelectedClass]=useState('all');", 'curricula filter class state');
s = replace(s, "const availableSubjects=subjectsList.filter(s=>s.levelName===formLevel&&s.yearName===formYear&&s.term===formTerm);", "const availableSubjects=subjectsList.filter(s=>s.levelName===formLevel&&s.yearName===formYear&&s.schoolClass===formClass&&s.term===formTerm);", 'curricula available subjects class');
s = replace(s, "setFormTitle('');setFormTerm('الترم الأول');setFormSubject('');setFormLevel", "setFormTitle('');setFormTerm('الترم الأول');setFormSubject('');setFormClass(SCHOOL_CLASSES[0]);setFormLevel", 'curricula reset class');
s = replace(s, "subject:formSubject,levelName:formLevel,yearName:formYear,materialType", "subject:formSubject,levelName:formLevel,yearName:formYear,schoolClass:formClass,materialType", 'curricula save class');
s = replace(s, "if(selectedYear!=='all'&&item.yearName&&item.yearName!=='لكل السنوات'&&item.yearName!==selectedYear)return false;", "if(selectedYear!=='all'&&item.yearName&&item.yearName!=='لكل السنوات'&&item.yearName!==selectedYear)return false;if(selectedClass!=='all'&&item.schoolClass&&item.schoolClass!==selectedClass)return false;", 'curricula list class filter');
s = replace(s, "<select value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)}", "<select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className=\"bg-slate-900 text-xs text-slate-200 rounded-xl p-2\"><option value=\"all\">كافة الفصول</option>{SCHOOL_CLASSES.map(c=><option key={c}>{c}</option>)}</select><select value={selectedSubject} onChange={e=>setSelectedSubject(e.target.value)}", 'curricula class filter UI');
s = replace(s, "<select value={formYear} onChange={e=>{const v=e.target.value;setFormYear(v);syncSubjectForSelection(formLevel,v,formTerm);}}", "<select value={formYear} onChange={e=>{const v=e.target.value;setFormYear(v);syncSubjectForSelection(formLevel,v,formTerm);}}", 'curricula year anchor');
// Insert class selector before the existing subject selector in the upload form.
s = replace(s, "<select value={formSubject}", "<select value={formClass} onChange={e=>{const v=e.target.value;setFormClass(v);setFormSubject('');}} className=\"w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs\">{SCHOOL_CLASSES.map(c=><option key={c}>{c}</option>)}</select><select value={formSubject}", 'curricula upload class UI');
write(files.curricula, s);

// 6) Results: explicit class selector, students filtered by it, and subjects are class scoped.
s = read(files.results);
s = replace(s, "import { getStudents, getSubjectResults, saveSubjectResult } from '../services/storage';", "import { SCHOOL_CLASSES, getStudents, getSubjectResults, saveSubjectResult } from '../services/storage';", 'results imports');
s = replace(s, "  const students = getStudents().filter(s => !s.isDeleted);\n  const [studentId", "  const allStudents = getStudents().filter(s => !s.isDeleted);\n  const [schoolClass, setSchoolClass] = useState<string>(allStudents[0]?.schoolClass || SCHOOL_CLASSES[0]);\n  const students = allStudents.filter(s => s.schoolClass === schoolClass);\n  const [studentId", 'results class filtering');
s = replace(s, "return getChantSubjects().filter(s => s.levelName === student.level && s.yearName === student.year && s.term === term);", "return getChantSubjects().filter(s => s.levelName === student.level && s.yearName === student.year && s.schoolClass === student.schoolClass && s.term === term);", 'results subjects class');
s = replace(s, "<label className=\"text-xs font-bold text-slate-300\">الطالب<select", "<label className=\"text-xs font-bold text-slate-300\">الفصل<select value={schoolClass} onChange={e=>{setSchoolClass(e.target.value);setStudentId(allStudents.find(s=>s.schoolClass===e.target.value)?.id||'');}} className=\"mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5\">{SCHOOL_CLASSES.map(c=><option key={c}>{c}</option>)}</select></label><label className=\"text-xs font-bold text-slate-300\">الطالب<select", 'results class UI');
s = replace(s, "<div className=\"bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3\">", "<div className=\"bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-4 gap-3\">", 'results grid');
write(files.results, s);

// 7) Lectures: class is part of a lecture and visible metadata.
s = read(files.lectures);
s = replace(s, "import { closeLectureAndMarkAbsent, getAcademicLevels, getAcademicYears", "import { SCHOOL_CLASSES, closeLectureAndMarkAbsent, getAcademicLevels, getAcademicYears", 'lectures imports');
s = replace(s, "yearName:getAcademicYears()[0]||'السنة الأولى',dateStr", "yearName:getAcademicYears()[0]||'السنة الأولى',schoolClass:SCHOOL_CLASSES[0],dateStr", 'lecture form class');
s = replace(s, "levelName:form.levelName,yearName:form.yearName,dateStr", "levelName:form.levelName,yearName:form.yearName,schoolClass:form.schoolClass,dateStr", 'lecture save class');
s = replace(s, "{selected.levelName} {selected.yearName?`/ ${selected.yearName}`:''}", "{selected.levelName} {selected.yearName?`/ ${selected.yearName}`:''} • {selected.schoolClass||'بدون فصل'}", 'lecture selected class display');
s = replace(s, "<div className=\"grid grid-cols-1 sm:grid-cols-2 gap-3\"><select value={form.levelName}", "<div className=\"grid grid-cols-1 sm:grid-cols-2 gap-3\"><select value={form.levelName}", 'lecture level anchor');
s = replace(s, "</select><select value={form.yearName}", "</select><select value={form.yearName}", 'lecture year anchor');
s = replace(s, "</select></div><div className=\"grid grid-cols-1 sm:grid-cols-2 gap-3\"><input type=\"date\"", "</select><select value={form.schoolClass} onChange={e=>setForm({...form,schoolClass:e.target.value})} className=\"bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5\">{SCHOOL_CLASSES.map(c=><option key={c}>{c}</option>)}</select></div><div className=\"grid grid-cols-1 sm:grid-cols-2 gap-3\"><input type=\"date\"", 'lecture class UI');
s = replace(s, "• {l.dateStr}</div>", "• {l.dateStr} • {l.schoolClass||'بدون فصل'}</div>", 'lecture list class display');
write(files.lectures, s);

// 8) Classes & Students: class filter and display class in export/table/card contexts.
s = read(files.classes);
s = replace(s, "  SCHOOL_YEARS,\n} from '../services/storage';", "  SCHOOL_YEARS,\n  SCHOOL_CLASSES,\n} from '../services/storage';", 'classes imports');
s = replace(s, "  const [selectedYear, setSelectedYear] = useState<string>('ALL');", "  const [selectedYear, setSelectedYear] = useState<string>('ALL');\n  const [selectedClass, setSelectedClass] = useState<string>('ALL');", 'classes filter state');
s = replace(s, "    if (selectedYear !== 'ALL' && s.year !== selectedYear) return false;", "    if (selectedYear !== 'ALL' && s.year !== selectedYear) return false;\n    if (selectedClass !== 'ALL' && s.schoolClass !== selectedClass) return false;", 'classes filtering');
s = replace(s, "const headers = ['كود الطالب', 'الاسم بالكامل', 'الرتبة', 'مرحلة الخدمة', 'سنة الخدمة',", "const headers = ['كود الطالب', 'الاسم بالكامل', 'الرتبة', 'مرحلة الخدمة', 'سنة الخدمة', 'الفصل',", 'classes export header');
s = replace(s, "      s.year,\n      s.schoolLevel || '-',", "      s.year,\n      s.schoolClass || '-',\n      s.schoolLevel || '-',", 'classes export value');
s = replace(s, "          <button\n            onClick={() => setSelectedYear('ALL')}", "          <button\n            onClick={() => setSelectedClass('ALL')}", 'classes selector anchor');
// Add a compact class selector after the year pills block if the exact heading exists.
s = replace(s, "            السنة/الفصل:", "            السنة/الفصل:", 'classes existing heading');
s = replace(s, "          {academicYears.map((yr) => {", "          {SCHOOL_CLASSES.map((cls) => {\n            const isSelected = selectedClass === cls;\n            return <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${isSelected ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}`}>{cls}</button>;\n          })}\n\n          {academicYears.map((yr) => {", 'classes pills');
write(files.classes, s);

console.log('Applied school classes across students, subjects, curricula, results, lectures, and class browsing.');
