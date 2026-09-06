/**
 * Module 6: AUTOMATED SMART ID CARD GENERATION (البطاقات الذكية للطلاب)
 * بطاقة هويّة الشماس عالية الدقة والوضوح بالوجهين الأمامي والخلفي مع طباعة مجهزة
 */

import React from 'react';
import { Printer, X, QrCode, Shield, Phone, Sparkles } from 'lucide-react';
import { Student } from '../types';
import { getSchoolLogo } from '../services/storage';

interface SmartIDCardModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SmartIDCardModal: React.FC<SmartIDCardModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !student) return null;

  const schoolLogo = getSchoolLogo();

  const handlePrint = () => {
    window.print();
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${student.studentCode}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl no-print">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-500/40 bg-slate-950 shadow-md">
              <img src={schoolLogo} alt="شعار المدرسة" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100">بطاقة الهوية الذكية المعتمدة</h3>
              <p className="text-xs text-slate-400">معاينة وطباعة بطاقة الشماس المجهزة للمسح بالكاميرا مع الشعار الرسمي</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              طباعة البطاقة الذكية
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INTERACTIVE PREVIEW CONTAINER */}
        <div className="space-y-6 flex flex-col items-center">
          
          {/* PRINTABLE ID CARDS CONTAINER (Included in @media print) */}
          <div id="printable-id-cards" className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
            
            {/* FRONT SIDE (الوجه الأمامي) */}
            <div className="w-[85.6mm] h-[53.9mm] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100 rounded-2xl border-2 border-amber-500/50 p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between shrink-0 mx-auto font-['Tajawal']">
              {/* Background School Logo Watermark */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-15 pointer-events-none rounded-full overflow-hidden">
                <img src={schoolLogo} alt="" className="w-full h-full object-cover grayscale contrast-125" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

              {/* Header with School Logo */}
              <div className="flex items-center justify-between border-b border-amber-500/30 pb-1.5 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow-lg bg-slate-950 shrink-0 ring-2 ring-amber-400/40 p-0.5">
                    <img src={schoolLogo} alt="شعار مدرسة الشمامسة" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-black tracking-tight text-amber-300">
                      أكاديمية ومدرسة الشماس
                    </span>
                    <span className="block text-[8px] text-slate-300">
                      كنيسة القديسين — خورس الشمامسة
                    </span>
                  </div>
                </div>
                <span className="text-[8.5px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 shadow-inner">
                  {student.studentCode}
                </span>
              </div>

              {/* Body Content - Removed Rank, Service, and School */}
              <div className="flex items-center gap-3 py-1 relative z-10">
                <img
                  src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={student.fullName}
                  className="w-16 h-16 rounded-xl object-cover ring-2 ring-amber-500/60 shadow-md border border-amber-500 shrink-0 bg-slate-900"
                />

                <div className="space-y-1 text-right flex-1 min-w-0">
                  <span className="block font-black text-sm text-slate-100 truncate leading-tight">
                    {student.fullName}
                  </span>

                  {/* Certified Membership Tag featuring School Logo */}
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/15 border border-amber-500/30 rounded-lg w-fit shadow-xs">
                    <img src={schoolLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover shrink-0 border border-amber-400/50" referrerPolicy="no-referrer" />
                    <span className="text-[9px] font-black text-amber-300">بطاقة عضوية معتمدة</span>
                  </div>

                  <span className="block text-[8px] text-slate-400 font-mono">
                    الكود الشخصي: {student.studentCode}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[7px] text-slate-400 font-mono relative z-10">
                <span>تاريخ الإصدار: 2026/2027</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <span>ختم الأكاديمية الرسمي</span>
                  <Sparkles className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>

            {/* BACK SIDE (الوجه الخلفي) */}
            <div className="w-[85.6mm] h-[53.9mm] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 rounded-2xl border-2 border-amber-500/50 p-3 shadow-2xl relative overflow-hidden flex flex-col justify-between shrink-0 mx-auto font-['Tajawal']">
              {/* Background School Logo Watermark */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-15 pointer-events-none rounded-full overflow-hidden">
                <img src={schoolLogo} alt="" className="w-full h-full object-cover grayscale contrast-125" referrerPolicy="no-referrer" />
              </div>

              {/* Header with School Logo and Title */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-1 relative z-10">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-400 shadow-sm shrink-0">
                    <img src={schoolLogo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[9.5px] font-black text-amber-400">
                    بطاقة التحقق للقداسات والمحاضرات
                  </span>
                </div>
                <span className="text-[8px] text-slate-400 font-mono">{student.studentCode}</span>
              </div>

              {/* High Contrast QR Code & Security Info */}
              <div className="flex items-center justify-between gap-3 py-1">
                <div className="p-1.5 bg-white rounded-xl shadow-md border border-amber-500/40 shrink-0">
                  <img src={qrCodeUrl} alt="Student QR Code" className="w-16 h-16" />
                </div>

                <div className="space-y-1.5 text-right text-[8px] text-slate-300 flex-1">
                  <div className="space-y-0.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                    <span className="block text-[7.5px] text-slate-400">الرقم القومي للشماس:</span>
                    <span className="font-mono text-amber-300 font-black text-[9px]">{student.nationalId || 'غير مسجل'}</span>
                  </div>
                  {student.guardianPhone && (
                    <div className="space-y-0.5 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                      <span className="block text-[7.5px] text-slate-400">طوارئ ولي الأمر:</span>
                      <span className="font-mono text-slate-200 font-bold">{student.guardianPhone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stamp & Footer */}
              <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[7px] text-slate-400">
                <div className="flex items-center gap-1">
                  <img src={schoolLogo} alt="" className="w-3.5 h-3.5 rounded-full object-cover border border-amber-400/40" referrerPolicy="no-referrer" />
                  <span>ختم واعتماد إدارة مدرسة الشمامسة ✍️</span>
                </div>
                <span className="text-amber-400 font-bold">مسح الكاميرا فوري</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
