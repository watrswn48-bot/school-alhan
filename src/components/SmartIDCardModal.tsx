import React, { useEffect, useState } from 'react';
import { Printer, X } from 'lucide-react';
import QRCode from 'qrcode';
import { Student } from '../types';
import { getSchoolLogo } from '../services/storage';
import '../print-id-card.css';

interface SmartIDCardModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SmartIDCardModal: React.FC<SmartIDCardModalProps> = ({ student, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const schoolLogo = getSchoolLogo();

  useEffect(() => {
    if (!student) return;
    QRCode.toDataURL(student.studentCode, { width: 420, margin: 1, errorCorrectionLevel: 'H' })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [student?.studentCode]);

  if (!student) return null;

  return <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-3 sm:p-6 overflow-y-auto flex items-center justify-center">
    <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl p-4 sm:p-6 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div><h3 className="font-black text-lg">كارنيه الطالب</h3><p className="text-xs text-slate-400">الوش والظهر — كل وجه في صفحة مستقلة</p></div>
        <div className="flex gap-2"><button onClick={() => window.print()} className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-2"><Printer className="w-4 h-4"/>طباعة / تنزيل PDF</button><button onClick={onClose} className="p-2 bg-slate-800 rounded-xl"><X className="w-5 h-5"/></button></div>
      </div>

      <div id="printable-id-cards" className="flex flex-col items-center gap-6">
        <div className="id-card-page id-card-front w-full max-w-[520px] aspect-[1.585/1] min-h-[320px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-[28px] overflow-hidden relative shadow-2xl font-['Tajawal'] text-slate-100">
          <div className="absolute inset-0 opacity-[0.06] flex items-center justify-center pointer-events-none"><img src={schoolLogo} alt="" className="w-[70%] aspect-square object-cover rounded-full"/></div>
          <div className="relative h-full p-4 sm:p-5 flex flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-amber-500/30 pb-3">
              <div className="text-right min-w-0"><div className="text-[14px] sm:text-[17px] leading-tight font-black text-amber-300">مدرسة تي اتشرومبي للألحان</div><div className="text-[10px] sm:text-xs text-slate-300 mt-1">كنيسة العدرا و مارمرقس سكينة</div></div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400 bg-white shrink-0 shadow-lg"><img src={schoolLogo} alt="لوجو مدرسة الشمامسة" className="w-full h-full object-cover"/></div>
            </div>
            <div className="flex-1 grid grid-cols-[1fr_112px] sm:grid-cols-[1fr_142px] gap-3 sm:gap-5 items-center py-3 min-h-0">
              <div className="flex items-center gap-3 min-w-0">
                <img src={student.photoUrl} alt={student.fullName} className="w-24 h-28 sm:w-32 sm:h-36 object-cover rounded-2xl border-2 border-amber-500/70 shadow-xl shrink-0 bg-slate-800"/>
                <div className="min-w-0 text-right"><div className="text-[10px] text-slate-400 mb-1">اسم الطالب</div><div className="font-black text-sm sm:text-lg leading-snug break-words">{student.fullName}</div><div className="mt-3 text-[10px] text-slate-400">رقم ولي الأمر</div><div className="font-mono font-black text-xs sm:text-sm text-amber-300 break-all">{student.guardianPhone || 'غير مسجل'}</div></div>
              </div>
              <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-xl border-2 border-amber-400 flex items-center justify-center aspect-square">{qrDataUrl ? <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain"/> : <div className="text-slate-500 text-xs">QR</div>}</div>
            </div>
          </div>
        </div>

        <div className="id-card-page id-card-back w-full max-w-[520px] aspect-[1.585/1] min-h-[320px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/60 rounded-[28px] overflow-hidden relative shadow-2xl font-['Tajawal'] flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.10)_0%,rgba(15,23,42,0)_68%)] pointer-events-none" />
          <div className="relative w-[58%] max-w-[270px] aspect-square rounded-full border-2 border-amber-400/50 bg-white/5 p-5 sm:p-7 shadow-2xl flex items-center justify-center">
            <img src={schoolLogo} alt="لوجو مدرسة تي اتشرومبي للألحان" className="w-full h-full object-contain rounded-full" referrerPolicy="no-referrer" />
          </div>
        </div>
      </div>
    </div>
  </div>;
};
