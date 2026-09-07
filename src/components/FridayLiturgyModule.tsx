import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { UserSession } from '../types';
import { getStudents } from '../services/storage';
import { recordFridayAttendance } from '../services/schoolSystem';
import { sessionHasPermission } from '../services/permissions';
import { isEgyptFriday } from '../services/egyptTime';
import { QRScannerModal } from './QRScannerModal';

export const FridayLiturgyModule: React.FC<{ session: UserSession }> = ({ session }) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [message, setMessage] = useState('');
  const students = getStudents().filter(s => !s.isDeleted);
  const canRecord = sessionHasPermission(session, 'canRecordAttendance') || session.role === 'admin';
  const todayIsFriday = isEgyptFriday();

  const onScan = async (text: string) => {
    if (!canRecord) return;
    if (!isEgyptFriday()) { setMessage('تسجيل حضور القداس متاح يوم الجمعة فقط حسب توقيت مصر.'); return; }
    const code = text.trim();
    const student = students.find(s => s.studentCode === code || s.id === code || code.includes(s.studentCode));
    if (!student) { setMessage('لم يتم العثور على طالب بهذا الـ QR / الكود.'); return; }
    const result = await recordFridayAttendance(student, session.userId || 'servant', session.fullName || 'الخادم', new Date());
    setMessage(result.message); setScannerOpen(false);
  };

  return <div className="space-y-5">
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6">
      <h2 className="text-lg font-black">تسجيل قداس الجمعة</h2>
      <p className="text-xs text-slate-400 mt-2">التاريخ والوقت يعتمدين على توقيت مصر (Africa/Cairo).</p>
      {!todayIsFriday && <div className="mt-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl px-4 py-3 text-sm text-rose-200">التسجيل مغلق الآن لأن اليوم ليس الجمعة بتوقيت مصر.</div>}
      <button disabled={!canRecord || !todayIsFriday} onClick={()=>setScannerOpen(true)} className="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 disabled:opacity-40"><Camera className="w-4 h-4"/>مسح QR للحضور</button>
    </div>
    {message && <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-sm text-amber-200">{message}</div>}
    <QRScannerModal isOpen={scannerOpen} onClose={()=>setScannerOpen(false)} onScanSuccess={onScan} strictCameraOnly title="تسجيل حضور قداس الجمعة" subtitle="التسجيل متاح يوم الجمعة فقط حسب توقيت مصر."/>
  </div>;
};
