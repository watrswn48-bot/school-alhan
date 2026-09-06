/**
 * CURRICULA & STUDY MATERIALS MODULE (مناهج الشمامسة والألحان والمذكرات)
 * إمكانية رفع المناهج والملفات والمقاطع الصوتية للألحان وعرضها للطلاب والشمامسة
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Music,
  FileText,
  Video,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Search,
  Filter,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Calendar,
  User,
  Sparkles,
  Layers,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  UploadCloud,
  File,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CurriculumMaterial, MaterialType, UserSession } from '../types';
import {
  getCurricula,
  saveCurriculum,
  deleteCurriculum,
  getAcademicLevels,
  getAcademicYears,
} from '../services/storage';

interface CurriculaModuleProps {
  session: UserSession;
  studentLevel?: string;
  studentYear?: string;
  isStudentPortal?: boolean;
}

const SUBJECT_OPTIONS = [
  'الألحان والتسبيحة',
  'اللغة القبطية',
  'الطقس الكنسي',
  'العقيدة والتاريخ',
  'الكتاب المقدس واللاهوت',
  'روحيات وخدمة الشماس',
  'أخرى',
];

export const CurriculaModule: React.FC<CurriculaModuleProps> = ({
  session,
  studentLevel,
  studentYear,
  isStudentPortal = false,
}) => {
  const [curriculaList, setCurriculaList] = useState<CurriculumMaterial[]>(() => getCurricula());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>(studentLevel || 'all');
  const [selectedYear, setSelectedYear] = useState<string>(studentYear || 'all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyMyClass, setOnlyMyClass] = useState<boolean>(!!studentLevel);

  // Available Dynamic Levels & Years
  const academicLevels = getAcademicLevels();
  const academicYears = getAcademicYears();

  // Upload / Add Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSubject, setFormSubject] = useState('الألحان والتسبيحة');
  const [formLevel, setFormLevel] = useState(studentLevel || 'لكل المستويات');
  const [formYear, setFormYear] = useState(studentYear || 'لكل السنوات');
  const [formMaterialType, setFormMaterialType] = useState<MaterialType>('pdf');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formFileName, setFormFileName] = useState('');
  const [formFileSize, setFormFileSize] = useState('');
  const [formFileData, setFormFileData] = useState<string | undefined>(undefined);
  const [formNotes, setFormNotes] = useState('');

  // Audio Player State (track which audio is playing)
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Expanded text notes for items
  const [expandedNotesIds, setExpandedNotesIds] = useState<Record<string, boolean>>({});

  // Confirmation Delete State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isAdmin = session.role === 'admin';
  const canManage = isAdmin || (session.permissions?.canAddEditStudents ?? false);

  const refreshList = () => {
    setCurriculaList(getCurricula());
  };

  // Filter items
  const filteredCurricula = curriculaList.filter((item) => {
    // Student my-class filter
    if (onlyMyClass && studentLevel) {
      const matchLevel = item.levelName === 'لكل المستويات' || item.levelName === studentLevel;
      const matchYear = !item.yearName || item.yearName === 'لكل السنوات' || item.yearName === studentYear;
      if (!matchLevel || !matchYear) return false;
    } else {
      if (selectedLevel !== 'all' && item.levelName !== 'لكل المستويات' && item.levelName !== selectedLevel) {
        return false;
      }
      if (selectedYear !== 'all' && item.yearName && item.yearName !== 'لكل السنوات' && item.yearName !== selectedYear) {
        return false;
      }
    }

    if (selectedSubject !== 'all' && item.subject !== selectedSubject) {
      return false;
    }

    if (selectedType !== 'all' && item.materialType !== selectedType) {
      return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSubject = item.subject.toLowerCase().includes(q);
      const matchNotes = (item.contentNotes || '').toLowerCase().includes(q);
      const matchFile = (item.fileName || '').toLowerCase().includes(q);
      if (!matchTitle && !matchSubject && !matchNotes && !matchFile) {
        return false;
      }
    }

    return true;
  });

  // Handle File Input Selection
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormFileName(file.name);
    // Format size
    const sizeInKb = file.size / 1024;
    const formattedSize = sizeInKb > 1024
      ? `${(sizeInKb / 1024).toFixed(1)} MB`
      : `${Math.round(sizeInKb)} KB`;
    setFormFileSize(formattedSize);

    // Auto-detect type
    if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      setFormMaterialType('audio');
    } else if (file.type === 'application/pdf' || file.name.match(/\.pdf$/i)) {
      setFormMaterialType('pdf');
    } else if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mkv)$/i)) {
      setFormMaterialType('video');
    } else {
      setFormMaterialType('doc');
    }

    // Read base64
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      setFormFileData(loadEvt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit New Curriculum Material
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFeedbackMsg({ type: 'error', text: 'يرجى كتابة عنوان المنهج أو اسم اللحن' });
      return;
    }

    setIsSubmitting(true);
    try {
      saveCurriculum({
        title: formTitle.trim(),
        subject: formSubject,
        levelName: formLevel,
        yearName: formYear,
        materialType: formMaterialType,
        fileUrl: formFileUrl.trim() || undefined,
        fileName: formFileName.trim() || undefined,
        fileSize: formFileSize.trim() || undefined,
        fileData: formFileData || undefined,
        contentNotes: formNotes.trim() || undefined,
        uploadedBy: session.fullName || 'إدارة المدرسة',
        uploadedById: session.userId || 'admin',
        createdAt: new Date().toISOString(),
      });

      refreshList();
      setIsUploadModalOpen(false);
      resetForm();
      setFeedbackMsg({ type: 'success', text: 'تم رفع المنهج ومزامنته سحابياً بنجاح! سيظهر الآن لجميع الطلاب المستهدفين.' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedbackMsg({ type: 'error', text: `فشل الحفظ: ${msg}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormSubject('الألحان والتسبيحة');
    setFormLevel(studentLevel || 'لكل المستويات');
    setFormYear(studentYear || 'لكل السنوات');
    setFormMaterialType('pdf');
    setFormFileUrl('');
    setFormFileName('');
    setFormFileSize('');
    setFormFileData(undefined);
    setFormNotes('');
  };

  const handleDelete = (id: string) => {
    deleteCurriculum(id);
    setDeleteConfirmId(null);
    refreshList();
    if (currentPlayingId === id) {
      stopAudio();
    }
  };

  // Audio Playback Helpers
  const handlePlayAudio = (item: CurriculumMaterial) => {
    const audioSource = item.fileData || item.fileUrl;
    if (!audioSource) return;

    if (currentPlayingId === item.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    // New audio selection
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const newAudio = new Audio(audioSource);
    audioRef.current = newAudio;
    setCurrentPlayingId(item.id);
    setIsPlaying(true);
    setAudioProgress(0);

    newAudio.addEventListener('loadedmetadata', () => {
      setAudioDuration(newAudio.duration || 0);
    });

    newAudio.addEventListener('timeupdate', () => {
      setAudioCurrentTime(newAudio.currentTime || 0);
      if (newAudio.duration) {
        setAudioProgress((newAudio.currentTime / newAudio.duration) * 100);
      }
    });

    newAudio.addEventListener('ended', () => {
      setIsPlaying(false);
      setAudioProgress(0);
      setCurrentPlayingId(null);
    });

    newAudio.play().catch((e) => {
      console.warn('Audio play failed:', e);
      setIsPlaying(false);
    });
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentPlayingId(null);
    setAudioProgress(0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekPercent = parseFloat(e.target.value);
    if (audioRef.current && audioDuration) {
      const newTime = (seekPercent / 100) * audioDuration;
      audioRef.current.currentTime = newTime;
      setAudioProgress(seekPercent);
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleExpandNotes = (id: string) => {
    setExpandedNotesIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-100">
                مكتبة مناهج الشمامسة والألحان
              </h2>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold rounded-full">
                {curriculaList.length} مادة معتمدة
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isStudentPortal
                ? 'استمع إلى تسجيلات الألحان، نصوص اللغة القبطية، وحمّل المذكرات الخاصة بدفعتك'
                : 'رفع وإدارة المناهج الدراسية، تسجيلات الألحان، المذكرات والشروحات لمختلف المراحل'}
            </p>
          </div>
        </div>

        {/* Action Button for Admin / Authorized Servant */}
        <div className="flex items-center gap-3">
          {studentLevel && (
            <button
              onClick={() => setOnlyMyClass(!onlyMyClass)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 ${
                onlyMyClass
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>مناهج صفي فقط ({studentLevel})</span>
            </button>
          )}

          {canManage && (
            <button
              id="upload-curriculum-btn"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              رفع منهج أو لحن جديد
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ابحث باسم اللحن، المنهج، أو الكلمات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-9 py-2.5 bg-slate-900 border border-slate-800 focus:border-amber-500/50 rounded-2xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Badges for Type */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'الكل', icon: Layers },
              { id: 'audio', label: 'الألحان الصوتية', icon: Music },
              { id: 'pdf', label: 'المذكرات والكتب', icon: FileText },
              { id: 'video', label: 'فيديوهات الشرح', icon: Video },
              { id: 'doc', label: 'نصوص وكلمات', icon: BookOpen },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                    selectedType === t.id
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Dropdown Filters (Level, Year, Subject) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
          
          {/* Level Filter */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 shrink-0 font-medium">المرحلة:</span>
            <select
              value={selectedLevel}
              disabled={onlyMyClass && !!studentLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full cursor-pointer disabled:opacity-50"
            >
              <option value="all" className="bg-slate-900">كافة المراحل</option>
              {academicLevels.map((lvl) => (
                <option key={lvl} value={lvl} className="bg-slate-900">{lvl}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 shrink-0 font-medium">الفصل/السنة:</span>
            <select
              value={selectedYear}
              disabled={onlyMyClass && !!studentYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full cursor-pointer disabled:opacity-50"
            >
              <option value="all" className="bg-slate-900">كافة السنوات</option>
              {academicYears.map((yr) => (
                <option key={yr} value={yr} className="bg-slate-900">{yr}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 shrink-0 font-medium">المادة:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none w-full cursor-pointer"
            >
              <option value="all" className="bg-slate-900">كافة المواد</option>
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub} className="bg-slate-900">{sub}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active In-App Audio Floating Player if an audio is currently active */}
      {currentPlayingId && (
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-slide-in">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
              <Music className="w-5 h-5 animate-pulse" />
            </div>
            <div className="truncate">
              <div className="text-xs font-black text-amber-400 truncate">
                {curriculaList.find((c) => c.id === currentPlayingId)?.title || 'اللحن قيد التشغيل'}
              </div>
              <div className="text-[10px] text-slate-400">
                {curriculaList.find((c) => c.id === currentPlayingId)?.subject}
              </div>
            </div>
          </div>

          {/* Controls & Scrubber */}
          <div className="flex items-center gap-3 w-full md:w-1/2">
            <button
              onClick={() => {
                const item = curriculaList.find((c) => c.id === currentPlayingId);
                if (item) handlePlayAudio(item);
              }}
              className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <span className="text-[10px] text-slate-400 font-mono shrink-0">
              {formatSeconds(audioCurrentTime)}
            </span>

            <input
              type="range"
              min="0"
              max="100"
              value={audioProgress}
              onChange={handleSeek}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />

            <span className="text-[10px] text-slate-400 font-mono shrink-0">
              {formatSeconds(audioDuration)}
            </span>

            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-200 p-1.5 shrink-0"
              title={isMuted ? 'إلغاء الكتم' : 'كتم الصوت'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={stopAudio}
              className="text-slate-400 hover:text-rose-400 p-1.5 shrink-0 text-xs font-bold"
              title="إيقاف تماماً"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Curricula Cards Grid */}
      {filteredCurricula.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-xl">
          <BookOpen className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
          <h3 className="text-base font-bold text-slate-200">
            لم يتم العثور على مناهج أو ألحان مطابقة
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchTerm
              ? 'جرب البحث بكلمات مختلفة أو قم بإزالة مرشحات التصفية.'
              : 'لم يقم المسؤول برفع مناهج لهذا الفصل بعد. اضغط على زر "رفع منهج أو لحن جديد" لإضافة أول مادة.'}
          </p>
          {canManage && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-5 py-2.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-2xl inline-flex items-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              رفع أول منهج الآن
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCurricula.map((item) => {
            const isThisPlaying = currentPlayingId === item.id && isPlaying;
            const hasAudio = item.materialType === 'audio' || (item.fileName && item.fileName.match(/\.(mp3|wav|ogg|m4a)$/i));
            const isExpanded = !!expandedNotesIds[item.id];

            return (
              <div
                key={item.id}
                className={`bg-slate-900 border transition-all rounded-3xl p-5 shadow-xl flex flex-col justify-between group hover:border-slate-700 ${
                  isThisPlaying ? 'border-amber-500/60 ring-2 ring-amber-500/20' : 'border-slate-800'
                }`}
              >
                <div className="space-y-3.5">
                  
                  {/* Top Badges (Material Type & Stage) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 ${
                          item.materialType === 'audio'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : item.materialType === 'video'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : item.materialType === 'pdf'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.materialType === 'audio' && <Music className="w-3.5 h-3.5" />}
                        {item.materialType === 'video' && <Video className="w-3.5 h-3.5" />}
                        {item.materialType === 'pdf' && <FileText className="w-3.5 h-3.5" />}
                        {item.materialType === 'doc' && <BookOpen className="w-3.5 h-3.5" />}
                        <span>
                          {item.materialType === 'audio'
                            ? 'تسجيل لحن'
                            : item.materialType === 'video'
                            ? 'فيديو شرح'
                            : item.materialType === 'pdf'
                            ? 'مذكرة PDF'
                            : 'نص ومستند'}
                        </span>
                      </span>

                      <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/60">
                        {item.subject}
                      </span>
                    </div>

                    {canManage && (
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        title="حذف المنهج"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-black text-slate-100 leading-snug">
                    {item.title}
                  </h3>

                  {/* Stage Scope Tags */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
                    <span className="px-2 py-0.5 bg-slate-950 rounded-md border border-slate-800 text-slate-300">
                      {item.levelName}
                    </span>
                    {item.yearName && item.yearName !== 'لكل السنوات' && (
                      <span className="px-2 py-0.5 bg-slate-950 rounded-md border border-slate-800 text-slate-300">
                        {item.yearName}
                      </span>
                    )}
                    {item.fileSize && (
                      <span className="text-slate-500 font-mono text-[10px]">
                        ({item.fileSize})
                      </span>
                    )}
                  </div>

                  {/* Notes / Coptic Words Box */}
                  {item.contentNotes && (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-xs text-slate-300 relative">
                      <p className={`whitespace-pre-line leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {item.contentNotes}
                      </p>
                      {item.contentNotes.length > 90 && (
                        <button
                          onClick={() => toggleExpandNotes(item.id)}
                          className="mt-1.5 text-[11px] text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                        >
                          <span>{isExpanded ? 'طي النص' : 'عرض الكلمات كاملة'}</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  
                  {/* Audio Play Button */}
                  {hasAudio && (
                    <button
                      onClick={() => handlePlayAudio(item)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                        isThisPlaying
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/30'
                      }`}
                    >
                      {isThisPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{isThisPlaying ? 'إيقاف مؤقت' : 'استمع للحن'}</span>
                    </button>
                  )}

                  {/* Download / Open PDF / Video Action */}
                  <div className="flex items-center gap-1.5 mr-auto">
                    {item.fileData && (
                      <a
                        href={item.fileData}
                        download={item.fileName || `${item.title}.pdf`}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        title="تحميل الملف للجهاز"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        <span>تحميل</span>
                      </a>
                    )}

                    {item.fileUrl && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        title="فتح الرابط الخارجي"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{item.materialType === 'video' ? 'مشاهدة الفيديو' : 'فتح الرابط'}</span>
                      </a>
                    )}
                  </div>

                  {/* Uploader tag */}
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="truncate max-w-[90px]">{item.uploadedBy || 'الإدارة'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD CURRICULUM MODAL (رفع منهج أو لحن جديد) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl space-y-5 my-8">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-100">
                    رفع منهج أو لحن جديد للشمامسة
                  </h3>
                  <p className="text-xs text-slate-400">
                    سيتم حفظ المنهج ومزامنته سحابياً ليظهر لجميع طلاب المرحلة المحددة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  عنوان المنهج / اسم اللحن أو المذكرة <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: لحن تين أو أووشت السنوي، أو مذكرة قواعد القبطي"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none"
                />
              </div>

              {/* Subject & Type Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    المادة الكنسية
                  </label>
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl text-xs text-slate-100 focus:outline-none"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    نوع المنهج
                  </label>
                  <select
                    value={formMaterialType}
                    onChange={(e) => setFormMaterialType(e.target.value as MaterialType)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="audio">تسجيل صوتي للحن (Audio)</option>
                    <option value="pdf">مذكرة PDF / كتاب</option>
                    <option value="video">فيديو شرح / طقس (Video)</option>
                    <option value="doc">نص / كلمات وقراءات (Document)</option>
                  </select>
                </div>
              </div>

              {/* Stage & Year Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    المرحلة الدراسية المستهدفة
                  </label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="لكل المستويات">لكل المستويات (عام)</option>
                    {academicLevels.map((lvl) => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الفصل / السنة الدراسية
                  </label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="لكل السنوات">لكل السنوات (عام)</option>
                    {academicYears.map((yr) => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Upload Box (Drag & Drop or Manual Selection) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  ملف المنهج أو التسجيل الصوتي
                </label>
                <div className="relative border-2 border-dashed border-slate-800 hover:border-amber-500/60 transition-colors rounded-2xl p-4 bg-slate-950 text-center space-y-2">
                  <input
                    type="file"
                    id="curriculum-file-input"
                    onChange={handleFileInputChange}
                    accept="audio/*,application/pdf,video/*,.doc,.docx,.txt"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-10 h-10 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div className="text-xs text-slate-300 font-bold">
                    {formFileName ? (
                      <span className="text-emerald-400 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        تم اختيار: {formFileName} ({formFileSize})
                      </span>
                    ) : (
                      <span>اسحب وأفلت الملف هنا أو انقر للاختيار</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    يدعم ملفات الصوت (MP3, WAV)، ومذكرات PDF، والمستندات
                  </p>
                </div>
              </div>

              {/* External URL or Cloud Link (Optional / Alternative) */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رابط إلكتروني خارجي (يوتيوب / أرشيف / رابط مباشر - اختياري)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formFileUrl}
                  onChange={(e) => setFormFileUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none text-left font-mono"
                />
              </div>

              {/* Text Notes / Coptic Lyrics */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  كلمات اللحن / نص الشرح والملاحظات الطقسية
                </label>
                <textarea
                  rows={4}
                  placeholder="اكتب كلمات اللحن بالقبطي أو المعرب والمعنى، أو نقاط الشرح الرئيسية..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>جاري الحفظ والمزامنة...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>اعتماد ورفع المنهج</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              تأكيد حذف المنهج
            </h3>
            <p className="text-xs text-slate-400">
              هل أنت متأكد من حذف هذا المنهج نهائياً من الأكاديمية وقاعدة البيانات السحابية؟
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20"
              >
                نعم، احذف المنهج
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
