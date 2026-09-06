/**
 * Module 3: CUMULATIVE STUDENT PROFILE (الملف الشخصي التراكمي للطالب)
 * الهيكل التراكمي لـ 16 سنة دراسية مع الشريط العلوي والتبويبات الـ 4 التفاعلية
 */

import React, { useState } from 'react';
import {
  X,
  Church,
  BookOpen,
  Award,
  MessageSquare,
  Lock,
  Star,
  CheckCircle2,
  Clock,
  QrCode,
  Phone,
  Calendar,
  Sparkles,
  ShieldCheck,
  Plus,
  ArrowRight,
  TrendingUp,
  LogOut,
  Printer,
} from 'lucide-react';
import {
  Student,
  YearProgress,
  LiturgyAttendance,
  LectureAttendance,
  AcademicSubjectResult,
  BehaviorNote,
  UserSession,
} from '../types';
import { CurriculaModule } from './CurriculaModule';
import {
  getLiturgyAttendances,
  getLectureAttendances,
  updateLectureRating,
  getSubjectResults,
  saveSubjectResult,
  getBehaviorNotes,
  addBehaviorNote,
  getAcademicLevels,
  getAcademicYears,
  calculateGradeEstimate,
  DEFAULT_SUBJECTS,
  EXAM_TYPES,
  ACADEMIC_LEVELS,
  ACADEMIC_YEARS,
  getSchoolLogo,
} from '../services/storage';

interface CumulativeProfileModalProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  onGenerateIDCard: (student: Student) => void;
  onTriggerPromotion?: (student: Student) => void;
  onLogout?: () => void;
}

export const CumulativeProfileModal: React.FC<CumulativeProfileModalProps> = ({
  student,
  isOpen,
  onClose,
  session,
  onGenerateIDCard,
  onTriggerPromotion,
  onLogout,
}) => {
  const levels = getAcademicLevels();
  const years = getAcademicYears();
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(student.levelIndex);
  const [selectedYearIdx, setSelectedYearIdx] = useState<number>(student.yearIndex);
  const [activeTab, setActiveTab] = useState<'liturgies' | 'lectures' | 'grades' | 'behavior' | 'curricula'>('liturgies');

  // Logs & Results State
  const liturgyLogs = getLiturgyAttendances().filter((l) => l.studentId === student.id);
  const [lectureLogs, setLectureLogs] = useState(() =>
    getLectureAttendances().filter((a) => a.studentId === student.id)
  );
  const [subjectResults, setSubjectResults] = useState(() => getSubjectResults(student.id));
  const [behaviorNotes, setBehaviorNotes] = useState(() => getBehaviorNotes(student.id));

  // Add Note Form
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<'إيجابي' | 'تنبيه' | 'ملاحظة عامة'>('إيجابي');

  // Add Grade Form
  const [showAddGradeForm, setShowAddGradeForm] = useState(false);
  const [newGradeSubject, setNewGradeSubject] = useState<string>(DEFAULT_SUBJECTS[0]);
  const [newGradeExamType, setNewGradeExamType] = useState<string>(EXAM_TYPES[0]);
  const [newGradeScore, setNewGradeScore] = useState<number | ''>(95);
  const [newGradeMaxScore, setNewGradeMaxScore] = useState<number>(100);
  const [newGradeNotes, setNewGradeNotes] = useState('');

  if (!isOpen) return null;

  const isCurrentActiveStage =
    selectedLevelIdx === student.levelIndex && selectedYearIdx === student.yearIndex;
  const isPastArchivedStage =
    selectedLevelIdx < student.levelIndex ||
    (selectedLevelIdx === student.levelIndex && selectedYearIdx < student.yearIndex);
  const isFutureLockedStage = !isCurrentActiveStage && !isPastArchivedStage;

  const isReadOnlyMode = session.mode === 'student' || isPastArchivedStage;
  const canSetRating =
    !isReadOnlyMode && (session.role === 'admin' || session.permissions?.canSetRatings);
  const canWriteNote =
    !isReadOnlyMode && (session.role === 'admin' || session.permissions?.canWriteNotes);
  const canManageGrades =
    !isReadOnlyMode && (session.role === 'admin' || session.permissions?.canManageGrades !== false);

  const handleStarRatingChange = (attendanceId: string, rating: number) => {
    if (!canSetRating) return;
    const res = updateLectureRating(attendanceId, rating);
    if (res && !res.success && res.message) {
      alert(res.message);
      return;
    }
    setLectureLogs(getLectureAttendances().filter((a) => a.studentId === student.id));
  };

  const handleSaveGradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageGrades || newGradeScore === '') return;

    saveSubjectResult({
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.fullName,
      levelIndex: selectedLevelIdx,
      yearIndex: selectedYearIdx,
      levelName: levels[selectedLevelIdx],
      yearName: years[selectedYearIdx],
      subjectName: newGradeSubject,
      examType: newGradeExamType,
      score: Number(newGradeScore),
      maxScore: Number(newGradeMaxScore) || 100,
      notes: newGradeNotes,
      isApproved: true,
      updatedBy: session.fullName || 'الخادم',
    });

    setSubjectResults(getSubjectResults(student.id));
    setNewGradeNotes('');
    setShowAddGradeForm(false);
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !canWriteNote) return;

    addBehaviorNote({
      studentId: student.id,
      levelIndex: selectedLevelIdx,
      yearIndex: selectedYearIdx,
      noteText: newNoteText.trim(),
      category: newNoteCategory,
      authorId: session.userId || 'servant',
      authorName: session.fullName || 'الخادم',
    });

    setBehaviorNotes(getBehaviorNotes(student.id));
    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div id="printable-student-profile" className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col">
        
        {/* STICKY TOP BAR (الملف الشخصي التراكمي للطالب) */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-6 border-b border-slate-800 shrink-0 relative shadow-md overflow-hidden">
          {/* Subtle Background Watermark of School Logo */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.06] pointer-events-none rounded-full overflow-hidden select-none">
            <img
              src={getSchoolLogo()}
              alt=""
              className="w-full h-full object-cover grayscale contrast-125"
              referrerPolicy="no-referrer"
            />
          </div>

          <button
            onClick={onClose}
            className="absolute left-6 top-6 p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-2xl transition-colors no-print z-20"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
            {/* School Logo Badge */}
            <div className="flex flex-col items-center gap-1.5 pl-0 sm:pl-5 border-b sm:border-b-0 sm:border-l border-slate-800 pb-3 sm:pb-0 shrink-0">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-500/60 bg-slate-950 p-1 shadow-xl ring-2 ring-amber-400/40">
                <img
                  src={getSchoolLogo()}
                  alt="شعار المدرسة"
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] font-black text-amber-400">مدرسة الشماس</span>
            </div>

            {/* Photo & QR Code */}
            <div className="relative group shrink-0">
              <img
                src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={student.fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover ring-4 ring-amber-500/30 shadow-xl border border-amber-500/40"
              />
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full shadow-md">
                {student.deaconRank}
              </span>
            </div>

            {/* Main Info */}
            <div className="text-center sm:text-right space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
                  {student.fullName}
                </h2>
                <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  {student.studentCode}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  الطالب: {student.phone || 'غير مسجل'}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-sky-400" />
                  ولي الأمر: {student.guardianPhone || 'غير مسجل'}
                </span>
                <span className="text-amber-300 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                  بالخدمة: {student.level} ({student.year})
                </span>
                {(student.schoolLevel || student.schoolYear) && (
                  <span className="text-sky-300 font-bold bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-500/20">
                    المدرسة: {student.schoolLevel || ''} - {student.schoolYear || ''}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 no-print">
              {(onLogout || session.mode === 'student') && (
                <button
                  onClick={onLogout || onClose}
                  className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                  title="تسجيل الخروج من الحساب"
                >
                  <LogOut className="w-4 h-4" />
                  تسجيل الخروج
                </button>
              )}

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/40 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                title="طباعة التقرير التراكمي الشامل للطالب"
              >
                <Printer className="w-4 h-4" />
                طباعة التقرير
              </button>

              <button
                onClick={() => onGenerateIDCard(student)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <QrCode className="w-4 h-4" />
                بطاقة الهوية الذكية
              </button>

              {session.role === 'admin' && onTriggerPromotion && (
                <button
                  onClick={() => onTriggerPromotion(student)}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                >
                  <TrendingUp className="w-4 h-4" />
                  اعتماد والترفيع
                </button>
              )}
            </div>
          </div>
        </div>

        {/* DYNAMIC LEVEL / YEAR STAGE STEPPER SELECTOR */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2 min-w-max">
            {getAcademicLevels().map((levelName, lIdx, lArr) => (
              <div key={levelName} className="flex items-center gap-1">
                <span className="text-xs font-bold text-amber-400/90 pl-1">
                  {levelName}:
                </span>
                {getAcademicYears().map((yearName, yIdx) => {
                  const isSelected = selectedLevelIdx === lIdx && selectedYearIdx === yIdx;
                  const isCurrentActive = student.levelIndex === lIdx && student.yearIndex === yIdx;
                  const isPast =
                    lIdx < student.levelIndex || (lIdx === student.levelIndex && yIdx < student.yearIndex);

                  return (
                    <button
                      key={`step-${lIdx}-${yIdx}`}
                      onClick={() => {
                        setSelectedLevelIdx(lIdx);
                        setSelectedYearIdx(yIdx);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/50 shadow-md'
                          : isCurrentActive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : isPast
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-900/60 text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      <span>س{yIdx + 1}</span>
                      {isCurrentActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                      {!isPast && !isCurrentActive && <Lock className="w-3 h-3 opacity-60" />}
                    </button>
                  );
                })}
                {lIdx < lArr.length - 1 && <div className="h-4 w-px bg-slate-800 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        {/* MAIN DISPLAY CONTENT */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* LOCKED / ARCHIVED BANNER WARNING */}
          {isFutureLockedStage ? (
            <div className="p-12 text-center bg-slate-950/80 border border-slate-800/80 rounded-3xl space-y-3 my-4">
              <Lock className="w-12 h-12 text-slate-600 mx-auto stroke-[1.5]" />
              <h3 className="text-lg font-bold text-slate-300">
                الطالب لم يتم السنوات/المستويات السابقة بعد
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                هذه المرحلة مستقبليّة ومغلقة تلقائياً حتى إتمام الطالب لمتطلبات المرحلة الحالية ({student.level} - {student.year}) والترفيع الرسمي.
              </p>
            </div>
          ) : (
            <>
              {isPastArchivedStage && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    سجلات هذه السنة مؤرشفة ومجمدة (Read-Only) لحماية التاريخ التراكمي للطالب.
                  </span>
                </div>
              )}

              {/* 4 INTERACTIVE TABS */}
              <div className="flex border-b border-slate-800 gap-2">
                <button
                  onClick={() => setActiveTab('liturgies')}
                  className={`py-2.5 px-4 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-2 border-b-2 ${
                    activeTab === 'liturgies'
                      ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Church className="w-4 h-4" />
                  سجل القداسات ({liturgyLogs.length})
                </button>

                <button
                  onClick={() => setActiveTab('lectures')}
                  className={`py-2.5 px-4 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-2 border-b-2 ${
                    activeTab === 'lectures'
                      ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  سجل المحاضرات والتقييم الـ 5 نجوم ({lectureLogs.length})
                </button>

                <button
                  onClick={() => setActiveTab('grades')}
                  className={`py-2.5 px-4 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-2 border-b-2 ${
                    activeTab === 'grades'
                      ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  النتائج الأكاديمية والامتحانات
                </button>

                <button
                  onClick={() => setActiveTab('behavior')}
                  className={`py-2.5 px-4 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-2 border-b-2 ${
                    activeTab === 'behavior'
                      ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  السلوك وملاحظات الخدام ({behaviorNotes.length})
                </button>

                <button
                  onClick={() => setActiveTab('curricula')}
                  className={`py-2.5 px-4 rounded-t-2xl font-bold text-xs transition-all flex items-center gap-2 border-b-2 ${
                    activeTab === 'curricula'
                      ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  مناهج وألحان المرحلة
                </button>
              </div>

              {/* TAB 1: LITURGIES LOG */}
              {activeTab === 'liturgies' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block">إجمالي عدد القداسات المعتمدة:</span>
                      <span className="text-xl font-bold font-mono text-amber-300">
                        {liturgyLogs.length} قداس إلهي
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 rounded-full font-bold">
                      نسبة الحضور والتواجد: %100
                    </span>
                  </div>

                  {liturgyLogs.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 text-xs">
                      لا يوجد حضور مسجل بالقداسات لهذا المرحلة بعد.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-800/80">
                      {liturgyLogs.map((lit) => (
                        <div
                          key={lit.id}
                          className="py-3 flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                              <Church className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block font-bold text-slate-200">
                                قداس الأحد الإلهي
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                التاريخ: {lit.dateStr} | بواسطة الخادم: {lit.recordedByName}
                              </span>
                            </div>
                          </div>

                          <span className="font-mono text-amber-400 font-bold bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                            {lit.timeStr}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LECTURES LOG WITH 5-STAR RATING */}
              {activeTab === 'lectures' && (
                <div className="space-y-4 animate-fade-in">
                  {lectureLogs.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 text-xs">
                      لا يوجد سجل محاضرات مسجّل للطالب في هذه المرحلة.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {lectureLogs.map((lec) => (
                        <div
                          key={lec.id}
                          className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div>
                            <h5 className="font-bold text-slate-100 text-sm mb-1 flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-amber-400" />
                              {lec.lectureTitle || 'محاضرة طقس وألحان'}
                            </h5>
                            <span className="text-xs font-bold text-slate-200 block">
                              حالة الحضور: {lec.status === 'committed' ? '🟢 حاضر ملتزم' : lec.status === 'late' ? `🟡 متأخر (${lec.lateMinutes}د)` : '🔴 غائب'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              تاريخ التسجيل: {lec.dateStr}
                            </span>
                            {lec.evaluationNote && (
                              <div className="mt-2 p-2 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-amber-300/90 flex items-start gap-1.5">
                                <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>ملاحظة تقييم المحاضر: {lec.evaluationNote}</span>
                              </div>
                            )}
                          </div>

                          {/* 5-Star Rating Control */}
                          {lec.status === 'absent' ? (
                            <div className="text-right shrink-0">
                              <span className="text-xs text-rose-400 font-medium bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/20 inline-block">
                                لا يوجد تقييم (طالب غائب)
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center justify-end gap-1">
                                {lec.isEvaluationLocked && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                    <Lock className="w-3 h-3 text-emerald-400" />
                                    معتمد ومقفول
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400 block text-right">
                                  تقييم المحاضر ({lec.rating || 0}/5 نجوم):
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    disabled={!canSetRating || lec.isEvaluationLocked}
                                    onClick={() => handleStarRatingChange(lec.id, star === lec.rating ? 0 : star)}
                                    className={`p-1 transition-transform ${
                                      canSetRating && !lec.isEvaluationLocked ? 'hover:scale-125 cursor-pointer' : 'cursor-default opacity-80'
                                    }`}
                                    title={lec.isEvaluationLocked ? 'تم قفل التقييم واعتتماده من المحاضر ولا يمكن تعديله' : ''}
                                  >
                                    <Star
                                      className={`w-5 h-5 ${
                                        star <= (lec.rating || 0)
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-slate-700'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ACADEMIC RESULTS */}
              {activeTab === 'grades' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Servant/Admin Quick Grade Add Button & Form */}
                  {canManageGrades && (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-200">
                          رصد نتيجة دراسية / اختبار لهذا الشماس:
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddGradeForm(!showAddGradeForm)}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-all"
                        >
                          {showAddGradeForm ? 'إلغاء' : '+ رصد نتيجة جديدة'}
                        </button>
                      </div>

                      {showAddGradeForm && (
                        <form onSubmit={handleSaveGradeSubmit} className="space-y-3 pt-3 border-t border-slate-800/80">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">المادة الدراسية:</label>
                              <select
                                value={newGradeSubject}
                                onChange={(e) => setNewGradeSubject(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                              >
                                {DEFAULT_SUBJECTS.map((s, idx) => (
                                  <option key={idx} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">نوع الاختبار:</label>
                              <select
                                value={newGradeExamType}
                                onChange={(e) => setNewGradeExamType(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                              >
                                {EXAM_TYPES.map((t, idx) => (
                                  <option key={idx} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">الدرجة المحققة:</label>
                              <input
                                type="number"
                                min="0"
                                max={newGradeMaxScore}
                                value={newGradeScore}
                                onChange={(e) => setNewGradeScore(e.target.value === '' ? '' : Number(e.target.value))}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none"
                                required
                              />
                            </div>

                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">الدرجة العظمى:</label>
                              <input
                                type="number"
                                min="1"
                                value={newGradeMaxScore}
                                onChange={(e) => setNewGradeMaxScore(Number(e.target.value) || 100)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <input
                              type="text"
                              value={newGradeNotes}
                              onChange={(e) => setNewGradeNotes(e.target.value)}
                              placeholder="ملاحظات الممتحن (اختياري)..."
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-amber-500/20"
                            >
                              حفظ النتيجة واعتمادها
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Results List */}
                  {subjectResults.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                      لم يتم رصد نتائج دراسية لهذا الطالب بعد.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {subjectResults.map((res) => {
                        const est = calculateGradeEstimate(res.score, res.maxScore);
                        return (
                          <div
                            key={res.id}
                            className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 relative overflow-hidden"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-slate-100 text-xs block">
                                  {res.subjectName}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-slate-400">
                                    {res.examType || 'امتحان'}
                                  </span>
                                  <span className="text-slate-600 text-[10px]">•</span>
                                  <span className="text-[10px] text-emerald-400 font-bold">
                                    {res.isApproved ? 'معتمدة' : 'مؤقتة'}
                                  </span>
                                </div>
                              </div>

                              <div className="text-left font-mono">
                                <span className="text-lg font-black text-amber-400">
                                  {res.score} <span className="text-xs text-slate-500">/ {res.maxScore}</span>
                                </span>
                                <div className="text-[10px] text-right mt-0.5">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${est.badgeBg}`}>
                                    {est.estimate}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Score progress bar */}
                            <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all"
                                style={{ width: `${est.percentage}%` }}
                              />
                            </div>

                            {res.notes && (
                              <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                                💬 {res.notes}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: BEHAVIOR & NOTES */}
              {activeTab === 'behavior' && (
                <div className="space-y-4 animate-fade-in">
                  {canWriteNote && (
                    <form onSubmit={handleAddNoteSubmit} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                      <span className="text-xs font-bold text-slate-200 block">
                        إضافة ملاحظة سلوكية أو تقييم خادم:
                      </span>
                      <div className="flex gap-2">
                        <select
                          value={newNoteCategory}
                          onChange={(e) =>
                            setNewNoteCategory(e.target.value as 'إيجابي' | 'تنبيه' | 'ملاحظة عامة')
                          }
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="إيجابي">🟢 إيجابي</option>
                          <option value="تنبيه">🔴 تنبيه</option>
                          <option value="ملاحظة عامة">⚪ ملاحظة عامة</option>
                        </select>
                        <input
                          type="text"
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          placeholder="اكتب الملاحظة هنا..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all"
                        >
                          إضافة
                        </button>
                      </div>
                    </form>
                  )}

                  {behaviorNotes.length === 0 ? (
                    <p className="text-center py-6 text-slate-500 text-xs">
                      لا توجد ملاحظات سلوكية مدونة لهذه المرحلة.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {behaviorNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                note.category === 'إيجابي'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : note.category === 'تنبيه'
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {note.category}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              بواسطة: {note.authorName}
                            </span>
                          </div>
                          <p className="text-slate-200 leading-relaxed pt-1">{note.noteText}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: CURRICULA & HYMNS FOR THIS STAGE */}
              {activeTab === 'curricula' && (
                <div className="pt-2 animate-fade-in">
                  <CurriculaModule
                    session={session}
                    studentLevel={ACADEMIC_LEVELS[selectedLevelIdx] || student.level}
                    studentYear={ACADEMIC_YEARS[selectedYearIdx] || student.year}
                    isStudentPortal={session.mode === 'student'}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
