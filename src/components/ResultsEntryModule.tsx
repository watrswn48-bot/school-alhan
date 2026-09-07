import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Save } from 'lucide-react';
import { Student, UserSession } from '../types';
import { getStudents, getSubjectResults, saveSubjectResult } from '../services/storage';
import { AcademicTerm, getChantSubjects, refreshSubjectsFromFirebase } from '../services/schoolSystem';
import { sessionHasPermission } from '../services/permissions';

export const ResultsEntryModule: React.FC<{ session: UserSession }> = ({ session }) => {
  const students = getStudents().filter(s => !s.isDeleted);
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [term, setTerm] = useState<AcademicTerm>('الترم الأول');
  const [version, setVersion] = useState(0);
  const [message, setMessage] = useState('');
  const student = students.find(s => s.id === studentId);
  const canManage = session.role === 'admin' || session.userId === 'srv-admin-01' || sessionHasPermission(session, 'canManageGrades');

  useEffect(() => { refreshSubjectsFromFirebase().then(()=>setVersion(v=>v+1)); }, []);

  const subjects = useMemo(() => {
    if (!student) return [];
    return getChantSubjects().filter(s => s.levelName === student.level && s.yearName === student.year && s.term === term);
  }, [studentId, term, version]);

  const existing = useMemo(() => {
    if (!student) return [];
    return getSubjectResults(student.id).filter(r => r.levelIndex === student.levelIndex && r.yearIndex === student.yearIndex && r.term === term);
  }, [studentId, term, version]);

  const [scores, setScores] = useState<Record<string, string>>({});
  useEffect(() => {
    const next: Record<string,string> = {};
    subjects.forEach(s => {
      const r = existing.find(x => x.subjectName === s.name);
      next[s.id] = r ? String(r.score) : '';
    });
    setScores(next);
  }, [studentId, term, version, subjects.length]);

  const saveAll = () => {
    if (!student || !canManage) return;
    let saved = 0;
    for (const subject of subjects) {
      const raw = scores[subject.id];
      if (raw === '' || raw === undefined) continue;
      const score = Math.max(0, Math.min(100, Number(raw) || 0));
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
        isApproved: true,
        updatedBy: session.fullName || 'الإدارة',
      });
      saved++;
    }
    setVersion(v=>v+1);
    setMessage(`تم حفظ ${saved} نتيجة في ${term}.`);
  };

  return <div className="space-y-5">
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
      <h2 className="font-black text-lg flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-amber-400"/>نتائج مدرسة الألحان</h2>
      <p className="text-xs text-slate-400 mt-1">المواد تظهر تلقائيًا حسب مستوى وسنة الطالب. الترم الأول والثاني محفوظان كسجلين منفصلين تمامًا.</p>
    </div>

    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
      <label className="text-xs font-bold text-slate-300">الطالب<select value={studentId} onChange={e=>setStudentId(e.target.value)} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5">{students.map(s=><option key={s.id} value={s.id}>{s.fullName} — {s.studentCode}</option>)}</select></label>
      <label className="text-xs font-bold text-slate-300">السنة في مدرسة الألحان<input readOnly value={student ? `${student.level} / ${student.year}` : ''} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-400"/></label>
      <label className="text-xs font-bold text-slate-300">الترم<select value={term} onChange={e=>setTerm(e.target.value as AcademicTerm)} className="mt-2 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5"><option>الترم الأول</option><option>الترم الثاني</option></select></label>
    </div>

    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-slate-950 text-slate-400 text-xs"><tr><th className="text-right p-4">المادة</th><th className="p-4">الدرجة من 100</th><th className="p-4">النسبة</th><th className="p-4">الحالة</th></tr></thead>
          <tbody>{subjects.map(subject=>{ const n=Number(scores[subject.id]||0); const filled=scores[subject.id]!==''&&scores[subject.id]!==undefined; return <tr key={subject.id} className="border-t border-slate-800"><td className="p-4 font-bold">{subject.name}</td><td className="p-4 text-center"><input disabled={!canManage} type="number" min={0} max={100} value={scores[subject.id]??''} onChange={e=>setScores({...scores,[subject.id]:e.target.value})} className="w-28 max-w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center"/></td><td className="p-4 text-center">{filled?`${Math.max(0,Math.min(100,n))}%`:'—'}</td><td className={`p-4 text-center font-bold ${!filled?'text-slate-500':n>=50?'text-emerald-400':'text-rose-400'}`}>{!filled?'لم تُرصد':n>=50?'ناجح':'أقل من 50%'}</td></tr>;})}</tbody>
        </table>
      </div>
      {!subjects.length && <div className="p-12 text-center text-slate-500 text-sm">لا توجد مواد مضافة لهذه السنة في {term}. أضف المواد أولًا من خانة «إضافة المواد».</div>}
      {subjects.length>0 && <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"><span className="text-xs text-amber-300">{message}</span><button onClick={saveAll} disabled={!canManage} className="px-5 py-2.5 bg-amber-500 text-slate-950 rounded-xl font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"><Save className="w-4 h-4"/>حفظ نتائج {term}</button></div>}
    </div>
  </div>;
};
