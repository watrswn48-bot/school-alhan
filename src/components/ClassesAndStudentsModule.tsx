import React, { useMemo, useState } from 'react';
import {
  Users,
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
  Folder,
  LayoutGrid,
  List,
  BookOpen,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Download,
  CalendarDays,
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

type ViewMode = 'folders' | 'cards' | 'table';

const SCHOOL_CLASSES_FILTER = [
  'كيجي',
  'أولى وتانية',
  'تالتة ورابعة',
  'خامسة وسادسة',
  'إعدادي وثانوي',
] as const;

const DEFAULT_LEVELS: AcademicLevel[] = ['المستوى الأول', 'المستوى الثاني'];
const DEFAULT_YEARS: AcademicYear[] = [
  'السنة الأولى',
  'السنة الثانية',
  'السنة الثالثة',
  'السنة الرابعة',
];

export const ClassesAndStudentsModule: React.FC<ClassesAndStudentsProps> = ({
  session,
  onSelectStudentProfile,
  onGenerateIDCard,
}) => {
  const [studentsList, setStudentsList] = useState<Student[]>(() => getStudents());
  const [deletedList, setDeletedList] = useState<Student[]>(() => getDeletedStudents());
  const [academicLevels, setAcademicLevels] = useState<string[]>(() => getAcademicLevels());
  const [academicYears, setAcademicYears] = useState<string[]>(() => getAcademicYears());

  const [viewMode, setViewMode] = useState<ViewMode>('folders');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedRank, setSelectedRank] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolLevel, setSelectedSchoolLevel] = useState<string>('ALL');

  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const levels = academicLevels.length ? academicLevels : DEFAULT_LEVELS;
  const years = academicYears.length ? academicYears : DEFAULT_YEARS;
  const canEdit = session.role === 'admin' || session.permissions?.canAddEditStudents;

  const refreshData = () => {
    setStudentsList(getStudents());
    setDeletedList(getDeletedStudents());
    setAcademicLevels(getAcademicLevels());
    setAcademicYears(getAcademicYears());
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return studentsList.filter((s) => {
      if (selectedLevel !== 'ALL' && s.level !== selectedLevel) return false;
      if (selectedYear !== 'ALL' && s.year !== selectedYear) return false;
      if (selectedClass !== 'ALL' && s.schoolClass !== selectedClass) return false;
      if (selectedRank !== 'ALL' && s.deaconRank !== selectedRank) return false;
      if (selectedSchoolLevel !== 'ALL' && s.schoolLevel !== selectedSchoolLevel) return false;
      if (!q) return true;
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        s.nationalId.includes(q) ||
        s.phone.includes(q) ||
        s.guardianPhone.includes(q)
      );
    });
  }, [studentsList, selectedLevel, selectedYear, selectedClass, selectedRank, selectedSchoolLevel, searchQuery]);

  const folderStudents = (level: string, year: string, schoolClass?: string) =>
    studentsList.filter((s) => {
      if (s.level !== level || s.year !== year) return false;
      if (schoolClass && s.schoolClass !== schoolClass) return false;
      if (selectedSchoolLevel !== 'ALL' && s.schoolLevel !== selectedSchoolLevel) return false;
      if (selectedRank !== 'ALL' && s.deaconRank !== selectedRank) return false;
      return true;
    });

  const resetAll = () => {
    setSelectedLevel('ALL');
    setSelectedYear('ALL');
    setSelectedClass('ALL');
    setSelectedRank('ALL');
    setSelectedSchoolLevel('ALL');
    setSearchQuery('');
    setViewMode('folders');
  };

  const openLevel = (level: string) => {
    setSelectedLevel(level);
    setSelectedYear('ALL');
    setSelectedClass('ALL');
    setViewMode('folders');
  };

  const openYear = (year: string) => {
    setSelectedYear(year);
    setSelectedClass('ALL');
    setViewMode('folders');
  };

  const openClass = (schoolClass: string) => {
    setSelectedClass(schoolClass);
    setViewMode('cards');
  };

  const goBackFolder = () => {
    if (selectedClass !== 'ALL') {
      setSelectedClass('ALL');
      setViewMode('folders');
    } else if (selectedYear !== 'ALL') {
      setSelectedYear('ALL');
      setViewMode('folders');
    } else if (selectedLevel !== 'ALL') {
      setSelectedLevel('ALL');
      setViewMode('folders');
    }
  };

  const handleExportCSV = () => {
    if (!filteredStudents.length) return;
    const headers = ['كود الطالب', 'الاسم بالكامل', 'الرتبة', 'مرحلة الخدمة', 'سنة الخدمة', 'الفصل', 'المرحلة بالمدرسة', 'السنة بالمدرسة', 'هاتف الطالب', 'هاتف ولي الأمر', 'الرقم القومي'];
    const rows = filteredStudents.map((s) => [
      s.studentCode,
      `"${s.fullName.replace(/"/g, '""')}"`,
      s.deaconRank,
      s.level,
      s.year,
      s.schoolClass || '-',
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
    link.download = `قائمة_الطلاب_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent({ ...student });
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
    setConfirmModal({
      isOpen: true,
      title: 'نقل الطالب لسلة المحذوفات',
      message: `هل أنت متأكد من نقل الطالب "${student?.fullName || 'هذا الطالب'}" إلى سلة المحذوفات؟`,
      confirmText: 'نقل للمحذوفات',
      isDanger: true,
      onConfirm: () => {
        softDeleteStudent(id);
        refreshData();
      },
    });
  };

  const handlePermanentDelete = (id: string) => {
    const student = deletedList.find((s) => s.id === id);
    setConfirmModal({
      isOpen: true,
      title: 'حذف الطالب نهائياً',
      message: `⚠️ سيتم حذف كافة بيانات الطالب "${student?.fullName || 'هذا الطالب'}" نهائياً. هل أنت متأكد؟`,
      confirmText: 'نعم، حذف نهائي',
      isDanger: true,
      onConfirm: () => {
        permanentlyDeleteStudent(id);
        refreshData();
      },
    });
  };

  const studentCards = (students: Student[]) => (
    students.length === 0 ? (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
        <Users className="w-12 h-12 mx-auto text-slate-600 mb-3" />
        <p className="text-sm">لا يوجد طلاب في هذا المجلد.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {students.map((s) => (
          <div key={s.id} className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 shadow-lg space-y-4 transition-all">
            <div className="flex items-start gap-3">
              <img
                src={s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={s.fullName}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-700 border border-slate-800 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
                }}
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-100 text-sm truncate">{s.fullName}</h4>
                <div className="flex items-center gap-1.5 flex-wrap mt-1">
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono rounded-md">{s.studentCode}</span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded-md">{s.deaconRank}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between gap-2"><span className="text-amber-400">الفصل:</span><span className="font-bold text-slate-100">{s.schoolClass || 'غير محدد'}</span></div>
              <div className="flex justify-between gap-2"><span className="text-slate-500">الخدمة:</span><span className="text-slate-200">{s.level} — {s.year}</span></div>
              {s.schoolLevel && <div className="flex justify-between gap-2"><span className="text-sky-400">المدرسة:</span><span className="text-slate-300">{s.schoolLevel}</span></div>}
              <div className="flex justify-between gap-2 font-mono"><span className="text-slate-500 font-sans">الهاتف:</span><span>{s.phone || 'غير مسجل'}</span></div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
              <button onClick={() => onSelectStudentProfile(s)} className="flex-1 py-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1">
                <Eye className="w-3.5 h-3.5" /> الملف التراكمي
              </button>
              <button onClick={() => onGenerateIDCard(s)} className="p-2 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 rounded-xl" title="بطاقة الطالب">
                <QrCode className="w-4 h-4" />
              </button>
              {canEdit && <button onClick={() => handleOpenEdit(s)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl" title="تعديل"><Edit className="w-4 h-4" /></button>}
              {canEdit && <button onClick={() => handleSoftDelete(s.id)} className="p-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-xl" title="حذف"><Trash2 className="w-4 h-4" /></button>}
            </div>
          </div>
        ))}
      </div>
    )
  );

  const renderFolderView = () => {
    if (selectedLevel === 'ALL') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {levels.map((level) => {
            const count = studentsList.filter((s) => s.level === level && (selectedSchoolLevel === 'ALL' || s.schoolLevel === selectedSchoolLevel)).length;
            return (
              <button key={level} onClick={() => openLevel(level)} className="text-right bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/70 rounded-3xl p-6 shadow-xl transition-all group">
                <div className="flex items-center justify-between">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-amber-400 group-hover:border-amber-500/40"><FolderOpen className="w-8 h-8" /></div>
                  <span className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-bold">{count} طالب</span>
                </div>
                <h3 className="mt-5 text-xl font-black text-slate-100 group-hover:text-amber-300">{level}</h3>
                <p className="mt-1 text-xs text-slate-500">٤ سنوات دراسية</p>
                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs"><span className="text-slate-500">افتح المجلد</span><ChevronLeft className="w-4 h-4 text-amber-400" /></div>
              </button>
            );
          })}
        </div>
      );
    }

    if (selectedYear === 'ALL') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {years.map((year) => {
            const count = studentsList.filter((s) => s.level === selectedLevel && s.year === year && (selectedSchoolLevel === 'ALL' || s.schoolLevel === selectedSchoolLevel)).length;
            return (
              <button key={year} onClick={() => openYear(year)} className="text-right bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/70 rounded-3xl p-5 shadow-lg transition-all group">
                <div className="flex items-center justify-between gap-3"><Folder className="w-9 h-9 text-amber-400" /><span className="text-[10px] px-2 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400">{count} طالب</span></div>
                <h3 className="mt-5 text-base font-black text-slate-100 group-hover:text-amber-300">{year}</h3>
                <p className="mt-1 text-[11px] text-slate-500">افتح السنة لعرض الفصول</p>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {SCHOOL_CLASSES_FILTER.map((schoolClass) => {
          const count = folderStudents(selectedLevel, selectedYear, schoolClass).length;
          return (
            <button key={schoolClass} onClick={() => openClass(schoolClass)} className="text-right bg-slate-900 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-800/70 rounded-3xl p-5 shadow-lg transition-all group">
              <div className="flex items-center justify-between"><FolderOpen className="w-8 h-8 text-amber-400" /><span className="px-2 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">{count} طالب</span></div>
              <h3 className="mt-5 text-base font-black text-slate-100 group-hover:text-amber-300">{schoolClass}</h3>
              <p className="mt-1 text-[11px] text-slate-500">{selectedLevel} — {selectedYear}</p>
              <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-amber-400 font-bold">فتح الطلاب ←</div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-100 flex items-center gap-2"><BookOpen className="w-6 h-6 text-amber-400" /> الفصول والطلاب</h2>
          <p className="text-xs text-slate-400 mt-1">تصفح الطلاب بنظام المجلدات: المستوى ← السنة ← الفصل ← الطلاب.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
            <button onClick={() => setViewMode('folders')} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${viewMode === 'folders' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}><LayoutGrid className="w-3.5 h-3.5" /> المجلدات</button>
            <button onClick={() => setViewMode('cards')} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${viewMode === 'cards' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}><Users className="w-3.5 h-3.5" /> الطلاب</button>
            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}><List className="w-3.5 h-3.5" /> جدول</button>
          </div>
          <button onClick={handleExportCSV} className="px-3.5 py-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-2xl text-xs font-bold flex items-center gap-1.5"><Download className="w-4 h-4" /> تصدير</button>
          <button onClick={() => setIsRecycleBinOpen(true)} className="px-3.5 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-2xl text-xs font-bold flex items-center gap-2"><Trash2 className="w-4 h-4 text-rose-400" /> سلة المحذوفات {deletedList.length > 0 && <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center">{deletedList.length}</span>}</button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1"><Layers className="w-4 h-4 text-amber-400" /> المستوى:</span>
          <button onClick={resetAll} className={`px-4 py-2 rounded-xl text-xs font-bold border shrink-0 ${selectedLevel === 'ALL' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>كل المستويات</button>
          {levels.map((level) => <button key={level} onClick={() => openLevel(level)} className={`px-4 py-2 rounded-xl text-xs font-bold border shrink-0 ${selectedLevel === level ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}>{level}</button>)}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-800 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0 flex items-center gap-1"><CalendarDays className="w-4 h-4 text-amber-400" /> السنة:</span>
          <button onClick={() => { setSelectedYear('ALL'); setSelectedClass('ALL'); setViewMode('folders'); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${selectedYear === 'ALL' ? 'bg-slate-800 text-amber-400 border border-amber-500/40' : 'text-slate-400'}`}>كل السنوات</button>
          {years.map((year) => <button key={year} onClick={() => { if (selectedLevel === 'ALL') openLevel(levels[0]); openYear(year); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${selectedYear === year ? 'bg-slate-800 text-amber-400 border border-amber-500/40' : 'text-slate-400'}`}>{year}</button>)}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-800 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0">الفصل:</span>
          <button onClick={() => { setSelectedClass('ALL'); setViewMode('folders'); }} className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${selectedClass === 'ALL' ? 'bg-slate-800 text-amber-400 border border-amber-500/40' : 'text-slate-400'}`}>كل الفصول</button>
          {SCHOOL_CLASSES_FILTER.map((schoolClass) => <button key={schoolClass} onClick={() => openClass(schoolClass)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${selectedClass === schoolClass ? 'bg-slate-800 text-amber-400 border border-amber-500/40' : 'text-slate-400'}`}>{schoolClass}</button>)}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-800 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0">المرحلة التعليمية:</span>
          <button onClick={() => setSelectedSchoolLevel('ALL')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${selectedSchoolLevel === 'ALL' ? 'bg-slate-800 text-sky-400 border border-sky-500/40' : 'text-slate-400'}`}>كل المراحل</button>
          {SCHOOL_LEVELS.map((stage) => <button key={stage} onClick={() => setSelectedSchoolLevel(stage)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 ${selectedSchoolLevel === stage ? 'bg-slate-800 text-sky-400 border border-sky-500/40' : 'text-slate-400'}`}>{stage}</button>)}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث بالاسم، الكود، الهاتف، أو الرقم القومي..." className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 focus:outline-none" />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <div className="relative"><select value={selectedRank} onChange={(e) => setSelectedRank(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 pr-8"><option value="ALL">جميع الرتب الشماسية</option>{DEACON_RANKS.map((rank) => <option key={rank} value={rank}>{rank}</option>)}</select><Filter className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" /></div>
          {(selectedLevel !== 'ALL' || selectedYear !== 'ALL' || selectedClass !== 'ALL' || selectedRank !== 'ALL' || selectedSchoolLevel !== 'ALL' || searchQuery) && <button onClick={resetAll} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">إعادة الضبط</button>}
        </div>
      </div>

      {viewMode === 'folders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap px-1">
            <div>
              <h3 className="text-sm font-black text-slate-100">نظام المجلدات</h3>
              <p className="text-[11px] text-slate-500 mt-1">{selectedLevel === 'ALL' ? 'اختر المستوى' : selectedYear === 'ALL' ? `اختر سنة من داخل ${selectedLevel}` : `اختر الفصل داخل ${selectedLevel} / ${selectedYear}`}</p>
            </div>
            {selectedLevel !== 'ALL' && <button onClick={goBackFolder} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5"><ChevronRight className="w-4 h-4" /> رجوع</button>}
          </div>
          {renderFolderView()}
        </div>
      )}

      {viewMode === 'cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <button onClick={() => setViewMode('folders')} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold flex items-center gap-1"><ChevronRight className="w-4 h-4" /> رجوع للمجلدات</button>
              <span>{selectedLevel !== 'ALL' ? selectedLevel : 'كل المستويات'}</span><span>/</span><span>{selectedYear !== 'ALL' ? selectedYear : 'كل السنوات'}</span><span>/</span><span>{selectedClass !== 'ALL' ? selectedClass : 'كل الفصول'}</span>
            </div>
            <span className="text-xs font-bold text-slate-300">{filteredStudents.length} طالب</span>
          </div>
          {studentCards(filteredStudents)}
        </div>
      )}

      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {filteredStudents.length === 0 ? <div className="p-12 text-center text-slate-500">لا يوجد طلاب مطابقون.</div> : <div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead className="bg-slate-950/80 text-slate-400 font-bold"><tr><th className="p-4">الطالب</th><th className="p-4">الخدمة</th><th className="p-4">الفصل</th><th className="p-4">المدرسة</th><th className="p-4">التواصل</th><th className="p-4">الإجراءات</th></tr></thead><tbody className="divide-y divide-slate-800/60">{filteredStudents.map((s) => <tr key={s.id} className="hover:bg-slate-800/40"><td className="p-4"><div className="flex items-center gap-3"><img src={s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} alt={s.fullName} className="w-10 h-10 rounded-xl object-cover" /><div><b className="text-slate-100">{s.fullName}</b><span className="block text-[10px] text-slate-500 font-mono">{s.studentCode}</span></div></div></td><td className="p-4"><span className="text-amber-300">{s.level}</span><span className="block text-[10px] text-slate-500">{s.year}</span></td><td className="p-4 text-slate-200">{s.schoolClass || 'غير محدد'}</td><td className="p-4"><span className="text-sky-300">{s.schoolLevel || 'غير مسجل'}</span><span className="block text-[10px] text-slate-500">{s.schoolYear || '—'}</span></td><td className="p-4"><div className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3 text-slate-500" />{s.phone || '—'}</div><div className="text-[10px] text-slate-500">ولي الأمر: {s.guardianPhone || '—'}</div></td><td className="p-4"><div className="flex items-center gap-1.5"><button onClick={() => onSelectStudentProfile(s)} className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-xl font-bold">الملف</button><button onClick={() => onGenerateIDCard(s)} className="p-2 bg-slate-800 text-sky-400 rounded-xl"><QrCode className="w-4 h-4" /></button>{canEdit && <button onClick={() => handleOpenEdit(s)} className="p-2 bg-slate-800 text-slate-300 rounded-xl"><Edit className="w-4 h-4" /></button>}{canEdit && <button onClick={() => handleSoftDelete(s.id)} className="p-2 bg-slate-800 text-rose-400 rounded-xl"><Trash2 className="w-4 h-4" /></button>}</div></td></tr>)}</tbody></table></div>}
        </div>
      )}

      {isAddEditModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between"><h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-amber-400" /> تعديل بيانات الطالب</h3><button onClick={() => { setIsAddEditModalOpen(false); setEditingStudent(null); }} className="text-slate-400"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSaveStudentSubmit} className="p-6 space-y-4 text-xs"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-slate-300 font-semibold mb-1">الاسم الرباعي</label><input required value={editingStudent.fullName || ''} onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100" /></div>
              <div className="sm:col-span-2"><label className="block text-slate-300 font-semibold mb-1">رابط الصورة</label><input type="url" value={editingStudent.photoUrl || ''} onChange={(e) => setEditingStudent({ ...editingStudent, photoUrl: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono text-[11px]" /></div>
              <div><label className="block text-slate-300 font-semibold mb-1">الرتبة</label><select value={editingStudent.deaconRank || DEACON_RANKS[0]} onChange={(e) => setEditingStudent({ ...editingStudent, deaconRank: e.target.value as DeaconRank })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100">{DEACON_RANKS.map((r) => <option key={r}>{r}</option>)}</select></div>
              <div><label className="block text-slate-300 font-semibold mb-1">الرقم القومي</label><input maxLength={14} value={editingStudent.nationalId || ''} onChange={(e) => setEditingStudent({ ...editingStudent, nationalId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono" /></div>
              <div><label className="block text-slate-300 font-semibold mb-1">المستوى</label><select value={editingStudent.level || levels[0]} onChange={(e) => { const level = e.target.value as AcademicLevel; setEditingStudent({ ...editingStudent, level, levelIndex: levels.indexOf(level) }); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100">{levels.map((l) => <option key={l}>{l}</option>)}</select></div>
              <div><label className="block text-slate-300 font-semibold mb-1">السنة</label><select value={editingStudent.year || years[0]} onChange={(e) => { const year = e.target.value as AcademicYear; setEditingStudent({ ...editingStudent, year, yearIndex: years.indexOf(year) }); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100">{years.map((y) => <option key={y}>{y}</option>)}</select></div>
              <div><label className="block text-slate-300 font-semibold mb-1">الفصل</label><select value={editingStudent.schoolClass || SCHOOL_CLASSES_FILTER[0]} onChange={(e) => setEditingStudent({ ...editingStudent, schoolClass: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100">{SCHOOL_CLASSES_FILTER.map((c) => <option key={c}>{c}</option>)}</select></div>
              <div><label className="block text-slate-300 font-semibold mb-1">المرحلة بالمدرسة</label><select value={editingStudent.schoolLevel || SCHOOL_LEVELS[0]} onChange={(e) => setEditingStudent({ ...editingStudent, schoolLevel: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100">{SCHOOL_LEVELS.map((l) => <option key={l}>{l}</option>)}</select></div>
              <div><label className="block text-slate-300 font-semibold mb-1">السنة بالمدرسة</label><select value={editingStudent.schoolYear || SCHOOL_YEARS[0]} onChange={(e) => setEditingStudent({ ...editingStudent, schoolYear: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100">{SCHOOL_YEARS.map((y) => <option key={y}>{y}</option>)}</select></div>
              <div><label className="block text-slate-300 font-semibold mb-1">هاتف الطالب</label><input value={editingStudent.phone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono" /></div>
              <div><label className="block text-slate-300 font-semibold mb-1">هاتف ولي الأمر</label><input value={editingStudent.guardianPhone || ''} onChange={(e) => setEditingStudent({ ...editingStudent, guardianPhone: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono" /></div>
            </div><div className="flex justify-end gap-2 pt-4 border-t border-slate-800"><button type="button" onClick={() => { setIsAddEditModalOpen(false); setEditingStudent(null); }} className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold">إلغاء</button><button type="submit" className="px-6 py-2.5 bg-amber-500 text-slate-950 rounded-xl font-black">حفظ البيانات</button></div></form>
          </div>
        </div>
      )}

      {isRecycleBinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"><div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"><div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between"><div><h3 className="text-lg font-bold text-slate-100 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-rose-400" /> سلة المحذوفات</h3><p className="text-[11px] text-slate-400 mt-1">يمكنك استعادة الطلاب أو حذفهم نهائياً.</p></div><button onClick={() => setIsRecycleBinOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button></div><div className="p-5 overflow-y-auto space-y-3">{deletedList.length === 0 ? <div className="py-12 text-center text-slate-500"><Trash2 className="w-12 h-12 mx-auto text-slate-700 mb-3" />لا يوجد طلاب في سلة المحذوفات.</div> : deletedList.map((s) => <div key={s.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"><div className="flex items-center gap-3"><img src={s.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'} alt={s.fullName} className="w-11 h-11 rounded-xl object-cover" /><div><p className="text-sm font-bold text-slate-100">{s.fullName}</p><p className="text-[10px] text-slate-400 font-mono">{s.studentCode} • {s.level} • {s.year} • {s.schoolClass || 'بدون فصل'}</p></div></div><div className="flex items-center gap-2"><button onClick={() => { restoreStudent(s.id); refreshData(); }} className="px-3 py-2 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5"><RotateCcw className="w-3.5 h-3.5" /> استعادة</button><button onClick={() => handlePermanentDelete(s.id)} className="px-3 py-2 bg-rose-500/10 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> حذف نهائي</button></div></div>)}</div></div></div>
      )}

      {confirmModal?.isOpen && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"><div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full shadow-2xl p-6 space-y-5"><div className="flex items-start gap-3"><div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400"><ShieldAlert className="w-6 h-6" /></div><div><h3 className="text-base font-black text-slate-100">{confirmModal.title}</h3><p className="text-xs text-slate-400 mt-1 leading-6">{confirmModal.message}</p></div></div><div className="flex justify-end gap-2"><button onClick={() => setConfirmModal(null)} className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">إلغاء</button><button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-black">{confirmModal.confirmText || 'تأكيد'}</button></div></div></div>}
    </div>
  );
};
