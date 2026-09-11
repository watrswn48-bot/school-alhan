import React, { useMemo, useState } from 'react';
import { GraduationCap, UserPlus, CheckCircle2, HardDrive } from 'lucide-react';
import { DeaconRank, UserSession } from '../types';
import { DEACON_RANKS, SCHOOL_LEVELS, SCHOOL_YEARS, getAcademicLevels, getAcademicYears, getStudents, saveStudent } from '../services/storage';
import { currentSchoolAcademicYear } from '../services/academicYearService';
import { SCHOOL_CLASSES } from '../services/schoolClassUtils';

interface Props { session: UserSession; onStudentSaved: (student: ReturnType<typeof saveStudent>) => void; }

function normalizePhotoSource(value: string): string {
  const input = value.trim();
  if (!input) return '';
  const driveId = input.match(/(?:drive\.google\.com\/file\/d\/|drive\.google\.com\/open\?id=|drive\.google\.com\/uc\?(?:[^#]*&)?id=)([a-zA-Z0-9_-]+)/)?.[1]
    || (input.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(input) ? input : '');
  return driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200` : input;
}

function nextUniqueStudentCode(students: ReturnType<typeof getStudents>): string {
  const used = new Set(students.map(s => s.studentCode.trim().toLowerCase()));
  let max = 0;
  for (const code of used) {
    const match = code.match(/^stu-\d{4}-(\d+)$/i);
    if (match) max = Math.max(max, Number(match[1]) || 0);
  }
  let n = Math.max(students.length, max) + 1;
  let candidate = `STU-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`;
  while (used.has(candidate.toLowerCase())) {
    n += 1;
    candidate = `STU-${new Date().getFullYear()}-${String(n).padStart(3, '0')}`;
  }
  return candidate;
}

export const AddStudentModule: React.FC<Props> = ({ session, onStudentSaved }) => {
  const levels = useMemo(() => getAcademicLevels(), []);
  const years = useMemo(() => getAcademicYears(), []);
  const canEdit = session.role === 'admin' || !!session.permissions?.canAddEditStudents;
  const makeForm = () => ({
    fullName: '', photoUrl: '', deaconRank: 'إبصالتس' as DeaconRank,
    level: levels[0] || 'المستوى الأول', year: years[0] || 'السنة الأولى',
    levelIndex: 0, yearIndex: 0, schoolClass: SCHOOL_CLASSES[0] as string, schoolLevel: SCHOOL_LEVELS[0] || '',
    schoolYear: SCHOOL_YEARS[0] || '', nationalId: '', phone: '', guardianPhone: '', notes: ''
  });
  const [form, setForm] = useState(makeForm);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState('');
  const set = (key: string, value: string) => setForm(p => ({ ...p, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaved(null);
    if (!form.fullName.trim() || !/^\d{14}$/.test(form.nationalId.trim())) {
      setError('الاسم والرقم القومي المكون من 14 رقم بيانات إجبارية.'); return;
    }
    if (!form.phone.trim() || !form.guardianPhone.trim()) {
      setError('هاتف الطالب وهاتف ولي الأمر بيانات إجبارية.'); return;
    }
    if (!form.schoolLevel || !form.schoolYear || !form.schoolClass || !form.level || !form.year || !form.deaconRank) {
      setError('جميع بيانات المراحل والرتبة الدراسية إجبارية.'); return;
    }
    const existingStudents = getStudents(true);
    const duplicateNationalId = existingStudents.find(s => !s.isDeleted && s.nationalId.trim() === form.nationalId.trim());
    if (duplicateNationalId) {
      setError(`الرقم القومي مسجل بالفعل باسم «${duplicateNationalId.fullName}».`); return;
    }
    const photoUrl = normalizePhotoSource(form.photoUrl);
    if (!photoUrl) { setError('الصورة الشخصية إجبارية: أدخل رابط الصورة أو كود Google Drive.'); return; }
    try {
      const levelIndex = Math.max(0, levels.indexOf(form.level));
      const yearIndex = Math.max(0, years.indexOf(form.year));
      const student = saveStudent({
        ...form,
        studentCode: nextUniqueStudentCode(existingStudents),
        photoUrl,
        levelIndex,
        yearIndex,
        schoolAcademicYear: currentSchoolAcademicYear(),
        nationalId: form.nationalId.trim(),
        phone: form.phone.trim(),
        guardianPhone: form.guardianPhone.trim(),
        notes: form.notes.trim()
      } as Partial<import('../types').Student>);
      setSaved(`تم حفظ بيانات الطالب «${student.fullName}» بنجاح — كود الطالب: ${student.studentCode}`);
      onStudentSaved(student); setForm(makeForm());
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر حفظ الطالب.'); }
  };

  if (!canEdit) return <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center"><GraduationCap className="w-12 h-12 mx-auto text-amber-500 mb-3"/><h2 className="text-lg font-black">إضافة الطلاب</h2><p className="text-xs text-slate-400 mt-2">هذه الوظيفة غير متاحة لحسابك.</p></div>;

  return <div className="space-y-6">
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl"><h2 className="text-xl font-black text-slate-100 flex items-center gap-2"><GraduationCap className="w-6 h-6 text-amber-400"/>إضافة طالب جديد بالمدرسة</h2><p className="text-xs text-slate-400 mt-1">جميع البيانات المطلوبة إجبارية ما عدا الملاحظات.</p></div>
    {saved && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl p-4 text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5"/>{saved}</div>}
    {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl p-4 text-xs font-bold">{error}</div>}
    <form onSubmit={submit} className="bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="label">الاسم الرباعي كاملاً: <span className="req">*</span></label><input required value={form.fullName} onChange={e=>set('fullName',e.target.value)} placeholder="مثال: يوحنا سمير حنا فهمي" className="field"/></div>
        <div className="sm:col-span-2"><label className="label">الصورة الشخصية: <span className="req">*</span></label><div className="relative"><HardDrive className="absolute right-3 top-2.5 w-4 h-4 text-slate-500"/><input required type="text" value={form.photoUrl} onChange={e=>set('photoUrl',e.target.value)} placeholder="رابط صورة مباشر أو كود Google Drive" className="field pr-9"/><p className="text-[10px] text-slate-500 mt-1">الصورة من خلال رابط فقط. لو الصورة على Google Drive: اجعل الملف متاحًا لمن لديه الرابط، ثم ضع رابط المشاركة أو كود الملف هنا.</p></div>{form.photoUrl&&<img src={normalizePhotoSource(form.photoUrl)} alt="معاينة الصورة" className="mt-2 w-16 h-16 rounded-2xl object-cover ring-1 ring-amber-500/40"/>}</div>
        <div><label className="label">الرتبة الشماسية: <span className="req">*</span></label><select required value={form.deaconRank} onChange={e=>set('deaconRank',e.target.value)} className="field">{DEACON_RANKS.map(r=><option key={r}>{r}</option>)}</select></div>
        <div><label className="label">الرقم القومي (14 رقم): <span className="req">*</span></label><input required inputMode="numeric" pattern="[0-9]{14}" maxLength={14} value={form.nationalId} onChange={e=>set('nationalId',e.target.value.replace(/\D/g,''))} placeholder="30201011234567" className="field font-mono"/></div>
        <div className="sm:col-span-2 pt-2 border-t border-slate-800"><span className="text-xs font-bold text-amber-400 block mb-2">🎓 بيانات مدرسة الشمامسة (بالخدمة):</span></div>
        <div><label className="label">المرحلة الدراسية بالخدمة (المستوى): <span className="req">*</span></label><select required value={form.level} onChange={e=>{const v=e.target.value;setForm(p=>({...p,level:v,levelIndex:Math.max(0,levels.indexOf(v))}))}} className="field">{levels.map(x=><option key={x}>{x}</option>)}</select></div>
        <div><label className="label">السنة الدراسية بالخدمة: <span className="req">*</span></label><select required value={form.year} onChange={e=>{const v=e.target.value;setForm(p=>({...p,year:v,yearIndex:Math.max(0,years.indexOf(v))}))}} className="field">{years.map(x=><option key={x}>{x}</option>)}</select></div>
        <div className="sm:col-span-2 pt-2 border-t border-slate-800"><span className="text-xs font-bold text-violet-400 block mb-2">📚 فصل مدرسة الألحان:</span></div><div><label className="label">الفصل: <span className="req">*</span></label><select required value={form.schoolClass} onChange={e=>set('schoolClass',e.target.value)} className="field">{SCHOOL_CLASSES.map(x=><option key={x}>{x}</option>)}</select></div>
        <div className="sm:col-span-2 pt-2 border-t border-slate-800"><span className="text-xs font-bold text-sky-400 block mb-2">🏫 بيانات التعليم والمدرسة (المدرسة العادية):</span></div>
        <div><label className="label">المرحلة الدراسية بالمدرسة: <span className="req">*</span></label><select required value={form.schoolLevel} onChange={e=>set('schoolLevel',e.target.value)} className="field">{SCHOOL_LEVELS.map(x=><option key={x}>{x}</option>)}</select></div>
        <div><label className="label">السنة الدراسية بالمدرسة: <span className="req">*</span></label><select required value={form.schoolYear} onChange={e=>set('schoolYear',e.target.value)} className="field">{SCHOOL_YEARS.map(x=><option key={x}>{x}</option>)}</select></div>
        <div><label className="label">هاتف الطالب الشخصي: <span className="req">*</span></label><input required inputMode="tel" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="01200000000" className="field font-mono"/></div>
        <div><label className="label">هاتف ولي الأمر (الطوارئ): <span className="req">*</span></label><input required inputMode="tel" value={form.guardianPhone} onChange={e=>set('guardianPhone',e.target.value)} placeholder="01000000000" className="field font-mono"/></div>
        <div className="sm:col-span-2"><label className="label">ملاحظات وقيد الخادم:</label><textarea rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} className="field resize-none" placeholder="اختياري"/></div>
      </div>
      <div className="flex justify-end pt-4 border-t border-slate-800"><button type="submit" className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md flex items-center gap-2"><UserPlus className="w-4 h-4"/>حفظ البيانات</button></div>
    </form>
    <style>{`.label{display:block;color:#cbd5e1;font-weight:600;margin-bottom:.25rem}.req{color:#fb7185}.field{width:100%;background:#020617;border:1px solid #1e293b;border-radius:.75rem;padding:.5rem .75rem;color:#f1f5f9;outline:none}.field:focus{border-color:#f59e0b}`}</style>
  </div>;
};
