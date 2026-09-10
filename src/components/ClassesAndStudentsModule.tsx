import React, { useMemo, useState } from 'react';
import { Users, Search, Filter, Trash2, RotateCcw, Edit, Eye, QrCode, Folder, FolderOpen, ChevronRight, ChevronLeft, Download, X, GraduationCap } from 'lucide-react';
import type { Student, DeaconRank, AcademicLevel, AcademicYear, UserSession } from '../types';
import { getStudents, getDeletedStudents, saveStudent, softDeleteStudent, restoreStudent, permanentlyDeleteStudent, getAcademicLevels, getAcademicYears, DEACON_RANKS, SCHOOL_LEVELS } from '../services/storage';

interface Props {
  session: UserSession;
  onSelectStudentProfile: (student: Student) => void;
  onGenerateIDCard: (student: Student) => void;
}

type ViewMode = 'folders' | 'cards' | 'table';

const SCHOOL_CLASSES = ['كيجي', 'أولى وتانية', 'تالتة ورابعة', 'خامسة وسادسة', 'إعدادي وثانوي'] as const;
const DEFAULT_LEVELS: AcademicLevel[] = ['المستوى الأول', 'المستوى الثاني'];
const DEFAULT_YEARS: AcademicYear[] = ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة'];

export const ClassesAndStudentsModule: React.FC<Props> = ({ session, onSelectStudentProfile, onGenerateIDCard }) => {
  const [students, setStudents] = useState<Student[]>(() => getStudents());
  const [deletedStudents, setDeletedStudents] = useState<Student[]>(() => getDeletedStudents());
  const [levels, setLevels] = useState<string[]>(() => getAcademicLevels());
  const [years, setYears] = useState<string[]>(() => getAcademicYears());
  const [level, setLevel] = useState('ALL');
  const [year, setYear] = useState('ALL');
  const [schoolClass, setSchoolClass] = useState('ALL');
  const [schoolLevel, setSchoolLevel] = useState('ALL');
  const [rank, setRank] = useState('ALL');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewMode>('folders');
  const [editing, setEditing] = useState<Student | null>(null);
  const [recycleOpen, setRecycleOpen] = useState(false);

  const actualLevels = levels.length ? levels : DEFAULT_LEVELS;
  const actualYears = years.length ? years : DEFAULT_YEARS;
  const canEdit = session.role === 'admin' || !!session.permissions?.canAddEditStudents;

  const refresh = () => {
    setStudents(getStudents());
    setDeletedStudents(getDeletedStudents());
    setLevels(getAcademicLevels());
    setYears(getAcademicYears());
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (level !== 'ALL' && s.level !== level) return false;
      if (year !== 'ALL' && s.year !== year) return false;
      if (schoolClass !== 'ALL' && s.schoolClass !== schoolClass) return false;
      if (schoolLevel !== 'ALL' && s.schoolLevel !== schoolLevel) return false;
      if (rank !== 'ALL' && s.deaconRank !== rank) return false;
      if (!q) return true;
      return [s.fullName, s.studentCode, s.nationalId, s.phone, s.guardianPhone].some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [students, level, year, schoolClass, schoolLevel, rank, query]);

  const countIn = (l: string, y?: string, c?: string) => students.filter(s => s.level === l && (!y || s.year === y) && (!c || s.schoolClass === c) && (schoolLevel === 'ALL' || s.schoolLevel === schoolLevel) && (rank === 'ALL' || s.deaconRank === rank)).length;

  const reset = () => {
    setLevel('ALL'); setYear('ALL'); setSchoolClass('ALL'); setSchoolLevel('ALL'); setRank('ALL'); setQuery(''); setView('folders');
  };

  const openLevel = (value: string) => { setLevel(value); setYear('ALL'); setSchoolClass('ALL'); setView('folders'); };
  const openYear = (value: string) => { setYear(value); setSchoolClass('ALL'); setView('folders'); };
  const openClass = (value: string) => { setSchoolClass(value); setView('cards'); };
  const back = () => {
    if (schoolClass !== 'ALL') setSchoolClass('ALL');
    else if (year !== 'ALL') setYear('ALL');
    else if (level !== 'ALL') setLevel('ALL');
    setView('folders');
  };

  const exportCsv = () => {
    if (!filtered.length) return;
    const header = ['كود الطالب','الاسم','الرتبة','المستوى','السنة','الفصل','المرحلة التعليمية','السنة التعليمية','هاتف الطالب','هاتف ولي الأمر'];
    const rows = filtered.map(s => [s.studentCode, s.fullName, s.deaconRank, s.level, s.year, s.schoolClass || '', s.schoolLevel || '', s.schoolYear || '', s.phone || '', s.guardianPhone || '']);
    const csv = '\uFEFF' + [header, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `طلاب-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const updateEditing = (key: keyof Student, value: string) => setEditing(s => s ? ({ ...s, [key]: value }) : s);
  const saveEditing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.fullName?.trim()) return;
    try { saveStudent(editing); setEditing(null); refresh(); } catch (err) { alert(err instanceof Error ? err.message : 'تعذر حفظ التعديل.'); }
  };

  const removeStudent = (student: Student) => {
    if (!confirm(`نقل الطالب «${student.fullName}» إلى سلة المحذوفات؟`)) return;
    softDeleteStudent(student.id); refresh();
  };

  const folder = (title: string, subtitle: string, count: number, onClick: () => void) => (
    <button onClick={onClick} className="group text-right bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/70 rounded-3xl p-6 shadow-xl transition-all w-full">
      <div className="flex items-center gap-4">
        <div className="shrink-0 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-amber-400 group-hover:text-amber-300 group-hover:border-amber-500/40">
          <Folder className="w-9 h-9" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-black text-slate-100 text-base">{title}</div>
          <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">{count} طالب</span>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400" />
        </div>
      </div>
    </button>
  );

  const cards = (list: Student[]) => list.length ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {list.map(s => (
        <div key={s.id} className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-4 shadow-lg space-y-4">
          <div className="flex gap-3 items-center">
            <img src={s.photoUrl || '/school-alhan/icons/icon-192.png'} alt="" className="w-14 h-14 rounded-2xl object-cover border border-slate-700" onError={e => { (e.currentTarget as HTMLImageElement).src = '/school-alhan/icons/icon-192.png'; }} />
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-sm text-slate-100 truncate">{s.fullName}</h3>
              <div className="flex flex-wrap gap-1 mt-1"><span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-1 rounded-md">{s.studentCode}</span><span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-md">{s.deaconRank}</span></div>
            </div>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-xs space-y-1.5">
            <div className="flex justify-between gap-2"><span className="text-amber-400">الفصل</span><b>{s.schoolClass || 'غير محدد'}</b></div>
            <div className="flex justify-between gap-2"><span className="text-slate-500">الخدمة</span><span>{s.level} — {s.year}</span></div>
            <div className="flex justify-between gap-2"><span className="text-slate-500">الهاتف</span><span className="font-mono">{s.phone || 'غير مسجل'}</span></div>
          </div>
          <div className="flex gap-1.5 border-t border-slate-800 pt-3">
            <button onClick={() => onSelectStudentProfile(s)} className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold flex items-center justify-center gap-1"><Eye className="w-3.5 h-3.5" />الملف</button>
            <button onClick={() => onGenerateIDCard(s)} className="p-2 rounded-xl bg-slate-800 text-sky-400 hover:bg-sky-500 hover:text-white" title="بطاقة الطالب"><QrCode className="w-4 h-4" /></button>
            {canEdit && <button onClick={() => setEditing(s)} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700" title="تعديل"><Edit className="w-4 h-4" /></button>}
            {canEdit && <button onClick={() => removeStudent(s)} className="p-2 rounded-xl bg-slate-800 text-rose-400 hover:bg-rose-500/20" title="حذف"><Trash2 className="w-4 h-4" /></button>}
          </div>
        </div>
      ))}
    </div>
  ) : <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500"><Users className="w-12 h-12 mx-auto mb-3 text-slate-700" /><p>لا يوجد طلاب في هذا المجلد.</p></div>;

  const renderFolders = () => {
    if (level === 'ALL') return <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{actualLevels.map(l => folder(l, 'افتح المستوى لعرض السنوات الأربع', countIn(l), () => openLevel(l)))}</div>;
    if (year === 'ALL') return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{actualYears.map(y => folder(y, 'افتح السنة لعرض الفصول', countIn(level, y), () => openYear(y)))}</div>;
    return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">{SCHOOL_CLASSES.map(c => folder(c, 'افتح الفصل لعرض الطلاب فقط', countIn(level, year, c), () => openClass(c)))}</div>;
  };

  return <div className="space-y-5" dir="rtl">
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div><h2 className="text-xl font-black text-slate-100 flex items-center gap-2"><GraduationCap className="w-6 h-6 text-amber-400" />الفصول والطلاب</h2><p className="text-xs text-slate-500 mt-1">نظام ملفات: المستوى ← السنة ← الفصل ← الطلاب</p></div>
        <div className="flex gap-2 flex-wrap"><button onClick={reset} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold">العودة للرئيسية</button><button onClick={exportCsv} className="px-3 py-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-bold flex gap-1 items-center"><Download className="w-4 h-4" />تصدير</button><button onClick={() => setRecycleOpen(v => !v)} className="px-3 py-2 bg-slate-800 text-rose-300 rounded-xl text-xs font-bold flex gap-1 items-center"><Trash2 className="w-4 h-4" />سلة المحذوفات</button></div>
      </div>
    </div>

    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative"><Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-500" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="ابحث بالاسم أو الكود أو الهاتف" className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pr-9 pl-3 text-xs text-slate-100 outline-none focus:border-amber-500" /></div>
        <select value={rank} onChange={e => setRank(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200"><option value="ALL">كل الرتب</option>{DEACON_RANKS.map(r => <option key={r}>{r}</option>)}</select>
        <select value={schoolLevel} onChange={e => setSchoolLevel(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200"><option value="ALL">كل المراحل التعليمية</option>{SCHOOL_LEVELS.map(x => <option key={x}>{x}</option>)}</select>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="w-4 h-4 text-amber-400 shrink-0" />
        {['ALL', ...actualLevels].map(v => <button key={v} onClick={() => { setLevel(v); setYear('ALL'); setSchoolClass('ALL'); setView('folders'); }} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap ${level === v ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>{v === 'ALL' ? 'كل المستويات' : v}</button>)}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] text-slate-500 shrink-0">السنوات:</span>
        {['ALL', ...actualYears].map(v => <button key={v} onClick={() => { setYear(v); setSchoolClass('ALL'); setView('folders'); }} disabled={level === 'ALL'} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap disabled:opacity-40 ${year === v ? 'bg-violet-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{v === 'ALL' ? 'كل السنوات' : v}</button>)}
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] text-slate-500 shrink-0">الفصول:</span>
        {['ALL', ...SCHOOL_CLASSES].map(v => <button key={v} onClick={() => { setSchoolClass(v); if (v !== 'ALL') setView('cards'); }} disabled={level === 'ALL' || year === 'ALL'} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap disabled:opacity-40 ${schoolClass === v ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300'}`}>{v === 'ALL' ? 'كل الفصول' : v}</button>)}
      </div>
    </div>

    {level !== 'ALL' && <button onClick={back} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"><ChevronLeft className="w-4 h-4" />رجوع للمجلد السابق</button>}

    {query || schoolLevel !== 'ALL' || rank !== 'ALL' ? cards(filtered) : (view === 'folders' ? renderFolders() : cards(filtered))}

    {editing && <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onMouseDown={() => setEditing(null)}><form onSubmit={saveEditing} onMouseDown={e => e.stopPropagation()} className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl"><div className="flex justify-between items-center"><h3 className="font-black text-slate-100">تعديل بيانات الطالب</h3><button type="button" onClick={() => setEditing(null)}><X className="w-5 h-5 text-slate-400" /></button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><label className="text-xs text-slate-300">الاسم<input className="w-full mt-1 field" value={editing.fullName || ''} onChange={e => updateEditing('fullName', e.target.value)} /></label><label className="text-xs text-slate-300">الرتبة<select className="w-full mt-1 field" value={editing.deaconRank || ''} onChange={e => updateEditing('deaconRank', e.target.value)}>{DEACON_RANKS.map(r => <option key={r}>{r}</option>)}</select></label><label className="text-xs text-slate-300">المستوى<select className="w-full mt-1 field" value={editing.level || ''} onChange={e => updateEditing('level', e.target.value)}>{actualLevels.map(x => <option key={x}>{x}</option>)}</select></label><label className="text-xs text-slate-300">السنة<select className="w-full mt-1 field" value={editing.year || ''} onChange={e => updateEditing('year', e.target.value)}>{actualYears.map(x => <option key={x}>{x}</option>)}</select></label><label className="text-xs text-slate-300">الفصل<select className="w-full mt-1 field" value={editing.schoolClass || ''} onChange={e => updateEditing('schoolClass', e.target.value)}>{SCHOOL_CLASSES.map(x => <option key={x}>{x}</option>)}</select></label><label className="text-xs text-slate-300">هاتف الطالب<input className="w-full mt-1 field" value={editing.phone || ''} onChange={e => updateEditing('phone', e.target.value)} /></label><label className="text-xs text-slate-300">هاتف ولي الأمر<input className="w-full mt-1 field" value={editing.guardianPhone || ''} onChange={e => updateEditing('guardianPhone', e.target.value)} /></label></div><button className="w-full bg-amber-500 text-slate-950 font-black rounded-xl py-2.5">حفظ التعديل</button></form></div>}

    {recycleOpen && <div className="bg-slate-900 border border-rose-500/20 rounded-3xl p-5 space-y-3"><div className="flex justify-between items-center"><h3 className="font-black text-slate-100 flex items-center gap-2"><Trash2 className="w-5 h-5 text-rose-400" />سلة المحذوفات</h3><button onClick={() => setRecycleOpen(false)}><X className="w-5 h-5 text-slate-500" /></button></div>{deletedStudents.length ? deletedStudents.map(s => <div key={s.id} className="flex items-center justify-between gap-3 bg-slate-950 border border-slate-800 rounded-2xl p-3"><div><b className="text-xs text-slate-200">{s.fullName}</b><div className="text-[10px] text-slate-500">{s.studentCode}</div></div><div className="flex gap-1"><button onClick={() => { restoreStudent(s.id); refresh(); }} className="p-2 bg-slate-800 text-emerald-400 rounded-lg" title="استرجاع"><RotateCcw className="w-4 h-4" /></button><button onClick={() => { if (confirm('حذف نهائي؟')) { permanentlyDeleteStudent(s.id); refresh(); } }} className="p-2 bg-slate-800 text-rose-400 rounded-lg" title="حذف نهائي"><Trash2 className="w-4 h-4" /></button></div></div>) : <p className="text-xs text-slate-500 text-center py-5">سلة المحذوفات فارغة.</p>}</div>}

    <style>{`.field{width:100%;background:#020617;border:1px solid #1e293b;border-radius:.75rem;padding:.55rem .7rem;color:#f1f5f9;outline:none}.field:focus{border-color:#f59e0b}`}</style>
  </div>;
};
