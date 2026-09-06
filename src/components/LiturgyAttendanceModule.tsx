/**
 * Class 2: Liturgical Attendance (تسجيل حضور القداس الإلهي)
 * مسح حصري عبر كاميرا الـ QR Code وتسجيل ختم الزمني الثابت مع عداد الحاضرين اللحظي
 */

import React, { useState, useEffect } from 'react';
import {
  Church,
  Camera,
  CheckCircle2,
  Clock,
  Users,
  AlertTriangle,
  QrCode,
  Sparkles,
  Flame,
  Search,
  CalendarCheck,
} from 'lucide-react';
import { LiturgyAttendance, Student, UserSession } from '../types';
import {
  getLiturgyAttendances,
  recordLiturgyAttendance,
  getStudents,
} from '../services/storage';
import { QRScannerModal } from './QRScannerModal';

interface LiturgyAttendanceProps {
  session: UserSession;
}

export const LiturgyAttendanceModule: React.FC<LiturgyAttendanceProps> = ({ session }) => {
  const [liturgyList, setLiturgyList] = useState<LiturgyAttendance[]>(() => getLiturgyAttendances());
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
    studentName?: string;
    timeStr?: string;
  } | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLiturgies = liturgyList.filter((l) => l.dateStr === todayStr);

  const handleQRScanned = (scannedText: string) => {
    const students = getStudents();
    const clean = scannedText.trim().toLowerCase();

    const student = students.find(
      (s) =>
        s.studentCode.toLowerCase() === clean ||
        s.nationalId === clean ||
        s.id.toLowerCase() === clean
    );

    if (!student) {
      setFeedbackMessage({
        type: 'error',
        text: `رمز الـ QR Code (${scannedText}) غير مسجّل بقاعدة بيانات الطلاب بالمنصة!`,
      });
      return;
    }

    const result = recordLiturgyAttendance(
      student,
      session.userId || 'servant',
      session.fullName || 'الخادم'
    );

    if (result.success && result.record) {
      setFeedbackMessage({
        type: 'success',
        text: result.message,
        studentName: student.fullName,
        timeStr: result.record.timeStr,
      });
      setLiturgyList(getLiturgyAttendances());
    } else {
      setFeedbackMessage({
        type: 'warning',
        text: result.message,
        studentName: student.fullName,
        timeStr: result.record?.timeStr,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute left-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
              <Church className="w-3.5 h-3.5" />
              تسجيل حضور القداس الإلهي - خورس الشمامسة
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              ماسح الـ QR Code لحضور القداس
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              تسجيل حضور موثق وغير قابل للتعديل بالطابع الزمني الدقيق (بالدقيقة والثانية) مع إحصائية لحظية لعدد الحاضرين.
            </p>
          </div>

          {/* Big Live Counter Box */}
          <div className="bg-slate-950/80 border border-amber-500/40 rounded-2xl p-4 text-center shrink-0 shadow-lg min-w-[180px]">
            <span className="block text-[11px] text-amber-400 font-bold uppercase tracking-wider">
              عدد الحاضرين اليوم
            </span>
            <span className="block text-4xl font-black font-mono text-amber-300 my-1 animate-pulse">
              {todayLiturgies.length}
            </span>
            <span className="block text-[10px] text-slate-400">
              تاريخ القداس: {todayStr}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Action Button (Camera QR Only) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-inner">
          <Camera className="w-8 h-8" />
        </div>

        <div className="max-w-md mx-auto space-y-1">
          <h3 className="text-lg font-bold text-slate-100">
            فتح الكاميرا لتسجيل الشماس بالقداس
          </h3>
          <p className="text-xs text-slate-400">
            وجه كاميرا الجهاز نحو رمز الـ QR Code في بطاقة الهوية الذكية للتحقق اللحظي
          </p>
        </div>

        <button
          onClick={() => {
            setFeedbackMessage(null);
            setIsScannerOpen(true);
          }}
          className="px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 inline-flex items-center gap-3"
        >
          <QrCode className="w-5 h-5" />
          افتح كاميرا الكود الآن
        </button>

        <div className="pt-2 text-[11px] text-amber-300/80 font-medium flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          المسح بالكاميرا إجباري ومخصص لمنع التلاعب وتوثيق دقيق للحضور
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-start gap-3 shadow-lg animate-scale-up ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : feedbackMessage.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="block font-bold text-sm mb-0.5">
              {feedbackMessage.studentName ? feedbackMessage.studentName : 'تنبيه المسح'}
            </span>
            <p>{feedbackMessage.text}</p>
            {feedbackMessage.timeStr && (
              <span className="block mt-1 font-mono text-[10px] opacity-80">
                ⏰ التوقيت المسجّل: {feedbackMessage.timeStr}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Today's Liturgy Live Attendance Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              سجل حضور الشمامسة بالقداس الإلهي اليوم ({todayLiturgies.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{todayStr}</span>
        </div>

        {todayLiturgies.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Clock className="w-10 h-10 mx-auto text-slate-600 stroke-[1.5]" />
            <p className="text-xs">لم يتم تسجيل حضور أي شماس في قداس اليوم بعد.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todayLiturgies.map((lit, idx) => (
              <div
                key={lit.id}
                className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-3 shadow-md hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/20">
                    #{todayLiturgies.length - idx}
                  </div>
                  <div>
                    <span className="block font-bold text-slate-200 text-xs">
                      {lit.studentName}
                    </span>
                    <span className="inline-block px-2 py-0.5 mt-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-semibold">
                      {lit.studentRank}
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono">
                  <span className="block text-xs font-bold text-emerald-400">
                    {lit.timeStr}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {lit.studentCode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Scanner Camera Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRScanned}
        strictCameraOnly={true}
        title="ماسح QR Code حضور القداس"
        subtitle="وجه كاميرا الهاتف نحو بطاقة الشماس لتسجيل الحضور الفوري بالقداس"
      />
    </div>
  );
};
