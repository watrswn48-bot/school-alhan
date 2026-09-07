import React, { useMemo, useState } from 'react';
import { CalendarDays, Camera, Church, WifiOff } from 'lucide-react';
import { UserSession } from '../types';
import { getStudents } from '../services/storage';
import { dedupedLiturgyAttendances, getFridayDates, recordFridayAttendance } from '../services/schoolSystem';
import { sessionHasPermission } from '../services/permissions';
import { QRScannerModal } from './QRScannerModal';

export const FridayLiturgyModule: React.FC<{ session: UserSession }> = ({ session }) => {
  const [version, setVersion] = useState(0);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [message, setMessage] = useState('');
  const students = getStudents().filter(s => !s.isDeleted);
  const attendances = useMemo(() => dedupedLiturgyAttendances(), [version]);
  const fridays = useMemo(() => getFridayDates(), [version]);
  const canRecord = sessionHasPermission(session, 'canRecordAttendance') || session.role === 'admin';

  const onScan = async (text: string) => {
    if (!canRecord) return;
    const code = text.trim();
    const student = students.find(s => s.studentCode === code || s.id === code || code.includes(s.studentCode));
    if (!student) { setMessage('لم يتم العثور على طالب بهذا الـ QR / الكود.'); return; }
    const result = await recordFridayAttendance(student, session.userId || 'servant', session.fullName || 'الخادم');
    setMessage(result.message); setVersion(v=>v+1); setScannerOpen(false);
  };

  return <div className="space-y-5">
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div><h2 className="text-lg font-black flex items-center gap-2"><Church className="w-5 h-5 text-amber-400"/>حضور القداس الإلهي</h2><p className="text-xs text-slate-400 mt-1">كل يوم جمعة يُحتسب تلقائيًا كمناسبة قداس، حتى لو لم يسجل أي خادم حضورًا في ذلك اليوم.</p></div>
      <button disabled={!canRecord} onClick={()=>setScannerOpen(true)} className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"><Camera className="w-4 h-4"/>مسح QR للحضور</button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><div className="text-xs text-slate-400">إجمالي الجمعات المحتسبة</div><div className="text-2xl font-black text-amber-400 mt-1">{fridays.length}</div></div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><div className="text-xs text-slate-400">عدد الطلاب</div><div className="text-2xl font-black mt-1">{students.length}</div></div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><WifiOff className="w-4 h-4"/>وضع Offline</div><div className="text-xs text-emerald-400 font-bold mt-2">المسح يُحفظ محليًا ثم يتزامن تلقائيًا، مع مفتاح ثابت يمنع التكرار.</div></div>
    </div>

    {message && <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-sm text-amber-200">{message}</div>}

    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-amber-400"/><b className="text-sm">ملخص الحضور والغياب في السنة الدراسية الحالية</b></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="bg-slate-950 text-xs text-slate-400"><tr><th className="text-right p-4">الطالب</th><th className="p-4">الحضور</th><th className="p-4">الغياب</th><th className="p-4">الإجمالي</th><th className="p-4">النسبة</th></tr></thead><tbody>{students.map(stu=>{const present=fridays.filter(d=>attendances.some(a=>a.studentId===stu.id&&a.dateStr===d)).length;const absent=Math.max(0,fridays.length-present);const pct=fridays.length?Math.round((present/fridays.length)*100):0;return <tr key={stu.id} className="border-t border-slate-800"><td className="p-4 font-bold">{stu.fullName}<div className="text-[10px] text-slate-500 font-mono">{stu.studentCode}</div></td><td className="p-4 text-center text-emerald-400 font-black">{present}</td><td className="p-4 text-center text-rose-400 font-black">{absent}</td><td className="p-4 text-center">{fridays.length}</td><td className="p-4 text-center font-black">{pct}%</td></tr>})}</tbody></table></div>
    </div>

    <QRScannerModal isOpen={scannerOpen} onClose={()=>setScannerOpen(false)} onScanSuccess={onScan} strictCameraOnly title="تسجيل حضور قداس الجمعة" subtitle="امسح QR الطالب. يعمل التسجيل أيضًا عند انقطاع الإنترنت."/>
  </div>;
};
