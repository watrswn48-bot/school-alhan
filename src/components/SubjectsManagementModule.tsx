import React, { useEffect, useMemo, useState } from 'react';
import { BookPlus, Trash2 } from 'lucide-react';
import { UserSession } from '../types';
import { getAcademicLevels, getAcademicYears } from '../services/storage';
import { AcademicTerm, ChantSubject, deleteChantSubject, getChantSubjects, refreshSubjectsFromFirebase, saveChantSubject } from '../services/schoolSystem';
import { sessionHasPermission } from '../services/permissions';

const SCHOOL_CLASSES = ['كيجي','أولى وتانية','تالتة ورابعة','خامسة وسادسة','إعدادي وثانوي'] as const;

export const SubjectsManagementModule: React.FC<{ session: UserSession }> = ({ session }) => {
  const levels = getAcademicLevels();
  const years = getAcademicYears();
  const [items, setItems] = useState<ChantSubject[]>(() => getChantSubjects());
  const [name, setName] = useState('');
  const [levelName, setLevelName] = useState(levels[0] || 'المستوى الأول');
  const [yearName, setYearName] = useState(years[0] || 'السنة الأولى');
  const [schoolClass, setSchoolClass] = useState<string>(SCHOOL_CLASSES[0]);
  const [term, setTerm] = useState<AcademicTerm>('الترم الأول');
  const [message, setMessage] = useState('');
  const canManage = session.role === 'admin' || session.userId === 'srv-admin-01' || sessionHasPermission(session, 'canManageSubjects');

  useEffect(() => { refreshSubjectsFromFirebase().then(setItems); }, []);
  const grouped = useMemo(() => items.filter(x => x.levelName === levelName && x.yearName === yearName && x.schoolClass === schoolClass && x.term === term), [items, levelName, yearName, schoolClass, term]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    try {
      await saveChantSubject({ name, levelName, yearName, schoolClass, term, createdBy: session.fullName || 'الإدارة' });
      setName(''); setItems(getChantSubjects()); setMessage('تمت إضافة المادة وربطها بالمستوى والسنة والفصل والترم.');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'تعذر حفظ المادة'); }
  };

  const remove = async (id: string) => {
    if (!canManage) return;
    await deleteChantSubject(id); setItems(getChantSubjects());
  };

  return <div className="space-y-5">
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
      <h2 className="font-black text-lg text-slate-100 flex items-center gap-2"><BookPlus className="w-5 h-5 text-amber-400"/>إضافة المواد</h2>
      <p className="text-xs text-slate-400 mt-1">كل مادة مرتبطة بمستوى الخدمة والسنة والفصل والترم، وتظهر عند رفع المنهج لنفس الاختيارات.</p>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
      <form onSubmit={submit} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 h-fit">
        <label className="block text-xs font-bold text-slate-300">اسم المادة<input value={name} onChange={e=>setName(e.target.value)} required disabled={!canManage} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm"/></label>
        <label className="block text-xs font-bold text-slate-300">المستوى<select value={levelName} onChange={e=>setLevelName(e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm">{levels.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="block text-xs font-bold text-slate-300">السنة<select value={yearName} onChange={e=>setYearName(e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm">{years.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="block text-xs font-bold text-slate-300">الفصل<select value={schoolClass} onChange={e=>setSchoolClass(e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm">{SCHOOL_CLASSES.map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="block text-xs font-bold text-slate-300">الترم<select value={term} onChange={e=>setTerm(e.target.value as AcademicTerm)} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm"><option>الترم الأول</option><option>الترم الثاني</option></select></label>
        {message && <p className="text-xs text-amber-300">{message}</p>}
        <button disabled={!canManage} className="w-full bg-amber-500 text-slate-950 rounded-xl py-2.5 text-sm font-black disabled:opacity-40">حفظ المادة</button>
      </form>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 min-w-0">
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <select value={levelName} onChange={e=>setLevelName(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1">{levels.map(x=><option key={x}>{x}</option>)}</select>
          <select value={yearName} onChange={e=>setYearName(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1">{years.map(x=><option key={x}>{x}</option>)}</select>
          <select value={schoolClass} onChange={e=>setSchoolClass(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1">{SCHOOL_CLASSES.map(x=><option key={x}>{x}</option>)}</select>
          <select value={term} onChange={e=>setTerm(e.target.value as AcademicTerm)} className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs flex-1"><option>الترم الأول</option><option>الترم الثاني</option></select>
        </div>
        <div className="space-y-2">{grouped.length ? grouped.map(s=><div key={s.id} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3"><div className="min-w-0"><div className="font-bold text-sm truncate">{s.name}</div><div className="text-[11px] text-slate-500">{s.levelName} • {s.yearName} • {s.schoolClass || 'غير محدد'} • {s.term}</div></div>{canManage&&<button type="button" onClick={()=>remove(s.id)} className="p-2 rounded-xl bg-rose-500/10 text-rose-300"><Trash2 className="w-4 h-4"/></button>}</div>):<div className="text-center text-slate-500 text-sm py-12">لا توجد مواد لهذا الاختيار بعد.</div>}</div>
      </div>
    </div>
  </div>;
};
