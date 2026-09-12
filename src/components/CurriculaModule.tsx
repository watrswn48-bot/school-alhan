import React, { useMemo, useState } from 'react';
import { BookOpen, Music, FileText, Video, ExternalLink, Plus, Trash2, Search, Layers, X, ChevronDown, ChevronUp, User } from 'lucide-react';
import { CurriculumMaterial, MaterialType, UserSession } from '../types';
import { AcademicTerm, ChantSubject, getChantSubjects } from '../services/schoolSystem';
import { getStudents, getCurricula, saveCurriculum, deleteCurriculum, getAcademicLevels, getAcademicYears } from '../services/storage';
import { sessionHasPermission } from '../services/permissions';
import { normalizeDriveUrl } from '../services/mediaStorage';
import { normalizeSchoolClass, SCHOOL_CLASSES } from '../services/schoolClassUtils';

interface CurriculaModuleProps { session: UserSession; studentLevel?: string; studentYear?: string; studentClass?: string; isStudentPortal?: boolean; }

export const CurriculaModule: React.FC<CurriculaModuleProps> = ({ session, studentLevel, studentYear, studentClass, isStudentPortal = false }) => {
  const [curriculaList, setCurriculaList] = useState<CurriculumMaterial[]>(() => getCurricula());
  const [subjectsList, setSubjectsList] = useState<ChantSubject[]>(() => getChantSubjects());
  const academicLevels = getAcademicLevels();
  const academicYears = getAcademicYears();
  const currentStudent = useMemo(() => {
    if (!isStudentPortal && !studentClass) return undefined;
    return getStudents().find(s => s.id === session.userId || s.studentCode === session.studentCode);
  }, [isStudentPortal, studentClass, session.userId, session.studentCode]);
  const currentStudentClass = normalizeSchoolClass(studentClass || currentStudent?.schoolClass);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState(studentLevel || 'all');
  const [selectedYear, setSelectedYear] = useState(studentYear || 'all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const onlyMyClass = isStudentPortal || !!studentLevel || !!studentClass;
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formLevel, setFormLevel] = useState(studentLevel || academicLevels[0] || '');
  const [formYears, setFormYears] = useState<string[]>(studentYear ? [studentYear] : (academicYears[0] ? [academicYears[0]] : []));
  const [formClasses, setFormClasses] = useState<string[]>(currentStudentClass ? [currentStudentClass] : [SCHOOL_CLASSES[0]]);
  const [formTerm, setFormTerm] = useState<AcademicTerm>('الترم الأول');
  const [formSubject, setFormSubject] = useState('');
  const [formMaterialType, setFormMaterialType] = useState<MaterialType>('pdf');
  const [formFileUrl, setFormFileUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [expandedNotesIds, setExpandedNotesIds] = useState<Record<string, boolean>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isAdmin = session.role === 'admin' || session.userId === 'srv-admin-01';
  const canUpload = isAdmin || sessionHasPermission(session, 'canUploadFiles') || sessionHasPermission(session, 'canManageCurricula');
  const canManage = isAdmin || sessionHasPermission(session, 'canManageCurricula');
  const refreshList = () => setCurriculaList(getCurricula());
  const primaryFormYear = formYears[0] || '';

  const availableSubjects = useMemo(() => Array.from(new Map(subjectsList.filter(s => s.levelName === formLevel && s.yearName === primaryFormYear && formClasses.includes(normalizeSchoolClass(s.schoolClass)) && s.term === formTerm).map(s => [s.name, s])).values()), [subjectsList, formLevel, primaryFormYear, formClasses, formTerm]);
  const syncSubjectForSelection = (level: string, year: string, schoolClasses: string[], term: AcademicTerm) => { const found = subjectsList.find(s => s.levelName === level && s.yearName === year && schoolClasses.includes(normalizeSchoolClass(s.schoolClass)) && s.term === term); setFormSubject(found?.name || ''); };

  const filteredCurricula = curriculaList.filter(item => {
    const itemClass = normalizeSchoolClass(item.schoolClass);
    if (onlyMyClass && (studentLevel || isStudentPortal || studentClass)) {
      if (item.levelName !== 'لكل المستويات' && item.levelName !== studentLevel) return false;
      if (item.yearName && item.yearName !== 'لكل السنوات' && item.yearName !== studentYear) return false;
      if (currentStudentClass && itemClass !== currentStudentClass) return false;
      if (currentStudentClass && !item.schoolClass) return false;
    } else {
      if (selectedLevel !== 'all' && item.levelName !== 'لكل المستويات' && item.levelName !== selectedLevel) return false;
      if (selectedYear !== 'all' && item.yearName && item.yearName !== 'لكل السنوات' && item.yearName !== selectedYear) return false;
      if (selectedClass !== 'all' && itemClass !== normalizeSchoolClass(selectedClass)) return false;
    }
    if (selectedSubject !== 'all' && item.subject !== selectedSubject) return false;
    if (selectedType !== 'all' && item.materialType !== selectedType) return false;
    if (searchTerm.trim()) { const q = searchTerm.toLowerCase(); if (!item.title.toLowerCase().includes(q) && !item.subject.toLowerCase().includes(q) && !(item.contentNotes || '').toLowerCase().includes(q) && !(item.fileName || '').toLowerCase().includes(q)) return false; }
    return true;
  });

  const resetForm = () => { setFormTitle(''); setFormLevel(studentLevel || academicLevels[0] || ''); setFormYears(studentYear ? [studentYear] : (academicYears[0] ? [academicYears[0]] : [])); setFormClasses(currentStudentClass ? [currentStudentClass] : [SCHOOL_CLASSES[0]]); setFormTerm('الترم الأول'); setFormSubject(''); setFormMaterialType('pdf'); setFormFileUrl(''); setFormNotes(''); };
  const toggleFormYear = (year: string) => { setFormYears(current => current.includes(year) ? current.filter(y => y !== year) : [...current, year]); setFormSubject(''); };
  const toggleFormClass = (schoolClass: string) => { setFormClasses(current => current.includes(schoolClass) ? current.filter(c => c !== schoolClass) : [...current, schoolClass]); setFormSubject(''); };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpload) { setFeedbackMsg({ type: 'error', text: 'ليس لديك صلاحية رفع الملفات.' }); return; }
    if (formClasses.length === 0) { setFeedbackMsg({ type: 'error', text: 'اختر فصلاً واحداً على الأقل.' }); return; }
    if (formYears.length === 0) { setFeedbackMsg({ type: 'error', text: 'اختر سنة دراسية واحدة على الأقل.' }); return; }
    if (!formSubject) { setFeedbackMsg({ type: 'error', text: 'اختر مادة من المواد المضافة في خانة إضافة المواد أولاً.' }); return; }
    if (!formTitle.trim()) { setFeedbackMsg({ type: 'error', text: 'يرجى كتابة العنوان.' }); return; }
    setIsSubmitting(true);
    try {
      const uploadedUrl = normalizeDriveUrl(formFileUrl.trim());
      if (!uploadedUrl) { setFeedbackMsg({ type: 'error', text: 'أدخل رابط ملف من Google Drive أولاً.' }); return; }
      const createdAt = new Date().toISOString();
      formYears.forEach(yearName => formClasses.forEach(schoolClass => saveCurriculum({ title: formTitle.trim(), subject: formSubject, levelName: formLevel, yearName, schoolClass: normalizeSchoolClass(schoolClass), materialType: formMaterialType, fileUrl: uploadedUrl, contentNotes: formNotes.trim() || undefined, uploadedBy: session.fullName || 'إدارة المدرسة', uploadedById: session.userId || 'admin', createdAt })));
      refreshList(); setIsUploadModalOpen(false); resetForm(); setFeedbackMsg({ type: 'success', text: `تم ربط نفس المنهج بـ ${formYears.length} سنة و${formClasses.length} فصل بنجاح.` }); setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err) { setFeedbackMsg({ type: 'error', text: `فشل حفظ المنهج: ${err instanceof Error ? err.message : 'تأكد من صحة الرابط.'}` }); } finally { setIsSubmitting(false); }
  };

  const handleDelete = (id: string) => { if (!canManage) { setFeedbackMsg({ type: 'error', text: 'حذف المناهج متاح فقط لمن لديه صلاحية إدارة المناهج.' }); return; } deleteCurriculum(id); setDeleteConfirmId(null); refreshList(); };

  return <div className="space-y-6 animate-fade-in">
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center"><BookOpen className="w-6 h-6"/></div><div><h2 className="text-xl font-black">مكتبة مناهج الشمامسة والألحان</h2><p className="text-xs text-slate-400 mt-1">{isStudentPortal ? 'المناهج الخاصة بالمستوى والسنة والفصل المحددين' : 'إضافة وإدارة روابط المناهج والمذكرات'}</p></div></div><div className="flex gap-3">{canUpload && !isStudentPortal && <button onClick={() => { setSubjectsList(getChantSubjects()); setIsUploadModalOpen(true); }} className="px-5 py-2.5 bg-amber-500 text-slate-950 font-black text-xs rounded-2xl flex items-center gap-2"><Plus className="w-4 h-4"/>رفع منهج جديد</button>}</div></div>
    {feedbackMsg && <div className={`p-4 rounded-2xl border text-xs font-bold ${feedbackMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'}`}>{feedbackMsg.text}</div>}
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 space-y-3"><div className="flex flex-col md:flex-row gap-3"><div className="relative w-full md:w-80"><Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2"/><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="ابحث..." className="w-full pl-3 pr-9 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100"/></div><div className="flex gap-1.5 overflow-x-auto">{[['all','الكل',Layers],['audio','الألحان',Music],['pdf','PDF',FileText],['video','فيديو',Video],['doc','مستند',BookOpen]].map(([id,label,Icon]) => <button key={String(id)} onClick={() => setSelectedType(String(id))} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${selectedType === id ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>{React.createElement(Icon as any,{className:'w-3.5 h-3.5'})}{String(label)}</button>)}</div></div>{!isStudentPortal && <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800"><select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)} className="bg-slate-900 text-xs text-slate-200 rounded-xl p-2"><option value="all">كافة المراحل</option>{academicLevels.map(l => <option key={l}>{l}</option>)}</select><select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-slate-900 text-xs text-slate-200 rounded-xl p-2"><option value="all">كافة السنوات</option>{academicYears.map(y => <option key={y}>{y}</option>)}</select><select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="bg-slate-900 text-xs text-slate-200 rounded-xl p-2"><option value="all">كافة الفصول</option>{SCHOOL_CLASSES.map(c => <option key={c}>{c}</option>)}</select><select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="bg-slate-900 text-xs text-slate-200 rounded-xl p-2"><option value="all">كافة المواد</option>{Array.from(new Set(subjectsList.map(s => s.name))).map(s => <option key={s}>{s}</option>)}</select></div>}</div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{filteredCurricula.map(item => { const expanded = !!expandedNotesIds[item.id]; return <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between"><div className="space-y-3"><div className="flex justify-between"><span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-800 text-slate-300">{item.materialType}</span>{canManage && <button onClick={() => setDeleteConfirmId(item.id)} className="text-slate-500 hover:text-rose-400"><Trash2 className="w-3.5 h-3.5"/></button>}</div><h3 className="text-base font-black text-slate-100">{item.title}</h3><div className="flex gap-2 flex-wrap text-[11px] text-slate-400"><span className="px-2 py-0.5 bg-slate-950 rounded-md">{item.levelName}</span>{item.yearName && <span className="px-2 py-0.5 bg-slate-950 rounded-md">{item.yearName}</span>}{item.schoolClass && <span className="px-2 py-0.5 bg-slate-950 rounded-md">{normalizeSchoolClass(item.schoolClass)}</span>}{item.subject && <span className="px-2 py-0.5 bg-slate-950 rounded-md">{item.subject}</span>}</div>{item.contentNotes && <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-300"><p className={expanded ? '' : 'line-clamp-3'}>{item.contentNotes}</p>{item.contentNotes.length > 90 && <button onClick={() => setExpandedNotesIds({ ...expandedNotesIds, [item.id]: !expanded })} className="text-[11px] text-amber-400 mt-1">{expanded ? 'طي النص' : 'عرض النص كاملاً'} {expanded ? <ChevronUp className="w-3 h-3 inline"/> : <ChevronDown className="w-3 h-3 inline"/>}</button>}</div>}</div><div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">{item.fileUrl && <a href={item.fileUrl} target="_blank" rel="noreferrer" className="px-3 py-2 bg-slate-800 text-sky-300 rounded-xl text-xs font-bold"><ExternalLink className="w-3.5 h-3.5 inline"/> فتح</a>}<span className="mr-auto text-[10px] text-slate-500"><User className="w-3 h-3 inline"/> {item.uploadedBy || 'الإدارة'}</span></div></div>; })}</div>
    {filteredCurricula.length === 0 && <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">لم يتم العثور على مواد مطابقة.</div>}
    {isUploadModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 overflow-y-auto"><div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl"><div className="flex justify-between border-b border-slate-800 pb-4"><div><h3 className="text-lg font-black">رفع منهج جديد</h3><p className="text-xs text-slate-400 mt-1">يمكن ربط نفس المنهج بأكثر من سنة وفصل.</p></div><button onClick={() => setIsUploadModalOpen(false)}><X className="w-5 h-5 text-slate-400"/></button></div><form onSubmit={handleUploadSubmit} className="space-y-4 pt-4"><input required value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="عنوان المنهج / اللحن" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"/><select value={formLevel} onChange={e => { const v = e.target.value; setFormLevel(v); setFormSubject(''); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100">{academicLevels.map(l => <option key={l}>{l}</option>)}</select><div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-3"><div className="text-xs font-black text-amber-300 mb-2">السنوات الدراسية للمنهج</div><div className="grid grid-cols-2 gap-2">{academicYears.map(year => <label key={year} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs cursor-pointer ${formYears.includes(year) ? 'bg-amber-500/15 border-amber-500/50 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}><input type="checkbox" checked={formYears.includes(year)} onChange={() => toggleFormYear(year)} className="accent-amber-500"/>{year}</label>)}</div><p className="text-[10px] text-slate-500 mt-2">اختر سنة أو أكثر.</p></div><div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-3"><div className="text-xs font-black text-amber-300 mb-2">الفصول التي ينطبق عليها المنهج</div><div className="grid grid-cols-2 gap-2">{SCHOOL_CLASSES.map(schoolClass => <label key={schoolClass} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs cursor-pointer ${formClasses.includes(schoolClass) ? 'bg-amber-500/15 border-amber-500/50 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'}`}><input type="checkbox" checked={formClasses.includes(schoolClass)} onChange={() => toggleFormClass(schoolClass)} className="accent-amber-500"/>{schoolClass}</label>)}</div><p className="text-[10px] text-slate-500 mt-2">يمكن اختيار «تالتة ل سته» أو «إعدادي وثانوي» ليظهر المنهج للفصل المحدد.</p></div><div className="grid sm:grid-cols-2 gap-3"><select value={formTerm} onChange={e => { const v = e.target.value as AcademicTerm; setFormTerm(v); syncSubjectForSelection(formLevel, primaryFormYear, formClasses, v); }} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"><option>الترم الأول</option><option>الترم الثاني</option></select><select required value={formSubject} onChange={e => setFormSubject(e.target.value)} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"><option value="">اختر المادة المضافة لنفس المستوى/السنة/الفصل</option>{availableSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}</select></div><div className="flex items-center gap-2 text-[11px] text-slate-400 bg-amber-500/5 border border-amber-500/20 rounded-xl px-3 py-2"><BookOpen className="w-4 h-4 text-amber-400 shrink-0"/>المادة تظهر من المواد المضافة حسب أول سنة وفصل مختارين، ويمكن ربط نفس المنهج بباقي السنوات والفصول المحددة.</div><select value={formMaterialType} onChange={e => setFormMaterialType(e.target.value as MaterialType)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"><option value="audio">تسجيل صوتي</option><option value="pdf">PDF</option><option value="video">فيديو</option><option value="doc">مستند</option></select><input required type="url" value={formFileUrl} onChange={e => setFormFileUrl(e.target.value)} placeholder="رابط Google Drive للمنهج" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"/><textarea rows={4} value={formNotes} onChange={e => setFormNotes(e.target.value)} placeholder="ملاحظات / كلمات اللحن" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100"/><div className="flex justify-end gap-2"><button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-xs">إلغاء</button><button disabled={isSubmitting} className="px-6 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs">{isSubmitting ? 'جاري الحفظ...' : 'حفظ وربط المنهج'}</button></div></form></div></div>}
    {deleteConfirmId && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80"><div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-sm text-center"><Trash2 className="w-10 h-10 mx-auto text-rose-400 mb-3"/><h3 className="font-bold">تأكيد حذف المنهج</h3><p className="text-xs text-slate-400 my-4">الحذف متاح فقط لصاحب صلاحية إدارة المناهج.</p><div className="flex gap-2"><button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2 bg-slate-800 rounded-xl text-xs">إلغاء</button><button onClick={() => handleDelete(deleteConfirmId)} disabled={!canManage} className="flex-1 py-2 bg-rose-500 text-white rounded-xl text-xs disabled:opacity-40">حذف</button></div></div></div>}
  </div>;
};
