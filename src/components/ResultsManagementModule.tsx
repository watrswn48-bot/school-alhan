import React, { useState, useMemo } from 'react';
import {
  Student,
  AcademicSubjectResult,
  UserSession,
} from '../types';
import {
  getStudents,
  getSubjectResults,
  saveSubjectResult,
  saveBatchSubjectResults,
  deleteSubjectResult,
  approveAllSubjectResults,
  calculateGradeEstimate,
  getAcademicLevels,
  getAcademicYears,
  DEFAULT_SUBJECTS,
  EXAM_TYPES,
  getSchoolLogo,
} from '../services/storage';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Download,
  Filter,
  GraduationCap,
  Plus,
  Printer,
  Save,
  Search,
  Trash2,
  Users,
  Check,
  Percent,
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';

interface ResultsManagementModuleProps {
  session: UserSession;
}

export const ResultsManagementModule: React.FC<ResultsManagementModuleProps> = ({ session }) => {
  // Academic Structure
  const levels = getAcademicLevels();
  const years = getAcademicYears();

  // Filters & State
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(0);
  const [selectedYearIdx, setSelectedYearIdx] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<string>(DEFAULT_SUBJECTS[0]);
  const [customSubjectInput, setCustomSubjectInput] = useState<string>('');
  const [isCustomSubject, setIsCustomSubject] = useState<boolean>(false);
  const [selectedExamType, setSelectedExamType] = useState<string>(EXAM_TYPES[0]);
  const [selectedTerm, setSelectedTerm] = useState<string>('سنوي');
  const [maxScore, setMaxScore] = useState<number>(100);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'graded' | 'ungraded' | 'excellent' | 'needs_practice'>('all');
  const [activeViewMode, setActiveViewMode] = useState<'roster_entry' | 'summary_matrix'>('roster_entry');

  // Local Edits Cache: studentId -> { score: number, notes: string, isApproved: boolean }
  const [editedGrades, setEditedGrades] = useState<Record<string, { score: number | ''; notes: string; isApproved: boolean }>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Data
  const allStudents = useMemo(() => getStudents(false), []);
  const allResults = useMemo(() => getSubjectResults(), [notification]);

  // Current Class Students
  const classStudents = useMemo(() => {
    return allStudents.filter(
      (s) => s.levelIndex === selectedLevelIdx && s.yearIndex === selectedYearIdx
    );
  }, [allStudents, selectedLevelIdx, selectedYearIdx]);

  // Active Subject Name
  const currentSubjectName = isCustomSubject && customSubjectInput.trim() ? customSubjectInput.trim() : selectedSubject;

  // Map of existing results for the current Class + Subject + ExamType
  const existingResultsMap = useMemo(() => {
    const map = new Map<string, AcademicSubjectResult>();
    allResults.forEach((r) => {
      if (
        r.levelIndex === selectedLevelIdx &&
        r.yearIndex === selectedYearIdx &&
        r.subjectName === currentSubjectName &&
        (!r.examType || r.examType === selectedExamType)
      ) {
        map.set(r.studentId, r);
      }
    });
    return map;
  }, [allResults, selectedLevelIdx, selectedYearIdx, currentSubjectName, selectedExamType]);

  // Filtered Students for table
  const displayedStudents = useMemo(() => {
    return classStudents.filter((student) => {
      const matchesSearch =
        student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.deaconRank.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const res = existingResultsMap.get(student.id);
      const inDraft = editedGrades[student.id];
      const hasGrade = (res !== undefined && res.score !== undefined) || (inDraft !== undefined && inDraft.score !== '');

      const currentScore = inDraft && inDraft.score !== '' ? Number(inDraft.score) : res?.score ?? 0;
      const pct = (currentScore / maxScore) * 100;

      if (statusFilter === 'graded') return hasGrade;
      if (statusFilter === 'ungraded') return !hasGrade;
      if (statusFilter === 'excellent') return hasGrade && pct >= 85;
      if (statusFilter === 'needs_practice') return hasGrade && pct < 60;

      return true;
    });
  }, [classStudents, searchQuery, statusFilter, existingResultsMap, editedGrades, maxScore]);

  // Statistics for Current Exam
  const examStats = useMemo(() => {
    const gradedList: number[] = [];
    let passedCount = 0;
    let excellentCount = 0;
    let highestScore = 0;
    let highestStudentName = '—';

    classStudents.forEach((s) => {
      const res = existingResultsMap.get(s.id);
      const inDraft = editedGrades[s.id];
      let score: number | null = null;

      if (inDraft && inDraft.score !== '') {
        score = Number(inDraft.score);
      } else if (res) {
        score = res.score;
      }

      if (score !== null) {
        gradedList.push(score);
        const pct = (score / maxScore) * 100;
        if (pct >= 50) passedCount++;
        if (pct >= 85) excellentCount++;
        if (score > highestScore) {
          highestScore = score;
          highestStudentName = s.fullName;
        }
      }
    });

    const totalGraded = gradedList.length;
    const avgScore = totalGraded > 0 ? Math.round(gradedList.reduce((a, b) => a + b, 0) / totalGraded) : 0;
    const passRate = totalGraded > 0 ? Math.round((passedCount / totalGraded) * 100) : 0;

    return {
      totalStudents: classStudents.length,
      totalGraded,
      remaining: classStudents.length - totalGraded,
      avgScore,
      passRate,
      excellentCount,
      highestScore,
      highestStudentName,
    };
  }, [classStudents, existingResultsMap, editedGrades, maxScore]);

  // Handlers
  const handleScoreChange = (studentId: string, value: string) => {
    const num = value === '' ? '' : Math.max(0, Math.min(maxScore, Number(value)));
    setEditedGrades((prev) => ({
      ...prev,
      [studentId]: {
        score: num,
        notes: prev[studentId]?.notes ?? existingResultsMap.get(studentId)?.notes ?? '',
        isApproved: prev[studentId]?.isApproved ?? existingResultsMap.get(studentId)?.isApproved ?? true,
      },
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setEditedGrades((prev) => ({
      ...prev,
      [studentId]: {
        score: prev[studentId]?.score ?? existingResultsMap.get(studentId)?.score ?? '',
        notes,
        isApproved: prev[studentId]?.isApproved ?? existingResultsMap.get(studentId)?.isApproved ?? true,
      },
    }));
  };

  const handleQuickGrade = (studentId: string, score: number) => {
    handleScoreChange(studentId, String(score));
  };

  const handleSaveSingle = (student: Student) => {
    const draft = editedGrades[student.id];
    const existing = existingResultsMap.get(student.id);

    const scoreToSave = draft && draft.score !== '' ? Number(draft.score) : existing?.score;
    if (scoreToSave === undefined) {
      setNotification({ type: 'error', message: `يرجى إدخال درجة للطالب ${student.fullName}` });
      return;
    }

    const payload: Partial<AcademicSubjectResult> = {
      id: existing?.id,
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: student.fullName,
      levelIndex: selectedLevelIdx,
      yearIndex: selectedYearIdx,
      levelName: levels[selectedLevelIdx],
      yearName: years[selectedYearIdx],
      subjectName: currentSubjectName,
      examType: selectedExamType,
      term: selectedTerm,
      score: scoreToSave,
      maxScore: maxScore,
      notes: draft?.notes !== undefined ? draft.notes : existing?.notes || '',
      isApproved: draft?.isApproved !== undefined ? draft.isApproved : existing?.isApproved ?? true,
      updatedBy: session.fullName || 'الخادم المسؤول',
    };

    saveSubjectResult(payload);

    // Clear draft for this student
    setEditedGrades((prev) => {
      const copy = { ...prev };
      delete copy[student.id];
      return copy;
    });

    setNotification({ type: 'success', message: `تم حفظ نتيجة ${student.fullName} بنجاح (${scoreToSave} / ${maxScore})` });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveAllDrafts = () => {
    const studentIdsWithDrafts = Object.keys(editedGrades);
    if (studentIdsWithDrafts.length === 0) {
      setNotification({ type: 'info', message: 'لا توجد مسودات أو درجات جديدة بانتظار الحفظ.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const batch: Partial<AcademicSubjectResult>[] = [];
    studentIdsWithDrafts.forEach((stuId) => {
      const draft = editedGrades[stuId];
      if (draft && draft.score !== '') {
        const student = allStudents.find((s) => s.id === stuId);
        if (student) {
          const existing = existingResultsMap.get(stuId);
          batch.push({
            id: existing?.id,
            studentId: student.id,
            studentCode: student.studentCode,
            studentName: student.fullName,
            levelIndex: selectedLevelIdx,
            yearIndex: selectedYearIdx,
            levelName: levels[selectedLevelIdx],
            yearName: years[selectedYearIdx],
            subjectName: currentSubjectName,
            examType: selectedExamType,
            term: selectedTerm,
            score: Number(draft.score),
            maxScore: maxScore,
            notes: draft.notes || existing?.notes || '',
            isApproved: draft.isApproved,
            updatedBy: session.fullName || 'الخادم المسؤول',
          });
        }
      }
    });

    if (batch.length === 0) {
      setNotification({ type: 'info', message: 'لم يتم العثور على درجات مكتملة للحفظ' });
      return;
    }

    saveBatchSubjectResults(batch);
    setEditedGrades({});
    setNotification({
      type: 'success',
      message: `تم حفظ واعتماد ${batch.length} درجات بنجاح في سجلات الشمامسة ومزامنتها سحابياً!`,
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteResult = (resId: string, studentName: string) => {
    if (confirm(`هل أنت متأكد من حذف نتيجة الطالب ${studentName}؟`)) {
      deleteSubjectResult(resId);
      setNotification({ type: 'info', message: `تم حذف نتيجة الطالب ${studentName}` });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleApproveAll = () => {
    const res = approveAllSubjectResults(selectedLevelIdx, selectedYearIdx, currentSubjectName);
    setNotification({
      type: 'success',
      message: `تم اعتماد ${res.count} نتيجة دراسية رسمياً بنجاح!`,
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleFillAllFullMark = () => {
    if (confirm(`هل تريد تعيين الدرجة النهائية (${maxScore}) لكافة طلاب هذا الفصل؟`)) {
      const updates: Record<string, { score: number; notes: string; isApproved: boolean }> = {};
      classStudents.forEach((s) => {
        updates[s.id] = {
          score: maxScore,
          notes: 'حفظ وأداء ممتاز',
          isApproved: true,
        };
      });
      setEditedGrades((prev) => ({ ...prev, ...updates }));
      setNotification({ type: 'info', message: 'تم تعيين الدرجة الكاملة في مسودات الطلاب. اضغط "حفظ كافة الدرجات" للتأكيد.' });
    }
  };

  const handleExportCSV = () => {
    const headers = ['كود الطالب', 'اسم الشماس', 'الرتبة', 'المستوى', 'السنة', 'المادة', 'نوع الامتحان', 'الدرجة', 'الدرجة العظمى', 'النسبة المئوية', 'التقدير', 'الملاحظات'];
    const rows = classStudents.map((s) => {
      const res = existingResultsMap.get(s.id);
      const inDraft = editedGrades[s.id];
      const score = inDraft && inDraft.score !== '' ? Number(inDraft.score) : res?.score ?? '';
      const pct = typeof score === 'number' ? `${Math.round((score / maxScore) * 100)}%` : '';
      const est = typeof score === 'number' ? calculateGradeEstimate(score, maxScore).estimate : 'لم يرصد';
      const notes = inDraft?.notes || res?.notes || '';

      return [
        `"${s.studentCode}"`,
        `"${s.fullName}"`,
        `"${s.deaconRank}"`,
        `"${levels[selectedLevelIdx] || ''}"`,
        `"${years[selectedYearIdx] || ''}"`,
        `"${currentSubjectName}"`,
        `"${selectedExamType}"`,
        score,
        maxScore,
        `"${pct}"`,
        `"${est}"`,
        `"${notes}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `كشف_درجات_${currentSubjectName}_${levels[selectedLevelIdx]}_${years[selectedYearIdx]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0">
      {/* MODULE HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-100">
                  الخانة 6: رصد وإدخال نتائج الامتحانات
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  مزامنة سحابية معتمدة
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                رصد درجات الألحان، القبطي، والطقس، وإصدار التقديرات وكشوف الدرجات المعتمدة لخورس الشمامسة
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              title="طباعة كشف رصد درجات معتمد للدفعة"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الكشف</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              title="تصدير كشف إكسيل CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير Excel</span>
            </button>

            <button
              onClick={handleApproveAll}
              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              title="اعتماد كافة نتائج المادة المحددة"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>اعتماد الكل</span>
            </button>

            {Object.keys(editedGrades).length > 0 && (
              <button
                onClick={handleSaveAllDrafts}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-500/25 animate-pulse"
              >
                <Save className="w-4 h-4" />
                <span>حفظ المسودات ({Object.keys(editedGrades).length})</span>
              </button>
            )}
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {notification && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : notification.type === 'error'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[11px] text-slate-400 block mb-1">الطلاب المرصود لهم</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-amber-400">{examStats.totalGraded}</span>
              <span className="text-xs text-slate-500">من أصل {examStats.totalStudents}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{
                  width: `${examStats.totalStudents > 0 ? (examStats.totalGraded / examStats.totalStudents) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[11px] text-slate-400 block mb-1">نسبة النجاح (≥ 50%)</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-400">{examStats.passRate}%</span>
              <Percent className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              المتفوقون: {examStats.excellentCount} طالب
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[11px] text-slate-400 block mb-1">متوسط درجات الفصل</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-teal-400">{examStats.avgScore}</span>
              <span className="text-xs text-slate-500">/ {maxScore}</span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-1">
              التقدير العام: {calculateGradeEstimate(examStats.avgScore, maxScore).estimate}
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
            <span className="text-[11px] text-slate-400 block mb-1">أعلى درجة مرصودة</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-amber-300">{examStats.highestScore}</span>
              <span className="text-xs text-slate-500">/ {maxScore}</span>
            </div>
            <span className="text-[10px] text-amber-400 font-medium truncate block mt-1" title={examStats.highestStudentName}>
              الأول: {examStats.highestStudentName}
            </span>
          </div>
        </div>
      </div>

      {/* FILTER & CONFIGURATION CONTROL BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">تحديد الفصل والمقرر الدراسي للاختبار:</span>
          </div>

          {/* View Mode Switch */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveViewMode('roster_entry')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeViewMode === 'roster_entry'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>رصد درجات الفصل</span>
            </button>
            <button
              onClick={() => setActiveViewMode('summary_matrix')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeViewMode === 'summary_matrix'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>كشف درجات مجمع</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Level Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1.5">المستوى الأكاديمي:</label>
            <select
              value={selectedLevelIdx}
              onChange={(e) => {
                setSelectedLevelIdx(Number(e.target.value));
                setEditedGrades({});
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {levels.map((lvl, idx) => (
                <option key={idx} value={idx}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Year Selector */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1.5">السنة / الفرقة الدراسية:</label>
            <select
              value={selectedYearIdx}
              onChange={(e) => {
                setSelectedYearIdx(Number(e.target.value));
                setEditedGrades({});
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
            >
              {years.map((yr, idx) => (
                <option key={idx} value={idx}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-slate-400">المادة / المقرر:</label>
              <button
                type="button"
                onClick={() => setIsCustomSubject(!isCustomSubject)}
                className="text-[10px] text-amber-400 hover:underline"
              >
                {isCustomSubject ? 'اختر من القائمة' : '+ مادة مخصصة'}
              </button>
            </div>
            {isCustomSubject ? (
              <input
                type="text"
                value={customSubjectInput}
                onChange={(e) => setCustomSubjectInput(e.target.value)}
                placeholder="اكتب اسم المادة..."
                className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
              />
            ) : (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {DEFAULT_SUBJECTS.map((subj, idx) => (
                  <option key={idx} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Exam Type & Max Score */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5">نوع الاختبار:</label>
              <select
                value={selectedExamType}
                onChange={(e) => setSelectedExamType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {EXAM_TYPES.map((type, idx) => (
                  <option key={idx} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1.5">الدرجة العظمى:</label>
              <input
                type="number"
                min="1"
                max="500"
                value={maxScore}
                onChange={(e) => setMaxScore(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500 text-center font-mono"
              />
            </div>
          </div>
        </div>

        {/* Secondary Filter & Search Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الكود أو الرتبة..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold shrink-0">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                الكل ({classStudents.length})
              </button>
              <button
                onClick={() => setStatusFilter('graded')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'graded' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                مرصود ({examStats.totalGraded})
              </button>
              <button
                onClick={() => setStatusFilter('ungraded')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'ungraded' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                متبقي ({examStats.remaining})
              </button>
              <button
                onClick={() => setStatusFilter('excellent')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  statusFilter === 'excellent' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ممتاز ({examStats.excellentCount})
              </button>
            </div>

            <button
              onClick={handleFillAllFullMark}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold border border-slate-700 transition-all shrink-0"
              title="تعيين الدرجة الكاملة للجميع في المسودة"
            >
              الدرجة الكاملة للجميع
            </button>
          </div>
        </div>
      </div>

      {/* PRINT HEADER (visible only during print) */}
      <div className="hidden print:block mb-6 text-center border-b-2 border-slate-950 pb-4">
        <div className="flex items-center justify-center gap-4 mb-2">
          <img
            src={getSchoolLogo()}
            alt="شعار مدرسة الشمامسة"
            className="w-16 h-16 rounded-full object-cover border-2 border-amber-600 shadow-sm"
            referrerPolicy="no-referrer"
          />
          <div className="text-right">
            <h1 className="text-2xl font-black text-slate-900">أكاديمية ومدرسة الشماس</h1>
            <h2 className="text-sm font-bold text-slate-700">كشف رصد درجات وتقييمات الشمامسة المعتمد</h2>
          </div>
        </div>
        <div className="flex justify-center gap-6 text-xs text-slate-800 mt-2 font-bold">
          <span>المستوى: {levels[selectedLevelIdx]}</span>
          <span>السنة: {years[selectedYearIdx]}</span>
          <span>المادة: {currentSubjectName}</span>
          <span>نوع الاختبار: {selectedExamType}</span>
          <span>الدرجة العظمى: {maxScore}</span>
        </div>
      </div>

      {/* ROSTER GRADING TABLE */}
      {activeViewMode === 'roster_entry' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {displayedStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p className="font-bold text-slate-300">لا يوجد طلاب مطابقين للبحث أو الفلتر في هذا الفصل.</p>
              <p className="text-xs text-slate-500">تأكد من اختيار المستوى والفرقة الصحيحة أو إزالة شروط البحث.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs font-bold border-b border-slate-800">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4">كود وبيانات الشماس</th>
                    <th className="py-3.5 px-4">الرتبة الكنسية</th>
                    <th className="py-3.5 px-4 text-center w-40">الدرجة المرصودة (/ {maxScore})</th>
                    <th className="py-3.5 px-4 text-center w-36">النسبة والتقدير</th>
                    <th className="py-3.5 px-4 min-w-[200px]">ملاحظات الممتحن / التقييم</th>
                    <th className="py-3.5 px-4 text-center w-28 print:hidden">حالة الاعتماد</th>
                    <th className="py-3.5 px-4 text-center w-28 print:hidden">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {displayedStudents.map((student, idx) => {
                    const existingRes = existingResultsMap.get(student.id);
                    const draft = editedGrades[student.id];
                    const isDraft = draft !== undefined;

                    const activeScoreVal = draft ? draft.score : existingRes ? existingRes.score : '';
                    const activeNotes = draft ? draft.notes : existingRes ? existingRes.notes || '' : '';
                    const isApproved = draft ? draft.isApproved : existingRes ? existingRes.isApproved : true;

                    const hasRecordedScore = activeScoreVal !== '';
                    const numScore = hasRecordedScore ? Number(activeScoreVal) : 0;
                    const estimate = hasRecordedScore
                      ? calculateGradeEstimate(numScore, maxScore)
                      : { percentage: 0, estimate: 'لم ترصد', color: 'text-slate-500', badgeBg: 'bg-slate-800 text-slate-400' };

                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors ${
                          isDraft
                            ? 'bg-amber-500/5 hover:bg-amber-500/10'
                            : hasRecordedScore
                            ? 'hover:bg-slate-800/40'
                            : 'bg-slate-950/40 hover:bg-slate-800/30'
                        }`}
                      >
                        {/* Index */}
                        <td className="py-3 px-4 text-center font-mono text-slate-500 text-xs">
                          {idx + 1}
                        </td>

                        {/* Student Name & Code */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={student.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <span className="font-bold text-slate-100 block text-xs">
                                {student.fullName}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block">
                                {student.studentCode}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Deacon Rank */}
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700/80 inline-block">
                            {student.deaconRank}
                          </span>
                        </td>

                        {/* Score Input & Fast Buttons */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              max={maxScore}
                              value={activeScoreVal}
                              onChange={(e) => handleScoreChange(student.id, e.target.value)}
                              placeholder="—"
                              className={`w-16 py-1.5 px-2 rounded-xl text-center font-black font-mono text-sm border focus:outline-none transition-all ${
                                isDraft
                                  ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-inner'
                                  : hasRecordedScore
                                  ? 'bg-slate-950 border-slate-700 text-slate-100'
                                  : 'bg-slate-950 border-dashed border-slate-700 text-slate-400 focus:border-amber-500'
                              }`}
                            />

                            {/* Quick Presets for fast entry */}
                            <div className="flex flex-col gap-0.5 print:hidden">
                              <button
                                type="button"
                                onClick={() => handleQuickGrade(student.id, maxScore)}
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                                title="الدرجة الكاملة"
                              >
                                {maxScore}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickGrade(student.id, Math.round(maxScore * 0.85))}
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
                                title="85% ممتاز"
                              >
                                {Math.round(maxScore * 0.85)}
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Percentage & Estimate */}
                        <td className="py-3 px-4 text-center">
                          {hasRecordedScore ? (
                            <div className="space-y-1">
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${estimate.badgeBg}`}>
                                {estimate.estimate}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 block">
                                {estimate.percentage}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">بانتظار الرصد</span>
                          )}
                        </td>

                        {/* Notes / Feedback */}
                        <td className="py-3 px-4">
                          <input
                            type="text"
                            value={activeNotes}
                            onChange={(e) => handleNotesChange(student.id, e.target.value)}
                            placeholder="ملاحظات الحفظ، النطق، الترديد..."
                            className="w-full bg-slate-950/70 border border-slate-800 focus:border-slate-600 rounded-xl px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none"
                          />
                        </td>

                        {/* Approval Status */}
                        <td className="py-3 px-4 text-center print:hidden">
                          {hasRecordedScore ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditedGrades((prev) => ({
                                  ...prev,
                                  [student.id]: {
                                    score: activeScoreVal,
                                    notes: activeNotes,
                                    isApproved: !isApproved,
                                  },
                                }));
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all inline-flex items-center gap-1 ${
                                isApproved
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                              title="اضغط للتبديل بين معتمد وقيد المراجعة"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isApproved ? 'معتمد' : 'مؤقت'}</span>
                            </button>
                          ) : (
                            <span className="text-slate-600 text-[10px]">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center print:hidden">
                          <div className="flex items-center justify-center gap-1">
                            {isDraft ? (
                              <button
                                onClick={() => handleSaveSingle(student)}
                                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-sm"
                                title="حفظ هذه النتيجة"
                              >
                                <Save className="w-3.5 h-3.5" />
                              </button>
                            ) : existingRes ? (
                              <button
                                onClick={() => handleDeleteResult(existingRes.id, student.fullName)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-all"
                                title="حذف النتيجة"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer with Batch Save bar */}
          {displayedStudents.length > 0 && (
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
              <div className="text-xs text-slate-400">
                إجمالي الطلاب في هذا الكشف: <strong className="text-slate-200">{displayedStudents.length}</strong> طالب
                {Object.keys(editedGrades).length > 0 && (
                  <span className="mr-3 text-amber-400 font-bold">
                    • يوجد {Object.keys(editedGrades).length} درجات غير محفوظة بالمسودة
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {Object.keys(editedGrades).length > 0 && (
                  <button
                    onClick={handleSaveAllDrafts}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>حفظ واعتماد كل المسودات ({Object.keys(editedGrades).length})</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* SUMMARY MATRIX VIEW: All Subjects for this class */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>كشف الدرجات المجمع لكافة المواد — {levels[selectedLevelIdx]} ({years[selectedYearIdx]})</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <th className="py-3 px-3 w-10 text-center">#</th>
                  <th className="py-3 px-3">اسم الشماس</th>
                  <th className="py-3 px-3">الرتبة</th>
                  {DEFAULT_SUBJECTS.map((subj, sIdx) => (
                    <th key={sIdx} className="py-3 px-2 text-center whitespace-nowrap">
                      {subj}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center bg-slate-950/80 font-black text-amber-400">
                    المجموع العام
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {classStudents.map((stu, idx) => {
                  const studentResults = allResults.filter(
                    (r) => r.studentId === stu.id && r.levelIndex === selectedLevelIdx && r.yearIndex === selectedYearIdx
                  );

                  let totalScore = 0;
                  let totalPossible = 0;

                  return (
                    <tr key={stu.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-200">
                        {stu.fullName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] text-amber-300 bg-slate-800 px-2 py-0.5 rounded-md">
                          {stu.deaconRank}
                        </span>
                      </td>

                      {DEFAULT_SUBJECTS.map((subj, sIdx) => {
                        const res = studentResults.find((r) => r.subjectName === subj);
                        if (res) {
                          totalScore += res.score;
                          totalPossible += res.maxScore;
                        }

                        return (
                          <td key={sIdx} className="py-2.5 px-2 text-center font-mono">
                            {res ? (
                              <span
                                className={`font-bold ${
                                  res.score >= res.maxScore * 0.85
                                    ? 'text-emerald-400'
                                    : res.score >= res.maxScore * 0.65
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                }`}
                              >
                                {res.score}
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-2.5 px-3 text-center font-mono font-black bg-slate-950/40">
                        {totalPossible > 0 ? (
                          <span className="text-amber-400">
                            {totalScore} <span className="text-[10px] text-slate-500">({Math.round((totalScore / totalPossible) * 100)}%)</span>
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINT SIGNATURE FOOTER */}
      <div className="hidden print:flex justify-between items-center mt-12 pt-8 border-t-2 border-slate-900 text-xs font-bold text-slate-800">
        <div>توقيع خادم المادة: .......................................</div>
        <div>توقيع أمين الخدمة: .......................................</div>
        <div>اعتماد راعي الكنيسة: .......................................</div>
      </div>
    </div>
  );
};
