/**
 * Class 1: Classes & Students (الفصول والطلاب)
 * إدارة الفصول والمراحل والطلاب مع سلة المحذوفات التفاعلية
 */

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Trash2,
  RotateCcw,
  Edit,
  Eye,
  QrCode,
  GraduationCap,
  Phone,
  X,
  FolderOpen,
  Grid,
  List,
  LayoutGrid,
  BookOpen,
  Layers,
  ChevronLeft,
  ShieldAlert,
  Download,
  Printer,
} from 'lucide-react';
import { Student, DeaconRank, AcademicLevel, AcademicYear, UserSession } from '../types';
import {
  getStudents,
  getDeletedStudents,
  saveStudent,
  softDeleteStudent,
  restoreStudent,
  permanentlyDeleteStudent,
  getAcademicLevels,
  getAcademicYears,
  DEACON_RANKS,
  SCHOOL_LEVELS,
  SCHOOL_YEARS,
} from '../services/storage';

interface ClassesAndStudentsProps {
  session: UserSession;
  onSelectStudentProfile: (student: Student) => void;
  onGenerateIDCard: (student: Student) => void;
}

type ViewMode = 'classes' | 'cards' | 'table';

const SCHOOL_CLASSES_FILTER = [
  'كيجي',
  'أولى وتانية',
  'تالتة ورابعة',
  'خامسة وسادسة',
  'إعدادي وثانوي',
] as const;

export const ClassesAndStudentsModule: React.FC<ClassesAndStudentsProps> = ({
  session,
  onSelectStudentProfile,
  onGenerateIDCard,
}) => {
  const [studentsList, setStudentsList] = useState<Student[]>(() => getStudents());
  const [deletedList, setDeletedList] = useState<Student[]>(() => getDeletedStudents());

  const [academicLevels, setAcademicLevels] = useState<string[]>(() => getAcademicLevels());
  const [academicYears, setAcademicYears] = useState<string[]>(() => getAcademicYears());

  // View mode state ('classes' = class folders grid, 'cards' = student cards, 'table' = table view)
  const [viewMode, setViewMode] = useState<ViewMode>('classes');

  // Filters
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedRank, setSelectedRank] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const canEdit =
    session.role === 'admin' || session.permissions?.canAddEditStudents;

  const refreshData = () => {
    setStudentsList(getStudents());
    setDeletedList(getDeletedStudents());
    setAcademicLevels(getAcademicLevels());
    setAcademicYears(getAcademicYears());
  };

  // Filtered Students
  const filteredStudents = studentsList.filter((s) => {
    if (selectedLevel !== 'ALL' && s.level !== selectedLevel) return false;
    if (selectedYear !== 'ALL' && s.year !== selectedYear) return false;
    if (selectedClass !== 'ALL' && s.schoolClass !== selectedClass) return false;
    if (selectedRank !== 'ALL' && s.deaconRank !== selectedRank) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        s.nationalId.includes(q) ||
        s.phone.includes(q) ||
        s.guardianPhone.includes(q)
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return;
    const headers = ['كود الطالب', 'الاسم بالكامل', 'الرتبة', 'مرحلة الخدمة', 'سنة الخدمة', 'المرحلة بالمدرسة', 'السنة بالمدرسة', 'هاتف الطالب', 'هاتف ولي الأمر', 'الرقم القومي'];
    const rows = filteredStudents.map((s) => [
      s.studentCode,
      `"${s.fullName.replace(/"/g, '""')}"`,
      s.deaconRank,
      s.level,
      s.year,
      s.schoolLevel || '-',
      s.schoolYear || '-',
      s.phone || '',
      s.guardianPhone || '',
      s.nationalId || '',
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `قائمة_الطلاب_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleOpenEdit = (stu: Student) => {
    setEditingStudent({ ...stu });
    setIsAddEditModalOpen(true);
  };

  const handleSaveStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent?.fullName) return;

    try {
      saveStudent(editingStudent);
      setIsAddEditModalOpen(false);
      setEditingStudent(null);
      refreshData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'تعذر حفظ الطالب. تأكد أن كود الطالب غير مستخدم.');
    }
  };

  const handleSoftDelete = (id: string) => {
    const student = studentsList.find((s) => s.id === id);
    const name = student?.fullName ? `"${student.fullName}"` : 'هذا الطالب';
    setConfirmModal({
      isOpen: true,
      title: 'نقل الطالب لسلة المحذوفات',
      message: `هل أنت متأكد من نقل الطالب ${name} إلى سلة المحذوفات؟ يمكنك استعادته لاحقاً في أي وقت.`,
      confirmText: 'نقل للمحذوفات',
      isDanger: true,
      onConfirm: () => {
        softDeleteStudent(id);
        refreshData();
      },
    });
  };

  const handleRestore = (id: string) => {
    restoreStudent(id);
    refreshData();
  };

  const handlePermanentDelete = (id: string) => {
    const student = deletedList.find((s) => s.id === id);
    const name = student?.fullName ? `"${student.fullName}"` : 'هذا الطالب';
    setConfirmModal({
      isOpen: true,
      title: 'حذف الطالب نهائياً',
      message: `⚠️ تحذير: هذا إجراء نهائي وسيتم حذف كافة بيانات وسجلات الطالب ${name} تماماً. هل أنت متأكد من الحذف النهائي؟`,
      confirmText: 'نعم، حذف نهائي',
      isDanger: true,
      onConfirm: () => {
        permanentlyDeleteStudent(id);
        refreshData();
      },
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Main Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              الفصول والسنوات الدراسية
            </h2>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold rounded-full">
              إجمالي الطلاب: {studentsList.length} طالب
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            عرض الفصول الدراسية، تصفح الطلاب حسب المراحل والسنوات، وإدارة القوائم والسجلات.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Controls */}
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setViewMode('classes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'classes'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض مجلدات الفصول الدراسية"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              عرض الفصول
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'cards'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض كروت الطلاب"
            >
              <Grid className="w-3.5 h-3.5" />
              بطاقات الطلاب
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض جدول البيانات"
            >
              <List className="w-3.5 h-3.5" />
              جدول التفاصيل
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="تصدير القائمة لملف Excel / CSV"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>تصدير Excel</span>
          </button>

          {/* Recycle Bin Button */}
          <button
            onClick={() => setIsRecycleBinOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 relative"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            سلة المحذوفات
            {deletedList.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-mono text-[10px] flex items-center justify-center">
                {deletedList.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Academic Level Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0 ml-1 flex items-center gap-1">
            <Layers className="w-4 h-4 text-amber-400" />
            المرحلة:
          </span>

          <button
            onClick={() => setSelectedLevel('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
              selectedLevel === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            جميع المراحل ({academicLevels.length})
          </button>

          {academicLevels.map((lvl) => {
            const count = studentsList.filter((s) => s.level === lvl).length;
            const isSelected = selectedLevel === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{lvl}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    isSelected ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Academic Year Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 border-t border-slate-800/80 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0 ml-1">
            السنة/الفصل:
          </span>

          <button
            onClick={() => setSelectedYear('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              selectedYear === 'ALL'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            جميع السنوات
          </button>

          {academicYears.map((yr) => {
            const isSelected = selectedYear === yr;
            return (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {yr}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، الكود، الهاتف، أو الرقم القومي..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Class + Deacon Rank Filters & Reset */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none appearance-none pr-8"
            >
              <option value="ALL">جميع الفصول</option>
              {SCHOOL_CLASSES_FILTER.map((schoolClass) => (
                <option key={schoolClass} value={schoolClass}>
                  {schoolClass}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedRank}
              onChange={(e) => setSelectedRank(e.target.value)}
              className="bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none appearance-none pr-8"
            >
              <option value="ALL">جميع الرتب الشماسية</option>
              {DEACON_RANKS.map((rnk) => (
                <option key={rnk} value={rnk}>
                  {rnk}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {(selectedLevel !== 'ALL' || selectedYear !== 'ALL' || selectedClass !== 'ALL' || selectedRank !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedLevel('ALL');
                setSelectedYear('ALL');
                setSelectedClass('ALL');
                setSelectedRank('ALL');
                setSearchQuery('');
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              إعادة الضبط
            </button>
          )}
        </div>
      </div>

      {/* Mode 1: Class Folders Grid (عرض الفصول) */}
      {viewMode === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-100">الفصول الدراسية</h3>
              <p className="text-[11px] text-slate-500 mt-1">
                {selectedYear === 'ALL'
                  ? 'اختر سنة من أعلى الصفحة لتصفية الفصول والطلاب حسب السنة.'
                  : `الفصول المعروضة لسنة ${selectedYear}`}
              </p>
            </div>
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-300 font-bold">
              {selectedLevel === 'ALL' ? 'كل المراحل' : selectedLevel}
              {' — '}
              {selectedYear === 'ALL' ? 'كل السنوات' : selectedYear}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {SCHOOL_CLASSES_FILTER
              .filter((schoolClass) => selectedClass === 'ALL' || selectedClass === schoolClass)
              .map((schoolClass) => {
                const classStudents = studentsList.filter((s) => {
                  if (s.schoolClass !== schoolClass) return false;
                  if (selectedLevel !== 'ALL' && s.level !== selectedLevel) return false;
                  if (selectedYear !== 'ALL' && s.year !== selectedYear) return false;
                  return true;
                });

                return (
                  <button
                    key={schoolClass}
                    onClick={() => {
                      setSelectedClass(schoolClass);
                      setViewMode('cards');
                    }}
                    className="text-right bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/70 rounded-3xl p-5 shadow-lg transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-amber-400 group-hover:border-amber-500/40">
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/20">
                        {classStudents.length} طالب
                      </span>
                    </div>

                    <h3 className="mt-4 text-base font-black text-slate-100 group-hover:text-amber-300 transition-colors">
                      {schoolClass}
                    </h3>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {selectedYear === 'ALL' ? 'كل السنوات' : selectedYear}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">
                        {selectedLevel === 'ALL' ? 'كل المراحل' : selectedLevel}
                      </span>
                      <span className="text-amber-400 font-bold">عرض الطلاب ←</span>
                    </div>
                  </button>
                );
              })}
          </div>

          {SCHOOL_CLASSES_FILTER.every((schoolClass) => {
            const hasStudents = studentsList.some((s) =>
              s.schoolClass === schoolClass &&
              (selectedLevel === 'ALL' || s.level === selectedLevel) &&
              (selectedYear === 'ALL' || s.year === selectedYear)
            );
            return !hasStudents;
          }) && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-500">
              <FolderOpen className="w-10 h-10 mx-auto text-slate-600 mb-3" />
              <p className="text-sm">لا يوجد طلاب في الفصول المطابقة للسنة والمرحلة المحددة.</p>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Student Cards Grid (عرض البطاقات) */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-300">
              النتائج المعروضة: ({filteredStudents.length}) طالب
            </span>
            <button
              onClick={() => setViewMode('table')}
              className="text-xs text-amber-400 hover:underline font-bold"
            >
              التحويل إلى عرض الجدول
            </button>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-3">
              <Users className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
              <p className="text-sm">لا يوجد طلاب مطابقون لمعايير التصفية والبحث المحددة.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg space-y-4 transition-all duration-300 flex flex-col justify-between group relative"
                >
                  <div>
                    {/* Top Header: Photo, Name, Code */}
                    <div className="flex items-start gap-3">
                      <img
                        src={s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={s.fullName}
                        className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-700 border border-slate-800 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="font-bold text-slate-100 text-sm truncate group-hover:text-amber-300 transition-colors">
                          {s.fullName}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold rounded-md">
                            {s.studentCode}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-semibold rounded-md">
                            {s.deaconRank}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Class & School Info */}
                    <div className="mt-4 p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span className="text-amber-400/90 font-semibold">بالخدمة:</span>
                        <span className="font-bold text-slate-100">{s.level} — {s.year}</span>
                      </div>
                      {(s.schoolLevel || s.schoolYear) && (
                        <div className="flex justify-between text-slate-300">
                          <span className="text-sky-400/90 font-semibold">المدرسة:</span>
                          <span className="text-slate-300 font-medium">{s.schoolLevel || ''} ({s.schoolYear || ''})</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-300 font-mono text-[11px] pt-1 border-t border-slate-900">
                        <span className="text-slate-500 font-semibold font-sans">الهاتف:</span>
                        <span>{s.phone || 'غير مسجل'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectStudentProfile(s)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1"
                      title="عرض الملف التراكمي الشامل"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      الملف التراكمي
                    </button>

                    <button
                      onClick={() => onGenerateIDCard(s)}
                      className="p-2 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 rounded-xl transition-all"
                      title="طباعة بطاقة الهوية الذكية"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                        title="تعديل بيانات الطالب"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}

                    {canEdit && (
                      <button
                        onClick={() => handleSoftDelete(s.id)}
                        className="p-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all"
                        title="حذف الطالب"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Table View (عرض الجدول) */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Users className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
              <p className="text-sm">لا يوجد طلاب مطابقون لمعايير البحث والتصفية المحددة.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">الطالب</th>
                    <th className="p-4">الكود / الرقم القومي</th>
                    <th className="p-4">الرتبة الشماسية</th>
                    <th className="p-4">مرحلة الخدمة وسنتها</th>
                    <th className="p-4">المرحلة بالمدرسة والسنة</th>
                    <th className="p-4">هاتف التواصل</th>
                    <th className="p-4 text-center">الإجراءات والبطاقات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* Student Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={s.fullName}
                            className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-700/80 border border-slate-800 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                            }}
                          />
                          <div>
                            <span className="block font-bold text-slate-100 text-sm group-hover:text-amber-300 transition-colors">
                              {s.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              تاريخ الرسامة: {s.ordinationDate || 'غير مسجل'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Code & National ID */}
                      <td className="p-4">
                        <span className="block font-mono font-bold text-amber-400">{s.studentCode}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{s.nationalId || '—'}</span>
                      </td>

                      {/* Rank Badge */}
                      <td className="p-4">
                        <span className="inline-block px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold text-[11px]">
                          {s.deaconRank}
                        </span>
                      </td>

                      {/* Deacon Level & Year */}
                      <td className="p-4">
                        <span className="block font-medium text-amber-300">{s.level}</span>
                        <span className="text-[10px] text-slate-400">{s.year}</span>
                      </td>

                      {/* School Level & Year */}
                      <td className="p-4">
                        <span className="block font-medium text-sky-300">{s.schoolLevel || 'غير مسجل'}</span>
                        <span className="text-[10px] text-slate-400">{s.schoolYear || '—'}</span>
                      </td>

                      {/* Phone */}
                      <td className="p-4">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <div className="flex items-center gap-1 text-slate-300">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{s.phone || '—'}</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ولي الأمر: {s.guardianPhone || '—'}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Cumulative Profile Button */}
                          <button
                            onClick={() => onSelectStudentProfile(s)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1"
                            title="عرض الملف التراكمي الشامل للطالب"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            الملف التراكمي
                          </button>

                          {/* Generate Smart ID Card Button */}
                          <button
                            onClick={() => onGenerateIDCard(s)}
                            className="p-2 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 rounded-xl transition-all"
                            title="عرض وطباعة بطاقة الهوية الذكية"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                              title="تعديل بيانات الطالب"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Soft Delete Button */}
                          {canEdit && (
                            <button
                              onClick={() => handleSoftDelete(s.id)}
                              className="p-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all"
                              title="حذف الطالب (نقل إلى سلة المحذوفات)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isAddEditModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                {editingStudent.id ? 'تعديل بيانات طالب' : 'إضافة طالب جديد بالمدرسة'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudentSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    الاسم الرباعي كاملاً: <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingStudent.fullName || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, fullName: e.target.value })
                    }
                    placeholder="مثال: يوحنا سمير حنا فهمي"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  />
                </div>

                {/* Photo URL */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">رابط الصورة الشخصية (Photo URL):</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={editingStudent.photoUrl || ''}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, photoUrl: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none font-mono text-[11px]"
                    />
                    <img
                      src={editingStudent.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt="معاينة"
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-amber-500/40 shrink-0"
                    />
                  </div>
                </div>

                {/* Deacon Rank */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الرتبة الشماسية:</label>
                  <select
                    value={editingStudent.deaconRank || 'إبصالتس'}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        deaconRank: e.target.value as DeaconRank,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {DEACON_RANKS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* National ID */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">الرقم القومي (14 رقم):</label>
                  <input
                    type="text"
                    maxLength={14}
                    value={editingStudent.nationalId || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, nationalId: e.target.value })
                    }
                    placeholder="30201011234567"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                {/* Section Header: Service / Deacon Academy Info */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-amber-400 block mb-2">
                    🎓 بيانات مدرسة الشمامسة (بالخدمة):
                  </span>
                </div>

                {/* Level (Deacon Service) */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">المرحلة الدراسية بالخدمة (المستوى):</label>
                  <select
                    value={editingStudent.level || academicLevels[0] || 'المستوى الأول'}
                    onChange={(e) => {
                      const lName = e.target.value as AcademicLevel;
                      const lIdx = academicLevels.indexOf(lName);
                      setEditingStudent({
                        ...editingStudent,
                        level: lName,
                        levelIndex: lIdx >= 0 ? lIdx : 0,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {academicLevels.length === 0 ? (
                      <option value="المستوى الأول">المستوى الأول</option>
                    ) : (
                      academicLevels.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Year (Deacon Service) */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">السنة الدراسية بالخدمة:</label>
                  <select
                    value={editingStudent.year || academicYears[0] || 'السنة الأولى'}
                    onChange={(e) => {
                      const yName = e.target.value as AcademicYear;
                      const yIdx = academicYears.indexOf(yName);
                      setEditingStudent({
                        ...editingStudent,
                        year: yName,
                        yearIndex: yIdx >= 0 ? yIdx : 0,
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {academicYears.length === 0 ? (
                      <option value="السنة الأولى">السنة الأولى</option>
                    ) : (
                      academicYears.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Section Header: School Info */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold text-sky-400 block mb-2">
                    🏫 بيانات التعليم والمدرسة (المدرسة العادية):
                  </span>
                </div>

                {/* School Level */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">المرحلة الدراسية بالمدرسة:</label>
                  <select
                    value={editingStudent.schoolLevel || SCHOOL_LEVELS[0]}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, schoolLevel: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {SCHOOL_LEVELS.map((sl) => (
                      <option key={sl} value={sl}>
                        {sl}
                      </option>
                    ))}
                  </select>
                </div>

                {/* School Year */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">السنة الدراسية بالمدرسة:</label>
                  <select
                    value={editingStudent.schoolYear || SCHOOL_YEARS[0]}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, schoolYear: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {SCHOOL_YEARS.map((sy) => (
                      <option key={sy} value={sy}>
                        {sy}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">هاتف الطالب الشخصي:</label>
                  <input
                    type="text"
                    value={editingStudent.phone || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, phone: e.target.value })
                    }
                    placeholder="01200000000"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                {/* Guardian Phone */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">هاتف ولي الأمر (الطوارئ):</label>
                  <input
                    type="text"
                    value={editingStudent.guardianPhone || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, guardianPhone: e.target.value })
                    }
                    placeholder="01000000000"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">ملاحظات وقيد الخادم:</label>
                  <textarea
                    rows={2}
                    value={editingStudent.notes || ''}
                    onChange={(e) =>
                      setEditingStudent({ ...editingStudent, notes: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddEditModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black transition-all"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recycle Bin Modal */}
      {isRecycleBinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  سلة المحذوفات
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">الطلاب المحذوفون مؤقتاً مع إمكانية الاستعادة أو الحذف النهائي.</p>
              </div>
              <button
                onClick={() => setIsRecycleBinOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3">
              {deletedList.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Trash2 className="w-12 h-12 mx-auto text-slate-700 mb-3" />
                  لا يوجد طلاب في سلة المحذوفات.
                </div>
              ) : (
                deletedList.map((s) => (
                  <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={s.fullName}
                        className="w-11 h-11 rounded-xl object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-100 truncate">{s.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.studentCode} • {s.level} • {s.year}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRestore(s.id)}
                        className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        استعادة
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(s.id)}
                        className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف نهائي
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className={`p-3 rounded-2xl ${confirmModal.isDanger ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-black text-slate-100">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-6">{confirmModal.message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-black ${
                  confirmModal.isDanger
                    ? 'bg-rose-500 hover:bg-rose-400 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {confirmModal.confirmText || 'تأكيد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
