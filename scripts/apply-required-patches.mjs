import fs from 'node:fs';

function patchFile(path, fn) {
  const before = fs.readFileSync(path, 'utf8');
  const after = fn(before);
  if (after === before) console.log(`No change: ${path}`);
  else { fs.writeFileSync(path, after); console.log(`Patched: ${path}`); }
}

patchFile('src/services/storage.ts', (s) => {
  s = s.replace(
`export const DEACON_RANKS: DeaconRank[] = [
  'لم يشرس',
  'إبصالتس',
  'أغنسطس',
  'عريف',
  'إبذياكون',
  'دياكون',
  'أرشيدياكون',
];`,
`export const DEACON_RANKS: DeaconRank[] = [
  'بدون رتبة',
  'إبصالتس',
  'أغنسطس',
  'إبذياكون',
];`);

  const saveStudentNeedle = `export function saveStudent(studentData: Partial<Student>): Student {\n  const list = getStudents(true);`;
  if (!s.includes('كود الطالب مستخدم بالفعل لطالب آخر')) {
    s = s.replace(saveStudentNeedle, `${saveStudentNeedle}\n  const requestedCode = (studentData.studentCode || '').trim();\n  if (requestedCode) {\n    const duplicate = list.find((st) => st.id !== studentData.id && st.studentCode.trim().toLowerCase() === requestedCode.toLowerCase());\n    if (duplicate) {\n      throw new Error(\`كود الطالب مستخدم بالفعل لطالب آخر: \${duplicate.fullName}\`);\n    }\n  }`);
  }

  s = s.replace(`deaconRank: studentData.deaconRank || 'لم يشرس',`, `deaconRank: studentData.deaconRank || 'بدون رتبة',`);

  if (!s.includes('speakerServantId: lec.speakerServantId')) {
    s = s.replace(`    speaker: lec.speaker || 'أحد الخدام',`, `    speaker: lec.speaker || 'أحد الخدام',\n    speakerServantId: lec.speakerServantId,`);
  }

  if (!s.includes(`r.term === (res.term || 'سنوي')`)) {
    s = s.replace(
`        r.subjectName === res.subjectName &&
        (!res.examType || r.examType === res.examType)`,
`        r.subjectName === res.subjectName &&
        r.term === (res.term || 'سنوي') &&
        (!res.examType || r.examType === res.examType)`);
  }

  s = s.replace(`role: servant.role || 'servant',`, `role: servant.role || 'junior_servant',`);
  s = s.replace(
`permissions: servant.permissions || {
        canAddEditStudents: true,
        canSetRatings: true,
        canWriteNotes: true,
        canViewAnalytics: true,
      },`,
`permissions: servant.permissions || {
        canRecordAttendance: true,
      },`);
  return s;
});

patchFile('src/components/ClassesAndStudentsModule.tsx', (s) => {
  if (!s.includes('alert(err instanceof Error ? err.message')) {
    s = s.replace(
`    saveStudent(editingStudent);
    setIsAddEditModalOpen(false);
    setEditingStudent(null);
    refreshData();`,
`    try {
      saveStudent(editingStudent);
      setIsAddEditModalOpen(false);
      setEditingStudent(null);
      refreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'تعذر حفظ الطالب. تأكد أن كود الطالب غير مستخدم.');
    }`);
  }
  return s;
});

patchFile('src/components/AdminPanelModule.tsx', (s) => {
  s = s.replace(`const defaultForm = (): Partial<Servant> => ({ fullName: '', phone: '', role: 'servant', permissions: permissionsForRole('servant') });`, `const defaultForm = (): Partial<Servant> => ({ fullName: '', phone: '', role: 'junior_servant', permissions: permissionsForRole('junior_servant') });`);
  s = s.replace(`const role = (newServantData.role || 'servant') as ServantRole;`, `const role = (newServantData.role || 'junior_servant') as ServantRole;`);
  s = s.replace(
`<select value={newServantData.role||'servant'} onChange={e=>handleRoleChange(e.target.value as ServantRole)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"><option value="admin">أبونا / مسؤول النظام — كل الصلاحيات</option><option value="family_admin">أمين الأسرة — حضور + ملفات + تقييمات</option><option value="servant">خادم — حضور فقط افتراضياً</option></select>`,
`<select value={newServantData.role||'junior_servant'} onChange={e=>handleRoleChange(e.target.value as ServantRole)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100"><option value="admin">أبونا — كل الصلاحيات</option><option value="family_admin">أمين الأسرة — حضور + ملفات + تقييمات</option><option value="senior_servant">خادم كبير — حضور + إلقاء محاضرات وتقييم محاضراته</option><option value="junior_servant">خادم صغير — حضور فقط افتراضياً</option></select>`);
  s = s.replace('md:grid-cols-3 gap-3', 'md:grid-cols-4 gap-3');
  s = s.replace(`<b className="text-sky-400">أمين الأسرة</b><p className="text-[11px] text-slate-400 mt-1">الحضور والغياب + رفع الملفات + تقييم المحاضرات افتراضياً`, `<b className="text-sky-400">أمين الأسرة</b><p className="text-[11px] text-slate-400 mt-1">الحضور والغياب + رفع الملفات + تقييم المحاضرات افتراضياً`);
  return s;
});

console.log('Required project patches applied.');
