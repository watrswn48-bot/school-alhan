import React, { useMemo, useState } from 'react';
import { GraduationCap, Search, UserCheck, X } from 'lucide-react';
import { Student, UserSession } from '../types';
import { getStudents } from '../services/storage';

interface GraduatesModuleProps { session: UserSession; onSelectStudentProfile?: (student: Student) => void; }

export const GraduatesModule: React.FC<GraduatesModuleProps> = ({ session, onSelectStudentProfile }) => {
  const [query, setQuery] = useState('');
  const students = getStudents();
  const graduates = useMemo(() => students.filter(s => !!s.graduationYear), [students]);
  const years = useMemo(() => Array.from(new Set(graduates.map(s => String(s.graduationYear)))).sort((a, b) => Number(b) - Number(a)), [graduates]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return graduates;
    return graduates.filter(s => String(s.graduationYear).includes(q) || s.fullName.toLowerCase().includes(q) || s.studentCode.toLowerCase().includes(q) || s.nationalId.includes(q));
  }, [graduates, query]);

  if (session.role !== 'admin' && session.userId !== 'srv-admin-01') return <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">هذه الوظيفة متاحة لأبونا / مسؤول النظام فقط.</div>;
  const threeYearsAgo = String(new Date().getFullYear() - 3);

  return <div className="space-y-6 animate-fade-in">
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h2 className="text-xl font-black text-slate-100 flex items-center gap-2"><GraduationCap className="w-6 h-6 text-amber-400"/>سجل الخريجين</h2><p className="text-xs text-slate-400 mt-1">ابحث بسنة التخرج، الاسم، كود الطالب أو الرقم القومي.</p></div><span className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold">{filtered.length} خريج</span></div></div>
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
      <div className="relative"><Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ابحث مثلاً: 2020 أو اسم الخريج أو كود الطالب..." className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-3 pr-12 pl-10 text-sm text-slate-100 outline-none focus:border-amber-500"/>{query&&<button onClick={()=>setQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"><X className="w-4 h-4"/></button>}</div>
      <div className="flex flex-wrap gap-2"><button onClick={()=>setQuery(threeYearsAgo)} className="px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[11px] font-bold">خريجو منذ 3 سنوات ({threeYearsAgo})</button>{years.map(y=><button key={y} onClick={()=>setQuery(y)} className={`px-3 py-2 rounded-xl text-[11px] font-bold border ${query===y?'bg-amber-500 text-slate-950 border-amber-400':'bg-slate-950 text-slate-400 border-slate-700 hover:border-amber-500/40'}`}>خريجو {y}</button>)}</div>
    </div>
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">{filtered.length===0?<div className="py-14 text-center text-slate-500 text-sm">لا توجد نتائج مطابقة للبحث.</div>:<div className="grid grid-cols-1 md:grid-cols-2 gap-3">{filtered.map(student=><div key={student.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3 hover:border-amber-500/40 transition-colors"><img src={student.photoUrl} alt="" className="w-14 h-14 rounded-2xl object-cover ring-1 ring-slate-700 shrink-0"/><div className="min-w-0 flex-1"><div className="font-black text-slate-100 truncate">{student.fullName}</div><div className="text-[11px] text-amber-300 mt-1">خريج سنة {student.graduationYear}</div><div className="text-[10px] text-slate-500 font-mono mt-1">{student.studentCode} • {student.nationalId}</div></div>{onSelectStudentProfile&&<button onClick={()=>onSelectStudentProfile(student)} className="px-3 py-2 rounded-xl bg-slate-800 text-sky-300 text-[11px] font-bold flex items-center gap-1 shrink-0"><UserCheck className="w-4 h-4"/>الملف</button>}</div>)}</div>}</div>
  </div>;
};
