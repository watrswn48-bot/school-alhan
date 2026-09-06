/**
 * Class 3: Lecture Attendance (حضور المحاضرات)
 * إدارة المحاضرات للـ Admin وتسجيل الحضور بالدقائق للخدام مع زر (انقضت) للغائبين التلقائي
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Clock,
  QrCode,
  CheckCircle2,
  AlertCircle,
  XCircle,
  UserX,
  X,
  Sparkles,
  Calendar,
  UserCheck,
  Award,
  Trash2,
  Star,
  Lock,
  MessageSquare,
  FileText,
  Check,
} from 'lucide-react';
import {
  Lecture,
  LectureAttendance,
  Student,
  Servant,
  AcademicLevel,
  UserSession,
} from '../types';
import {
  getLectures,
  saveLecture,
  closeLectureAndMarkAbsent,
  deleteLecture,
  getLectureAttendances,
  recordLectureAttendance,
  getStudents,
  getAcademicLevels,
  getServants,
  saveLectureEvaluation,
} from '../services/storage';
import { QRScannerModal } from './QRScannerModal';

interface LectureAttendanceProps {
  session: UserSession;
}

export const LectureAttendanceModule: React.FC<LectureAttendanceProps> = ({ session }) => {
  const [lectures, setLectures] = useState<Lecture[]>(() => getLectures());
  const [attendances, setAttendances] = useState<LectureAttendance[]>(() =>
    getLectureAttendances()
  );
  const [selectedLectureId, setSelectedLectureId] = useState<string>(
    lectures.find((l) => l.status === 'active')?.id || ''
  );

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [confirmCloseLecture, setConfirmCloseLecture] = useState<Lecture | null>(null);
  const [evaluatingLecture, setEvaluatingLecture] = useState<Lecture | null>(null);
  const [evaluationForm, setEvaluationForm] = useState<Record<string, { rating: number; note: string }>>({});
  const [servants, setServants] = useState<Servant[]>(() => getServants());
  const [customSpeakerName, setCustomSpeakerName] = useState<string>('');
  const [newLectureData, setNewLectureData] = useState<Partial<Lecture>>({
    title: '',
    speaker: '',
    levelName: 'جميع المراحل والصفوف',
    dateStr: new Date().toISOString().split('T')[0],
    timeStr: '06:30 PM',
  });

  const openEvaluationModal = (lec: Lecture) => {
    const allAtts = getLectureAttendances().filter((a) => a.lectureId === lec.id);
    const initialForm: Record<string, { rating: number; note: string }> = {};
    allAtts.forEach((a) => {
      initialForm[a.id] = {
        rating: a.rating !== undefined ? a.rating : 0,
        note: a.evaluationNote || '',
      };
    });
    setEvaluationForm(initialForm);
    setEvaluatingLecture(lec);
  };

  const handleOpenCreateModal = () => {
    const allServants = getServants();
    setServants(allServants);
    const initialSpeaker = allServants.length > 0 ? allServants[0].fullName : '';
    setNewLectureData({
      title: '',
      speaker: initialSpeaker,
      levelName: 'جميع المراحل والصفوف',
      dateStr: new Date().toISOString().split('T')[0],
      timeStr: '06:30 PM',
    });
    setCustomSpeakerName('');
    setIsCreateModalOpen(true);
  };

  // Attendance Form state
  const [selectedStudentForCheckin, setSelectedStudentForCheckin] = useState<Student | null>(null);
  const [checkinStatus, setCheckinStatus] = useState<'committed' | 'late'>('committed');
  const [lateMinutesInput, setLateMinutesInput] = useState<number>(15);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [filterByStage, setFilterByStage] = useState<boolean>(true);
  const [showEvaluatedHistory, setShowEvaluatedHistory] = useState<boolean>(false);

  const isAdmin = session.role === 'admin';
  const activeLectures = lectures.filter((l) => l.status === 'active');
  const elapsedLectures = lectures.filter((l) => l.status === 'elapsed');
  const pendingEvaluationLectures = elapsedLectures.filter((l) => !l.isEvaluated);
  const evaluatedLectures = elapsedLectures.filter((l) => l.isEvaluated);
  const displayedElapsedLectures = showEvaluatedHistory ? elapsedLectures : pendingEvaluationLectures;

  // Ensure effective selected lecture is always valid
  const effectiveSelectedLectureId =
    selectedLectureId && activeLectures.some((l) => l.id === selectedLectureId)
      ? selectedLectureId
      : activeLectures[0]?.id || '';

  const selectedLecture = lectures.find((l) => l.id === effectiveSelectedLectureId);

  const refreshData = () => {
    setLectures(getLectures());
    setAttendances(getLectureAttendances());
  };

  const dynamicLevels = getAcademicLevels();

  const handleCreateLectureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLectureData.title) return;

    const created = saveLecture({
      ...newLectureData,
      levelName: newLectureData.levelName || dynamicLevels[0] || 'عام',
      createdBy: session.fullName || 'الإدارة',
    });

    setIsCreateModalOpen(false);
    setNewLectureData({
      title: '',
      speaker: '',
      levelName: dynamicLevels[0] || 'عام',
      dateStr: new Date().toISOString().split('T')[0],
      timeStr: '06:30 PM',
    });
    refreshData();
    setSelectedLectureId(created.id);
  };

  const handleCloseLecture = (lectureId: string) => {
    const lec = lectures.find((l) => l.id === lectureId);
    if (!lec) return;
    setConfirmCloseLecture(lec);
  };

  const handleQRScanned = (scannedText: string) => {
    const students = getStudents();
    const clean = scannedText.trim().toLowerCase();

    const student = students.find(
      (s) =>
        s.studentCode.toLowerCase() === clean ||
        s.nationalId === clean ||
        s.id.toLowerCase() === clean
    );

    if (student) {
      setSelectedStudentForCheckin(student);
    } else {
      alert(`كود الطالب الممسوح (${scannedText}) غير موجود بقاعدة البيانات.`);
    }
  };

  const handleConfirmAttendance = () => {
    if (!selectedStudentForCheckin || !effectiveSelectedLectureId) return;

    const res = recordLectureAttendance(
      effectiveSelectedLectureId,
      selectedStudentForCheckin,
      checkinStatus,
      checkinStatus === 'late' ? lateMinutesInput : undefined,
      session.userId || 'servant',
      session.fullName || 'الخادم'
    );

    setFeedback(res.message);
    setSelectedStudentForCheckin(null);
    refreshData();
    setTimeout(() => setFeedback(null), 3000);
  };

  const currentLectureAttendances = attendances.filter((a) => a.lectureId === effectiveSelectedLectureId);
  const committedCount = currentLectureAttendances.filter((a) => a.status === 'committed').length;
  const lateCount = currentLectureAttendances.filter((a) => a.status === 'late').length;
  const absentCount = currentLectureAttendances.filter((a) => a.status === 'absent').length;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100">
              تسجيل ومتابعة حضور المحاضرات
            </h2>
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold rounded-full">
              {activeLectures.length} محاضرة نشطة
            </span>
          </div>
          <p className="text-xs text-slate-400">
            إنشاء المحاضرات، تسجيل الالتزام والتأخير بالدقائق، وزر التسكين التلقائي للغائبين
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            إنشاء محاضرة جديدة
          </button>
        )}
      </div>

      {/* Pending Evaluations Alert Banner */}
      {elapsedLectures.some((l) => !l.isEvaluated) && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
              <Award className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>إشعار للمحاضر: توجد محاضرات منتهية بانتظار التقييم</span>
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full">
                  {elapsedLectures.filter((l) => !l.isEvaluated).length} محاضرة بانتظار التقييم
                </span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                يرجى إدخال التقييمات والملاحظات للطلاب بعد الانتهاء من المحاضرة واعتتمادها نهائياً (يتم قفل التقييم فور الحفظ).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {elapsedLectures
              .filter((l) => !l.isEvaluated)
              .map((lec) => (
                <button
                  key={lec.id}
                  onClick={() => openEvaluationModal(lec)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0"
                >
                  <Star className="w-3.5 h-3.5 fill-slate-950" />
                  <span>رصد تقييم: {lec.title}</span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Lectures Selection Bar */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-300 block">اختر المحاضرة النشطة لتسجيل الحضور:</span>
        {activeLectures.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-300">لا توجد محاضرات نشطة حالياً لتسجيل الحضور</p>
            <p className="text-[11px] text-slate-500">
              عند إغلاق المحاضرة أو انقضائها، يتم حذفها تلقائياً من قائمة المحاضرات النشطة مع الاحتفاظ بكافة سجلات حضور الطلاب في ملفاتهم الشخصية.
            </p>
            {isAdmin && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                إنشاء محاضرة جديدة الآن
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeLectures.map((lec) => {
              const isSelected = lec.id === selectedLectureId;

              return (
                <div
                  key={lec.id}
                  onClick={() => setSelectedLectureId(lec.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all relative ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      نشطة حالياً
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{lec.dateStr}</span>
                  </div>

                  <h4 className="font-bold text-slate-100 text-sm mb-1 leading-snug">{lec.title}</h4>
                  <p className="text-xs text-amber-400/90 font-medium">{lec.speaker}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{lec.levelName}</p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseLecture(lec.id);
                      }}
                      className="flex-1 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      title="إغلاق المحاضرة وتوليد غياب المتبقين، وتحويل السجل للملفات الشخصية"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      إغلاق المحاضرة (انقضت)
                    </button>

                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`هل أنت متأكد من حذف المحاضرة "${lec.title}" من القائمة النشطة؟\nستبقى جميع سجلات حضور الطلاب السابقة محفوظة بالملف الشخصي.`)) {
                            deleteLecture(lec.id);
                            refreshData();
                            if (selectedLectureId === lec.id) {
                              setSelectedLectureId('');
                            }
                          }
                        }}
                        className="p-2 bg-slate-950 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl transition-all"
                        title="حذف من المحاضرات النشطة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Lecture Check-in Section */}
      {selectedLecture ? (
        <div className="space-y-6">
          
          {/* Lecture Stats Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
              <span className="block text-[11px] text-slate-400">إجمالي المسجلين</span>
              <span className="block text-2xl font-black font-mono text-slate-100 mt-1">
                {currentLectureAttendances.length}
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <span className="block text-[11px] text-emerald-400 font-bold">ملتزم / حاضر</span>
              <span className="block text-2xl font-black font-mono text-emerald-300 mt-1">
                {committedCount}
              </span>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <span className="block text-[11px] text-amber-400 font-bold">متأخر (دقائق)</span>
              <span className="block text-2xl font-black font-mono text-amber-300 mt-1">
                {lateCount}
              </span>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
              <span className="block text-[11px] text-rose-400 font-bold">غائب</span>
              <span className="block text-2xl font-black font-mono text-rose-300 mt-1">
                {absentCount}
              </span>
            </div>
          </div>

          {/* Servant Check-in Controls */}
          {selectedLecture.status === 'active' ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800 pb-4 gap-4">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-amber-400" />
                    خانة تسجيل الحضور - المحاضرة النشطة: <span className="text-amber-400 font-extrabold">{selectedLecture.title}</span>
                  </h3>

                  {activeLectures.length > 1 && (
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-xs font-bold text-slate-300">تبديل المحاضرة المطلوب التسجيل بها ({activeLectures.length}):</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {activeLectures.map((lec) => (
                          <button
                            key={lec.id}
                            type="button"
                            onClick={() => setSelectedLectureId(lec.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                              lec.id === selectedLecture.id
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-extrabold'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span>{lec.title}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                              lec.id === selectedLecture.id ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-900 text-amber-400 font-normal'
                            }`}>
                              {lec.levelName}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCloseLecture(selectedLecture.id)}
                    className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    title="إغلاق المحاضرة الحالية"
                  >
                    <UserX className="w-4 h-4" />
                    إغلاق المحاضرة
                  </button>
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    مسح QR Code
                  </button>
                </div>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold animate-fade-in">
                  ✅ {feedback}
                </div>
              )}

              {/* Quick Select Student or Confirm Form */}
              {selectedStudentForCheckin ? (
                <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-2xl space-y-4 animate-scale-up">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedStudentForCheckin.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={selectedStudentForCheckin.fullName}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-amber-500/40"
                      />
                      <div>
                        <h4 className="font-bold text-slate-100 text-sm">
                          {selectedStudentForCheckin.fullName}
                        </h4>
                        <span className="text-xs text-amber-400 font-mono">
                          {selectedStudentForCheckin.studentCode} | {selectedStudentForCheckin.deaconRank}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedStudentForCheckin(null)}
                      className="text-slate-400 hover:text-slate-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Status selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckinStatus('committed')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        checkinStatus === 'committed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ملتزم / حاضر بانتظام
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckinStatus('late')}
                      className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        checkinStatus === 'late'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Clock className="w-4 h-4 text-amber-400" />
                      متأخر
                    </button>
                  </div>

                  {/* If Late, specify minutes */}
                  {checkinStatus === 'late' && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
                      <label className="block text-xs font-semibold text-amber-300">
                        مدّة التأخير بالدقائق:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={lateMinutesInput}
                          onChange={(e) => setLateMinutesInput(Number(e.target.value))}
                          className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none"
                        />
                        <span className="text-xs text-slate-400">دقيقة</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleConfirmAttendance}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all"
                  >
                    تأكيد وتسجيل الحضور بالحيّز اللحظي
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-300">
                      اختر الطالب يدوياً للتسجيل السريع:
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilterByStage(!filterByStage)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-[11px] text-amber-400 font-semibold transition-colors"
                    >
                      {filterByStage
                        ? `عرض طلاب (${selectedLecture.levelName}) فقط`
                        : 'عرض جميع الطلاب عبر كافة المراحل'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                    {getStudents()
                      .filter((s) => {
                        if (!filterByStage) return true;
                        if (!selectedLecture.levelName || selectedLecture.levelName === 'عام' || selectedLecture.levelName === 'جميع المراحل والصفوف') return true;
                        return s.level === selectedLecture.levelName;
                      })
                      .map((stu) => {
                        const isRecorded = currentLectureAttendances.some((a) => a.studentId === stu.id);

                        return (
                          <button
                            key={stu.id}
                            disabled={isRecorded}
                            onClick={() => setSelectedStudentForCheckin(stu)}
                            className={`p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                              isRecorded
                                ? 'bg-slate-950 border-slate-800 opacity-50 cursor-not-allowed'
                                : 'bg-slate-950 hover:border-amber-500/60 text-slate-200'
                            }`}
                          >
                            <div className="truncate pr-1">
                              <span className="block font-bold text-xs truncate">{stu.fullName}</span>
                              <span className="text-[10px] text-amber-400 font-mono">{stu.studentCode} | {stu.level}</span>
                            </div>
                            {isRecorded && (
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                مسجّل
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              🔒 هذه المحاضرة مغلقة (انقضت) ولا يمكن تسجيل حضور جديد بها.
            </div>
          )}

          {/* Current Lecture Registered Attendance Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-100 border-b border-slate-800 pb-3">
              سجل الحضور والغياب لهذه المحاضرة ({currentLectureAttendances.length})
            </h3>

            {currentLectureAttendances.length === 0 ? (
              <p className="text-center py-6 text-slate-500 text-xs">
                لم يتم تسجيل أي حضور لهذه المحاضرة بعد.
              </p>
            ) : (
              <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto pr-1">
                {currentLectureAttendances.map((att) => (
                  <div
                    key={att.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`p-1.5 rounded-xl border font-bold text-[10px] ${
                          att.status === 'committed'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : att.status === 'late'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {att.status === 'committed'
                          ? 'حاضر ملتزم'
                          : att.status === 'late'
                          ? `متأخر (${att.lateMinutes} دقيقة)`
                          : 'غائب'}
                      </span>
                      <div>
                        <span className="block font-bold text-slate-200">{att.studentName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          بواسطة: {att.recordedByName}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(att.timestamp).toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-500 bg-slate-900 rounded-3xl border border-slate-800">
          <BookOpen className="w-12 h-12 mx-auto text-slate-600 mb-2 stroke-[1.5]" />
          <p className="text-sm">يرجى اختيار أحد المحاضرات من القائمة أعلاه لمتابعة سجلات الحضور.</p>
        </div>
      )}

      {/* Elapsed Lectures & Speaker Evaluations Section */}
      {elapsedLectures.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100">
                {showEvaluatedHistory ? 'أرشيف جميع المحاضرات المنتهية والتقييمات' : 'محاضرات بانتظار تقييم المحاضر'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
                {pendingEvaluationLectures.length} محاضرة بانتظار التقييم
              </span>

              {evaluatedLectures.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowEvaluatedHistory(!showEvaluatedHistory)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {showEvaluatedHistory
                      ? 'إخفاء المعتمدة (إظهار المعلقة فقط)'
                      : `عرض السجل المعتمد (${evaluatedLectures.length})`}
                  </span>
                </button>
              )}
            </div>
          </div>

          {displayedElapsedLectures.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 border border-slate-800/80 rounded-2xl space-y-2">
              <Check className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-slate-200">
                ممتاز! جميع المحاضرات المنتهية تم رصد تقييماتها واعتتمادها بنجاح.
              </p>
              <p className="text-xs text-slate-400">
                لا توجد محاضرات معلقة بانتظار التقييم حالياً.
              </p>
              {evaluatedLectures.length > 0 && !showEvaluatedHistory && (
                <button
                  type="button"
                  onClick={() => setShowEvaluatedHistory(true)}
                  className="mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 underline inline-block"
                >
                  اضغط هنا لعرض أرشيف المحاضرات التي تم تقييمها سابقا
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {displayedElapsedLectures.map((lec) => (
                <div
                  key={lec.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono text-slate-400">{lec.dateStr}</span>
                      {lec.isEvaluated ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          مقفول ومعتمد
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          بانتظار التقييم
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-100 text-sm mb-1">{lec.title}</h4>
                    <p className="text-xs text-amber-400/90 font-medium">المحاضر: {lec.speaker}</p>
                    <p className="text-[11px] text-slate-400">{lec.levelName}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => openEvaluationModal(lec)}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        lec.isEvaluated
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10'
                      }`}
                    >
                      {lec.isEvaluated ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>عرض التقييم المعتمد (مقفول)</span>
                        </>
                      ) : (
                        <>
                          <Star className="w-3.5 h-3.5 fill-slate-950" />
                          <span>رصد تقييم المحاضر للطلاب الآن</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Lecture Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                إنشاء محاضرة كنسية جديدة
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLectureSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">عنوان المحاضرة:</label>
                <input
                  type="text"
                  required
                  value={newLectureData.title || ''}
                  onChange={(e) =>
                    setNewLectureData({ ...newLectureData, title: e.target.value })
                  }
                  placeholder="مثال: طقس صوم العذراء والمجامع المسكونية"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">المحاضر / المتحدث (الخادم):</label>
                <div className="space-y-2">
                  <select
                    value={
                      servants.some((s) => s.fullName === newLectureData.speaker)
                        ? newLectureData.speaker
                        : 'CUSTOM'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'CUSTOM') {
                        setNewLectureData({ ...newLectureData, speaker: customSpeakerName || '' });
                      } else {
                        setNewLectureData({ ...newLectureData, speaker: val });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {servants.length > 0 && (
                      <optgroup label="قائمة الخدام والمشرفين المسجلين">
                        {servants.map((srv) => (
                          <option key={srv.id} value={srv.fullName}>
                            {srv.fullName} {srv.role === 'admin' ? '(أب كاهن / مشرف)' : '(خادم)'}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <option value="CUSTOM">✍️ كتابة خادم / محاضر آخر (خارجي)...</option>
                  </select>

                  {(!servants.some((s) => s.fullName === newLectureData.speaker) ||
                    newLectureData.speaker === '' ||
                    newLectureData.speaker === customSpeakerName) && (
                    <input
                      type="text"
                      required
                      value={newLectureData.speaker || ''}
                      onChange={(e) => {
                        setCustomSpeakerName(e.target.value);
                        setNewLectureData({ ...newLectureData, speaker: e.target.value });
                      }}
                      placeholder="أدخل اسم المحاضر الخارجي هنا..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none animate-fade-in text-amber-300"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">المرحلة الموجهة لها:</label>
                <select
                  value={newLectureData.levelName || dynamicLevels[0] || 'عام'}
                  onChange={(e) =>
                    setNewLectureData({
                      ...newLectureData,
                      levelName: e.target.value as AcademicLevel,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                >
                  <option value="جميع المراحل والصفوف">جميع المراحل والصفوف</option>
                  {dynamicLevels.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">التاريخ:</label>
                  <input
                    type="date"
                    value={newLectureData.dateStr || ''}
                    onChange={(e) =>
                      setNewLectureData({ ...newLectureData, dateStr: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الوقت:</label>
                  <input
                    type="text"
                    value={newLectureData.timeStr || ''}
                    onChange={(e) =>
                      setNewLectureData({ ...newLectureData, timeStr: e.target.value })
                    }
                    placeholder="06:30 PM"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all"
                >
                  حفظ وتفعيل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Close Lecture Modal */}
      {confirmCloseLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">إغلاق المحاضرة وتوليد الغياب</h3>
                <span className="text-xs text-rose-300 font-semibold">{confirmCloseLecture.title}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
              هل أنت متأكد من إغلاق المحاضرة؟ سيؤدي هذا الإجراء تلقائياً إلى تسجيل جميع طلاب مرحلة ({confirmCloseLecture.levelName}) الذين لم يحضروا كـ <strong className="text-rose-400">(غائب)</strong>، ثم نقل المحاضرة من سجل المحاضرات النشطة مع <strong className="text-emerald-400">الاحتفاظ الكامل بكافة بيانات الحضور والغياب في الملفات الشخصية للطلاب</strong>.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCloseLecture(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetLec = confirmCloseLecture;
                  const result = closeLectureAndMarkAbsent(targetLec.id);
                  refreshData();
                  if (selectedLectureId === targetLec.id) {
                    setSelectedLectureId('');
                  }
                  setFeedback(`تم إغلاق المحاضرة "${targetLec.title}" بنجاح وتسجيل عدد (${result.closedCount}) طالب كـ (غائب). يرجى إدخال تقييم الطلاب الآن.`);
                  setConfirmCloseLecture(null);
                  openEvaluationModal(targetLec);
                  setTimeout(() => setFeedback(null), 5000);
                }}
                className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2"
              >
                <UserX className="w-4 h-4" />
                تأكيد إغلاق المحاضرة والتقييم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lecture Evaluation Modal */}
      {evaluatingLecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-100 flex items-center gap-2">
                    <span>تقييم المحاضر لأداء وتفاعل الطلاب</span>
                    {evaluatingLecture.isEvaluated ? (
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        مقفول ومعتمد
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-full">
                        بانتظار الرصد
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    محاضرة: <strong className="text-slate-200">{evaluatingLecture.title}</strong> | المحاضر: <strong className="text-amber-400">{evaluatingLecture.speaker}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEvaluatingLecture(null)}
                className="p-2 text-slate-400 hover:text-slate-100 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning / Lock Banner */}
            <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 shrink-0">
              {evaluatingLecture.isEvaluated ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    تم حفظ واعتماد هذا التقييم نهائياً بتاريخ{' '}
                    <strong>
                      {evaluatingLecture.evaluatedAt ? new Date(evaluatingLecture.evaluatedAt).toLocaleDateString('ar-EG') : ''}
                    </strong>{' '}
                    بواسطة (<strong>{evaluatingLecture.evaluatedByName || evaluatingLecture.speaker}</strong>). لا يمكن تعديل التقييمات بعد الحفظ.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>تنبيه هـام:</strong> بمجرد الضغط على (حفظ واعتماد التقييم)، سيتم قفل الدرجات والتقييمات نهائياً ولن يمكن تعديلها بعد ذلك وفق ضوابط النظام.
                  </span>
                </div>
              )}
            </div>

            {/* Students Evaluation List */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {attendances.filter((a) => a.lectureId === evaluatingLecture.id).length === 0 ? (
                <p className="text-center py-8 text-slate-500 text-xs">
                  لا يوجد طلاب مسجلون بحضور هذه المحاضرة.
                </p>
              ) : (
                attendances
                  .filter((a) => a.lectureId === evaluatingLecture.id)
                  .map((att) => {
                    const currentState = evaluationForm[att.id] || { rating: att.rating || 5, note: att.evaluationNote || '' };
                    const isLocked = Boolean(evaluatingLecture.isEvaluated || att.isEvaluationLocked);

                    return (
                      <div
                        key={att.id}
                        className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-100 text-sm">{att.studentName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({att.studentCode})</span>
                            </div>
                            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                              حالة الحضور:{' '}
                              {att.status === 'committed' ? (
                                <span className="text-emerald-400">🟢 حاضر ملتزم</span>
                              ) : att.status === 'late' ? (
                                <span className="text-amber-400">🟡 متأخر ({att.lateMinutes} دقيقة)</span>
                              ) : (
                                <span className="text-rose-400">🔴 غائب</span>
                              )}
                            </div>
                          </div>

                          {/* Star Rating Picker */}
                          {att.status === 'absent' ? (
                            <div className="shrink-0 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
                              <UserX className="w-3.5 h-3.5" />
                              <span>غير متاح للتقييم (طالب غائب)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-xs font-bold text-slate-400 ml-1">
                                التقييم ({currentState.rating || 0}/5):
                              </span>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  disabled={isLocked}
                                  onClick={() => {
                                    if (isLocked) return;
                                    const nextRating = star === currentState.rating ? 0 : star;
                                    setEvaluationForm({
                                      ...evaluationForm,
                                      [att.id]: { ...currentState, rating: nextRating },
                                    });
                                  }}
                                  className={`p-1 transition-transform ${
                                    !isLocked ? 'hover:scale-125 cursor-pointer' : 'cursor-default opacity-85'
                                  }`}
                                  title={isLocked ? '' : `تحديد ${star} نجوم`}
                                >
                                  <Star
                                    className={`w-5 h-5 ${
                                      star <= (currentState.rating || 0)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-700'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Note Input */}
                        <div>
                          <input
                            type="text"
                            disabled={isLocked}
                            value={currentState.note}
                            onChange={(e) => {
                              if (isLocked) return;
                              setEvaluationForm({
                                ...evaluationForm,
                                [att.id]: { ...currentState, note: e.target.value },
                              });
                            }}
                            placeholder={isLocked ? 'لا توجد ملاحظة مدونة' : 'ملاحظة أو تقييم المحاضر للطالب (اختياري)...'}
                            className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEvaluatingLecture(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs transition-all"
              >
                إلغاء / إغلاق
              </button>

              {!evaluatingLecture.isEvaluated && (
                <button
                  type="button"
                  onClick={() => {
                    const evalsPayload = Object.entries(evaluationForm).map(([attendanceId, val]) => ({
                      attendanceId,
                      rating: val.rating,
                      note: val.note,
                    }));
                    const res = saveLectureEvaluation(
                      evaluatingLecture.id,
                      evalsPayload,
                      session.fullName || evaluatingLecture.speaker
                    );
                    refreshData();
                    setFeedback(res.message);
                    setEvaluatingLecture(null);
                    setTimeout(() => setFeedback(null), 5000);
                  }}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>حفظ واعتتماد التقييم نهائياً 🔒</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRScanned}
        title="مسح QR Code الطالب للحضور بالمحاضرة"
      />
    </div>
  );
};
