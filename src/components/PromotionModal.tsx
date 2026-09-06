/**
 * Module 5: PROMOTION & PROGRESSION MECHANISM (آلية الترفيع والاعتماد)
 * ترفيع الطالب وتجميد السنة الحالية مع أثر الاحتفال Confetti وتحديث مصفوفة الـ 16 سنة
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Lock,
  ArrowLeft,
  X,
  Sparkles,
  GraduationCap,
} from 'lucide-react';
import { Student } from '../types';
import { promoteStudentToNextStage, ACADEMIC_LEVELS, ACADEMIC_YEARS } from '../services/storage';

interface PromotionModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onPromoteSuccess: (updatedStudent: Student) => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  student,
  isOpen,
  onClose,
  onPromoteSuccess,
}) => {
  const [isPromoting, setIsPromoting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !student) return null;

  const currentLevelName = student.level;
  const currentYearName = student.year;

  // Calculate next stage names for preview
  let nextLIdx = student.levelIndex;
  let nextYIdx = student.yearIndex + 1;
  if (nextYIdx > 3) {
    nextYIdx = 0;
    nextLIdx = student.levelIndex + 1;
  }

  const isFinalGraduate = nextLIdx > 3;
  const nextLevelName = !isFinalGraduate ? ACADEMIC_LEVELS[nextLIdx] : 'مرحلة التخرج والخدمة';
  const nextYearName = !isFinalGraduate ? ACADEMIC_YEARS[nextYIdx] : 'خريج المعهد';

  const handleConfirmPromotion = () => {
    setIsPromoting(true);

    const res = promoteStudentToNextStage(student.id);

    if (res.success && res.updatedStudent) {
      // Fire celebration Confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#d97706', '#10b981', '#38bdf8'],
      });

      setSuccessMessage(res.message);
      setTimeout(() => {
        setIsPromoting(false);
        setSuccessMessage(null);
        onPromoteSuccess(res.updatedStudent!);
        onClose();
      }, 2000);
    } else {
      setIsPromoting(false);
      alert(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">اعتماد نتيجة والترفيع للمرحلة التالية</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Box */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center gap-3">
          <img
            src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt={student.fullName}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-500/40"
          />
          <div>
            <h4 className="font-bold text-slate-100 text-sm">{student.fullName}</h4>
            <span className="text-xs text-amber-400 font-mono">
              {student.deaconRank} | {student.studentCode}
            </span>
          </div>
        </div>

        {/* Stage Transition Diagram */}
        <div className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">المرحلة الحالية (مكتملة):</span>
              <span className="font-bold text-emerald-400">{currentLevelName}</span>
              <span className="text-[10px] text-slate-400 block">{currentYearName}</span>
            </div>

            <ArrowLeft className="w-5 h-5 text-amber-400 animate-pulse" />

            <div className="text-left">
              <span className="text-[10px] text-slate-400 block">المرحلة القادمة:</span>
              <span className="font-bold text-amber-300">{nextLevelName}</span>
              <span className="text-[10px] text-slate-400 block">{nextYearName}</span>
            </div>
          </div>

          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300 space-y-1">
            <div className="flex items-center gap-1 font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              آثار عملية الترفيع والاعتماد:
            </div>
            <ul className="list-disc list-inside text-[10px] text-slate-300 space-y-0.5 pr-1">
              <li>تجميد بيانات {currentYearName} وأرشفتها بنمط (قراءة فقط).</li>
              <li>فتح السنة الدراسية الجديدة لتسجيل الحضور والدرجات.</li>
              <li>تحديث خلية مصفوفة الـ 16 سنة بالجدول إلى 🟢 "ن" (ناجح).</li>
            </ul>
          </div>
        </div>

        {/* Success Message Banner */}
        {successMessage && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl text-center animate-bounce">
            🎉 {successMessage}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={isPromoting}
            onClick={handleConfirmPromotion}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            تأكيد والترفيع الفوري
          </button>
        </div>
      </div>
    </div>
  );
};
