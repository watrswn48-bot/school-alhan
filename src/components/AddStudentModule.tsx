import React, { useMemo, useState } from 'react';
import { GraduationCap, UserPlus, CheckCircle2 } from 'lucide-react';
import { DeaconRank, UserSession } from '../types';
import { DEACON_RANKS, SCHOOL_LEVELS, SCHOOL_YEARS, getAcademicLevels, getAcademicYears, saveStudent } from '../services/storage';

interface Props { session: UserSession; }

export const AddStudentModule: React.FC<Props> = ({ session }) => {
  const academicLevels = useMemo(() => getAcademicLevels(), []);
  const academicYears = useMemo(() => getAcademicYears(), []);
  const canEdit = session.role === 'admin' || session.permissions?.canAddEditStudents;
  const [form, setForm] = useState({
    fullName: '', studentCode: '', nationalId: '', photoUrl: '', deaconRank: 'إبصالتس' as DeaconRank,
    level: academicLevels[0] || 'المستوى الأول', year: academicYears[0] || 'السنة الأولى',
    schoolLevel: SCHOOL_LEVELS[0] || '', schoolYear: SCHOOL_YEARS[0] || '', phone: '', guardianPhone: '', notes: ''
  });
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState('');

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const reset = () => setForm({ fullName:'', studentCode:'', nationalId:'', photoUrl:'', deaconRank:'إبصالتس', level:academicLevels[0]||'المستوى الأول', year:academicYears[0]||'السنة الأولى', schoolLevel:SCHOOL_LEVELS[0]||'', schoolYear:SCHOOL_YEARS[0]||'', phone:'', guardianPhone:'', notes:'' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaved(null);
    if (!canEdit) return;
    try {
      const levelIndex = Math.max(0, academicLevels.indexOf(form.level));
      const yearIndex = Math.max(0, academicYears.indexOf(form.year));
      const student = saveStudent({ ...form, levelIndex, yearIndex });
      setSaved(`تمت إضافة الطالب «${student.fullName}» بنجاح — كود الطالب: ${student.studentCode}`);
      reset();
    } catch (err) { setError(err instanceof Error ? err.message : 'تعذر إضافة الطالب.'); }
  };

  if (!canEdit) return <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center"><GraduationCap className="w-12 h-12 mx-auto text-amber-500 mb-3"/><h2 className="text-lg font-black">إضافة الطلاب</h2><p className="text-xs text-slate-400 mt-2">هذه الوظيفة غير متاحة لحسابك.</p></div>;

  return <div className="space-y-5">
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-500/15 text-amber-400 rounded-2xl border border-amber-500/30"><UserPlus className="w-6 h-6"/></div>
        <div><h2 className="text-xl font-black">إضافة الطلاب</h2><p className="text-xs text-slate-400 mt-1">إضافة طالب جديد في قسم مستقل، بدون الدخول إلى الفصول والطلاب.</p></div>
      </div>
    </div>

    {saved && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl p-4 text-sm font-bold flex items-center gap-2"><CheckCircle2 className="w-5 h-5 shrink-0"/>{saved}</div>}
    {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl p-4 text-xs font-bold">{error}</div>}

    <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5 text-xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><label className="block text-slate-300 font-semibold mb-1">الاسم الرباعي كاملاً <span className="text-rose-400">*</span></label><input required value={form.fullName} onChange={e=>update('fullName',e.target.value)} placeholder="مثال: يوحنا سمير حنا فهمي" className="field" /></div>
        <div><label className="block text-slate-300 font-semibold mb-1">كود الطالب</label><input value={form.studentCode} onChange={e=>update('studentCode',e.target.value)} placeholder="يُنشأ تلقائياً إذا تُرك فارغاً" className="field font-mono" /></div>
        <div><label className="block text-slate-300 font-semibold mb-1">الرقم القومي</label><input maxLength={14} value={form.nationalId} onChange={e=>update('nationalId',e.target.value)} placeholder="14 رقم" className="field font-mono" /></div>
        <div className="sm:col-span-2"><label className="block text-slate-300 font-semibold mb-1">رابط الصورة الشخصية</label><input type="url" value={form.photoUrl} onChange={e=>update('photoUrl',e.target.value)} placeholder="رابط الصورة (اختياري)" className="field font-mono" /></div>
        <div><label className="block text-slate-300 font-semibold mb-1">الرتبة الشماسية</label><select value={form.deaconRank} onChange={e=>update('deaconRank',e.target.value)} className="field">{DEACON_RANKS.map(r=><option key={r}>{r}</option>)}</select></div>
      </div>
      <div className="pt-3 border-t border-slate-800"><h3 className="text-sm font-black text-amber-400 mb-3">بيانات مدرسة الشمامسة</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="block text-slate-300 font-semibold mb-1">المرحلة بالخدمة</label><select value={form.level} onChange={e=>update('level',e.target.value)} className="field">{academicLevels.map(x=><option key={x}>{x}</option>)}</select></div>
        <div><label className="block text-slate-300 font-semibold mb-1">السنة بالخدمة</label><select value={form.year} onChange={e=>update('year',e.target.value)} className="field">{academicYears.map(x=><option key={x}>{x}</option>)}</select></div>
      </div></div>
      <div className="pt-3 border-t border-slate-800"><h3 className="text-sm font-black text-sky-400 mb-3">بيانات المدرسة العادية</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="block text-slate-300 font-semibold mb-1">المرحلة الدراسية</label><select value={form.schoolLevel} onChange={e=>update('schoolLevel',e.target.value)} className="field">{SCHOOL_LEVELS.map(x=><option key={x}>{x}</option>)}</select></div>
        <div><label className="block text-slate-300 font-semibold mb-1">السنة الدراسية</label><select value={form.schoolYear} onChange={e=>update('schoolYear',e.target.value)} className="field">{SCHOOL_YEARS.map(x=><option key={x}>{x}</option>)}</select></div>
      </div></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
        <div><label className="block text-slate-300 font-semibold mb-1">هاتف الطالب</label><input value={form.phone} onChange={e=>update('phone',e.target.value)} className="field font-mono" /></div>
        <div><label className="block text-slate-300 font-semibold mb-1">هاتف ولي الأمر</label><input value={form.guardianPhone} onChange={e=>update('guardianPhone',e.target.value)} className="field font-mono" /></div>
        <div className="sm:col-span-2"><label className="block text-slate-300 font-semibold mb-1">ملاحظات</label><textarea value={form.notes} onChange={e=>update('notes',e.target.value)} rows={3} className="field resize-none" /></div>
      </div>
      <button type="submit" className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"><UserPlus className="w-5 h-5"/>إضافة الطالب</button>
    </form>
    <style>{`.field{width:100%;background:#020617;border:1px solid #1e293b;border-radius:.75rem;padding:.65rem .75rem;color:#f1f5f9;outline:none}.field:focus{border-color:#f59e0b}`}</style>
  </div>;
};
