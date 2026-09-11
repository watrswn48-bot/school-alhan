import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Save, ChevronLeft, Users, Folder, UserCheck, CheckCircle2, Upload } from 'lucide-react';
import { UserSession } from '../types';
import { getStudents, getSubjectResults, saveSubjectResult } from '../services/storage';
import { AcademicTerm, getChantSubjects, refreshSubjectsFromFirebase } from '../services/schoolSystem';
import { publishResults, areResultsPublished } from '../services/academicYearService';
import { sessionHasPermission } from '../services/permissions';
import { SCHOOL_CLASSES, normalizeSchoolClass } from '../services/schoolClassUtils';

const LEVELS = ['المستوى الأول', 'المستوى الثاني'];
const YEARS = ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة'];

export const ResultsEntryModule: React.FC<{ session: UserSession }> = ({ session }) => {
  const allStudents = getStudents().filter(s => !s.isDeleted);
  const [level, setLevel] = useState('');
  const [year, setYear] = useState('');
  const [schoolClass, setSchoolClass] = useState('');
  const [studentId, setStudentId] = useState('');
  const [term, setTerm] = useState<AcademicTerm>('الترم الأول');
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [publicationVersion, setPublicationVersion] = useState(0);

  const canManage = session.role === 'admin' || session.userId === 'srv-admin-01' || sessionHasPermission(session, 'canManageGrades');
  const resultsPublished = !!level && !!year && areResultsPublished(level, year, term);

  useEffect(() => {
    refreshSubjectsFromFirebase().then(() => setVersion(v => v + 1));
  }, []);

  const matchingStudents = useMemo(() => {
    if (!level || !year || !schoolClass) return [];
    const selectedClass = normalizeSchoolClass(schoolClass);
    return allStudents.filter(s => s.level === level && s.year === year && normalizeSchoolClass(s.schoolClass) === selectedClass)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ar'));
  }, [level, year, schoolClass, version]);

  const student = matchingStudents.find(s => s.id === studentId) || null;

  const subjects = useMemo(() => {
    if (!level || !year) return [];
    return getChantSubjects().filter(s => s.levelName === level && s.yearName === year && s.term === term);
  }, [level, year, term, version, publicationVersion]);

  const existing = useMemo(() => {
    if (!student) return [];
    return getSubjectResults(student.id).filter(r => r.levelIndex === student.levelIndex && r.yearIndex === student.yearIndex && r.term === term);
  }, [studentId, term, version, student]);

  useEffect(() => {
    const next: Record<string, string> = {};
    subjects.forEach(subject => {
      const result = existing.find(r => r.subjectName === subject.name);
      next[subject.id] = result ? String(result.score) : '';
    });
    setScores(next);
  }, [studentId, term, subjects, existing]);

  const saveStudentResults = () => {
    if (!student || !canManage) return;
    let saved = 0;
    for (const subject of subjects) {
      const raw = scores[subject.id];
      if (raw === '' || raw === undefined) continue;
      const parsed = Number(raw);
      const score = Math.max(0, Math.min(100, Number.isFinite(parsed) ? parsed : 0));
      const old = existing.find(r => r.subjectName === subject.name);
      saveSubjectResult({
        id: old?.id,
        studentId: student.id,
        studentCode: student.studentCode,
        studentName: student.fullName,
        levelIndex: student.levelIndex,
        yearIndex: student.yearIndex,
        levelName: student.level,
        yearName: student.year,
        subjectName: subject.name,
        term,
        examType: 'نتيجة الترم',
        score,
        maxScore: 100,
        isApproved: false,
        updatedBy: session.fullName || 'الإدارة',
      });
      saved++;
    }
    setVersion(v => v + 1);
    setMessage(`تم حفظ ${saved} نتيجة للطالب ${student.fullName} في ${term}. اضغط «رفع النتائج» لإظهارها للطلاب.`);
  };

  const handlePublishResults = () => {
    if (!canManage || !level || !year) return;
    publishResults(level, year, term);
    setPublicationVersion(v => v + 1);
    setMessage(`تم رفع نتائج ${year} - ${term} للطلاب بنجاح.`);
  };

  const resetSelection = () => {
    setLevel(''); setYear(''); setSchoolClass(''); setStudentId(''); setMessage('');
  };

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
        <h2 className="font-black text-lg flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-amber-400" /> إضافة النتائج</h2>
        <p className="text-xs text-slate-400 mt-1">سجل نتائج الطلاب، ثم اضغط «رفع النتائج» حتى تظهر النتائج المنشورة في حسابات الطلاب.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-black"><Folder className="w-5 h-5 text-amber-400" /> تحديد مكان الطلاب</div>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="text-xs font-bold text-slate-300">الترم<select value={term} onChange={e => setTerm(e.target.value as AcademicTerm)} className="mr-2 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2"><option>الترم الأول</option><option>الترم الثاني</option></select></label>
            {level && year && <button onClick={handlePublishResults} disabled={!canManage || resultsPublished} className={`px-5 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg ${resultsPublished ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'} disabled:opacity-50`}><Upload className="w-4 h-4" />{resultsPublished ? 'النتائج مرفوعة' : 'رفع النتائج'}</button>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <label className="text-xs font-bold text-slate-300">١. المستوى<select value={level} onChange={e => {setLevel(e.target.value);setYear('');setSchoolClass('');setStudentId('');setMessage('');}} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3"><option value="">اختر المستوى</option>{LEVELS.map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-300">٢. السنة<select value={year} onChange={e => {setYear(e.target.value);setSchoolClass('');setStudentId('');setMessage('');}} disabled={!level} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 disabled:opacity-40"><option value="">اختر السنة</option>{YEARS.map(x => <option key={x}>{x}</option>)}</select></label>
          <label className="text-xs font-bold text-slate-300">٣. الفصل<select value={schoolClass} onChange={e => {setSchoolClass(e.target.value);setStudentId('');setMessage('');}} disabled={!year} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-3 disabled:opacity-40"><option value="">اختر الفصل</option>{SCHOOL_CLASSES.map(x => <option key={x}>{x}</option>)}</select></label>
        </div>
        {(level || year || schoolClass) && <div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><span className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">المستوى: {level || '—'}</span><span className="px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300">السنة: {year || '—'}</span><span className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">الفصل: {schoolClass || '—'}</span><button onClick={resetSelection} className="mr-auto text-slate-400 hover:text-white underline">إعادة الاختيار</button></div>}
      </div>

      {level && year && schoolClass && <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800"><h3 className="font-black flex items-center gap-2"><Users className="w-5 h-5 text-amber-400" /> الطلاب</h3><p className="text-xs text-slate-500 mt-1">{matchingStudents.length} طالب في هذا الفصل — اختار طالبًا لإدخال نتيجته.</p></div>
        {!matchingStudents.length ? <div className="p-12 text-center text-slate-500 text-sm">لا يوجد طلاب مسجلون في هذا المستوى والسنة والفصل.</div> : <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{matchingStudents.map((s,index)=><button key={s.id} onClick={()=>{setStudentId(s.id);setMessage('');}} className={`text-right p-4 rounded-2xl border transition-all ${studentId===s.id?'bg-amber-500/15 border-amber-500/50':'bg-slate-950 border-slate-800 hover:border-slate-600'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 font-black">{index+1}</div><div className="min-w-0"><div className="font-black truncate">{s.fullName}</div><div className="text-[11px] text-slate-500 mt-1">{s.studentCode}</div></div><UserCheck className="w-4 h-4 mr-auto text-slate-500" /></div></button>)}</div>}
      </div>}

      {student && <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center gap-3"><button onClick={()=>setStudentId('')} className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white" title="العودة لقائمة الطلاب"><ChevronLeft className="w-5 h-5" /></button><div><div className="text-xs text-slate-500">إدخال نتيجة الطالب</div><h3 className="font-black text-lg">{student.fullName}</h3><div className="text-xs text-slate-500 mt-1">{level} / {year} / {schoolClass} / {term}</div></div></div>
        {!subjects.length ? <div className="p-12 text-center text-slate-500 text-sm">لا توجد مواد مضافة لهذه السنة في {term}. أضف المواد أولًا من خانة «إضافة المواد».</div> : <><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="bg-slate-950 text-slate-400 text-xs"><tr><th className="text-right p-4">المادة</th><th className="p-4">الدرجة من 100</th><th className="p-4">النسبة</th><th className="p-4">الحالة</th></tr></thead><tbody>{subjects.map(subject=>{const value=scores[subject.id]??'';const n=Number(value||0);const filled=value!=='';return <tr key={subject.id} className="border-t border-slate-800"><td className="p-4 font-bold">{subject.name}</td><td className="p-4 text-center"><input disabled={!canManage} type="number" min={0} max={100} value={value} onChange={e=>setScores(prev=>({...prev,[subject.id]:e.target.value}))} className="w-28 max-w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center" /></td><td className="p-4 text-center">{filled?`${Math.max(0,Math.min(100,n))}%`:'—'}</td><td className={`p-4 text-center font-bold ${!filled?'text-slate-500':n>=50?'text-emerald-400':'text-rose-400'}`}>{!filled?'لم تُرصد':n>=50?'ناجح':'أقل من 50%'}</td></tr>})}</tbody></table></div><div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"><span className="text-xs text-amber-300 min-h-5">{message}</span><div className="flex flex-wrap justify-end gap-2"><button onClick={saveStudentResults} disabled={!canManage} className="px-5 py-2.5 bg-slate-800 text-amber-300 border border-slate-700 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"><Save className="w-4 h-4" /> حفظ نتيجة {student.fullName}</button><button onClick={handlePublishResults} disabled={!canManage || resultsPublished} className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"><CheckCircle2 className="w-4 h-4" /> {resultsPublished?'النتائج مرفوعة':'رفع النتائج'}</button></div></div></>}
      </div>}
    </div>
  );
};
