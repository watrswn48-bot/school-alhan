/**
 * Module 4: ADMIN CONTROL PANEL (لوحة تحكم الإدارة)
 * إدارة الخدام، مفاتيح الأمان، التبديل الدقيق للصلاحيات، والنسخ الاحتياطي JSON
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  UserPlus,
  KeyRound,
  QrCode,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Download,
  Upload,
  Database,
  Sliders,
  CheckCircle2,
  X,
  Sparkles,
  Lock,
  User,
  ShieldAlert,
  BookOpen,
  Layers,
  Plus,
  Edit2,
  Check,
  RotateCcw,
  School,
  Cloud,
  CloudUpload,
  CloudDownload,
  Image as ImageIcon,
} from 'lucide-react';
import { Servant, ServantPermissions, UserSession } from '../types';
import { CurriculaModule } from './CurriculaModule';
import {
  getServants,
  saveServant,
  deleteServant,
  exportDataJSON,
  importDataJSON,
  getAcademicLevels,
  saveAcademicLevels,
  renameAcademicLevel,
  addAcademicLevel,
  deleteAcademicLevel,
  deleteAllAcademicLevels,
  getAcademicYears,
  saveAcademicYears,
  renameAcademicYear,
  addAcademicYear,
  deleteAcademicYear,
  deleteAllAcademicYears,
  getStudents,
  syncAllToFirebase,
  pullFromFirebase,
  ACADEMIC_LEVELS,
  ACADEMIC_YEARS,
  getSchoolLogo,
  saveSchoolLogo,
  resetSchoolLogo,
  DEFAULT_SCHOOL_LOGO,
} from '../services/storage';

interface AdminPanelModuleProps {
  session: UserSession;
}

export const AdminPanelModule: React.FC<AdminPanelModuleProps> = ({ session }) => {
  const [servantsList, setServantsList] = useState<Servant[]>(() => getServants());
  const [activeAdminTab, setActiveAdminTab] = useState<'servants' | 'curricula' | 'branding' | 'backup'>('servants');
  const [currentLogo, setCurrentLogo] = useState<string>(() => getSchoolLogo());
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState<string>('');
  const [logoNotification, setLogoNotification] = useState<string | null>(null);

  // Dynamic Academic Levels & Years State
  const [academicLevels, setAcademicLevels] = useState<string[]>(() => getAcademicLevels());
  const [academicYears, setAcademicYears] = useState<string[]>(() => getAcademicYears());

  // Editing state for Levels
  const [editingLevelIdx, setEditingLevelIdx] = useState<number | null>(null);
  const [editingLevelVal, setEditingLevelVal] = useState<string>('');
  const [newLevelName, setNewLevelName] = useState<string>('');

  // Editing state for Years/Classes
  const [editingYearIdx, setEditingYearIdx] = useState<number | null>(null);
  const [editingYearVal, setEditingYearVal] = useState<string>('');
  const [newYearName, setNewYearName] = useState<string>('');

  const studentsList = getStudents();

  const [isAddServantModalOpen, setIsAddServantModalOpen] = useState(false);
  const [newServantData, setNewServantData] = useState<Partial<Servant>>({
    fullName: '',
    phone: '',
    role: 'servant',
    permissions: {
      canAddEditStudents: true,
      canSetRatings: true,
      canWriteNotes: true,
      canViewAnalytics: true,
    },
  });

  const [selectedServantForQR, setSelectedServantForQR] = useState<Servant | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Backup Message State
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (session.role !== 'admin') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
        <Lock className="w-12 h-12 mx-auto text-amber-500 stroke-[1.5]" />
        <h3 className="text-lg font-bold text-slate-100">لوحة التحكم مقتصرة حصرياً على مسؤول النظام (Admin)</h3>
      </div>
    );
  }

  const refreshServants = () => setServantsList(getServants());

  const refreshLevelsAndYears = () => {
    setAcademicLevels(getAcademicLevels());
    setAcademicYears(getAcademicYears());
  };

  const handleSaveLevelRename = (oldName: string) => {
    if (!editingLevelVal.trim()) return;
    renameAcademicLevel(oldName, editingLevelVal.trim());
    setEditingLevelIdx(null);
    setEditingLevelVal('');
    refreshLevelsAndYears();
  };

  const handleAddLevel = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const val = newLevelName.trim();
    if (!val) return;
    addAcademicLevel(val);
    setNewLevelName('');
    setAcademicLevels(getAcademicLevels());
  };

  const handleDeleteLevel = (levelName: string) => {
    const count = studentsList.filter((s) => s.level === levelName).length;
    const msg = count > 0
      ? `تنبيه: هناك ${count} طالب مسجلين حالياً في مرحلة "${levelName}". هل أنت متأكد من حذف هذه المرحلة؟`
      : `هل أنت متأكد من حذف المرحلة "${levelName}"؟`;

    setConfirmModal({
      isOpen: true,
      title: 'حذف مرحلة دراسية',
      message: msg,
      confirmText: 'نعم، حذف المرحلة',
      isDanger: true,
      onConfirm: () => {
        deleteAcademicLevel(levelName);
        refreshLevelsAndYears();
      },
    });
  };

  const handleSaveYearRename = (oldName: string) => {
    if (!editingYearVal.trim()) return;
    renameAcademicYear(oldName, editingYearVal.trim());
    setEditingYearIdx(null);
    setEditingYearVal('');
    refreshLevelsAndYears();
  };

  const handleAddYear = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    const val = newYearName.trim();
    if (!val) return;
    addAcademicYear(val);
    setNewYearName('');
    setAcademicYears(getAcademicYears());
  };

  const handleDeleteYear = (yearName: string) => {
    const count = studentsList.filter((s) => s.year === yearName).length;
    const msg = count > 0
      ? `تنبيه: هناك ${count} طالب مسجلين حالياً في فصل/سنة "${yearName}". هل أنت متأكد من الحذف؟`
      : `هل أنت متأكد من حذف الفصل/السنة "${yearName}"؟`;

    setConfirmModal({
      isOpen: true,
      title: 'حذف فصل / سنة دراسية',
      message: msg,
      confirmText: 'نعم، حذف الفصل',
      isDanger: true,
      onConfirm: () => {
        deleteAcademicYear(yearName);
        refreshLevelsAndYears();
      },
    });
  };

  const handleDeleteAllLevels = () => {
    setConfirmModal({
      isOpen: true,
      title: 'مسح جميع المراحل الدراسية',
      message: 'هل أنت متأكد من مسح جميع المراحل الدراسية؟ يمكنك إعادة إضافتها أو استعادة الوضع الافتراضي في أي وقت.',
      confirmText: 'نعم، مسح جميع المراحل',
      isDanger: true,
      onConfirm: () => {
        deleteAllAcademicLevels();
        refreshLevelsAndYears();
      },
    });
  };

  const handleDeleteAllYears = () => {
    setConfirmModal({
      isOpen: true,
      title: 'مسح جميع السنوات والفصول الدراسية',
      message: 'هل أنت متأكد من مسح جميع الفصول والسنوات الدراسية؟ يمكنك إعادة إضافتها أو استعادة الوضع الافتراضي في أي وقت.',
      confirmText: 'نعم، مسح جميع الفصول',
      isDanger: true,
      onConfirm: () => {
        deleteAllAcademicYears();
        refreshLevelsAndYears();
      },
    });
  };

  const handleResetToDefaults = () => {
    setConfirmModal({
      isOpen: true,
      title: 'إعادة ضبط الوضع الافتراضي',
      message: 'هل ترغب في إعادة ضبط قائمة المراحل والسنوات الدراسية إلى الترتيب الافتراضي الأولي؟',
      confirmText: 'نعم، إعادة الضبط',
      isDanger: false,
      onConfirm: () => {
        saveAcademicLevels(ACADEMIC_LEVELS);
        saveAcademicYears(ACADEMIC_YEARS);
        refreshLevelsAndYears();
      },
    });
  };

  const handleTogglePermission = (servantId: string, permKey: keyof ServantPermissions) => {
    const servant = servantsList.find((s) => s.id === servantId);
    if (!servant) return;

    const updatedPermissions = {
      ...servant.permissions,
      [permKey]: !servant.permissions[permKey],
    };

    saveServant({ id: servant.id, permissions: updatedPermissions });
    refreshServants();
  };

  const handleAddServantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServantData.fullName) return;

    saveServant(newServantData);
    setIsAddServantModalOpen(false);
    setNewServantData({
      fullName: '',
      phone: '',
      role: 'servant',
      permissions: {
        canAddEditStudents: true,
        canSetRatings: true,
        canWriteNotes: true,
        canViewAnalytics: true,
      },
    });
    refreshServants();
  };

  const handleDeleteServant = (id: string) => {
    const servant = servantsList.find((s) => s.id === id);
    const servantName = servant?.fullName ? `"${servant.fullName}"` : 'هذا الخادم';

    setConfirmModal({
      isOpen: true,
      title: 'حذف حساب الخادم',
      message: `هل أنت متأكد من حذف حساب الخادم ${servantName}؟ هذا الإجراء لا يمكن التراجع عنه وسيمسح بيانات الخادم من المنصة.`,
      confirmText: 'نعم، حذف الخادم',
      isDanger: true,
      onConfirm: () => {
        deleteServant(id);
        refreshServants();
      },
    });
  };

  const handleExportBackup = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deacon_academy_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importDataJSON(content)) {
        setBackupMessage({ type: 'success', text: '✅ تم استعادة النظام والبيانات بنجاح من الملف! جاري إعادة تحميل الشاشة...' });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setBackupMessage({ type: 'error', text: '❌ فشلت الاستعادة. يرجى التأكد من صحة تنسيق ملف الـ JSON.' });
      }
    };
    reader.readAsText(file);
  };

  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);

  const handleCloudUploadToFirebase = async () => {
    setIsFirebaseSyncing(true);
    setBackupMessage(null);
    try {
      const res = await syncAllToFirebase();
      if (res.success) {
        setBackupMessage({
          type: 'success',
          text: `✅ تم رفع ومزامنة كافة السجلات بنجاح إلى Firebase Firestore (${res.count} عنصر تم تحديثه سحابياً).`,
        });
      } else {
        setBackupMessage({
          type: 'error',
          text: `❌ تعذر الرفع إلى Firebase: ${res.error || 'حدث خطأ غير متوقع'}`,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBackupMessage({ type: 'error', text: `❌ خطأ في الاتصال بـ Firebase: ${msg}` });
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const handleCloudPullFromFirebase = async () => {
    setIsFirebaseSyncing(true);
    setBackupMessage(null);
    try {
      const res = await pullFromFirebase();
      if (res.success) {
        setBackupMessage({
          type: 'success',
          text: '✅ ' + res.message + ' - جاري تحديث الشاشة...',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setBackupMessage({
          type: 'error',
          text: '❌ ' + res.message,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBackupMessage({ type: 'error', text: `❌ خطأ أثناء المزامنة مع Firebase: ${msg}` });
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        saveSchoolLogo(base64);
        setCurrentLogo(base64);
        setLogoNotification('تم تحديث شعار مدرسة الشمامسة بنجاح في كامل المنصة والكارنيهات!');
        setTimeout(() => setLogoNotification(null), 4000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLogoUrlInput.trim()) return;
    saveSchoolLogo(customLogoUrlInput.trim());
    setCurrentLogo(customLogoUrlInput.trim());
    setCustomLogoUrlInput('');
    setLogoNotification('تم حفظ رابط الشعار الجديد واعتماده في كامل المنصة!');
    setTimeout(() => setLogoNotification(null), 4000);
  };

  const handleResetToDefaultLogo = () => {
    resetSchoolLogo();
    setCurrentLogo(DEFAULT_SCHOOL_LOGO);
    setLogoNotification('تمت استعادة الشعار الرسمي للأكاديمية بنجاح!');
    setTimeout(() => setLogoNotification(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-100">
              لوحة تحكم إدارة الأكاديمية (Admin Panel)
            </h2>
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold rounded-full">
              إدارة الفصول والخدام
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            التحكم الكامل بالفصول والمراحل الدراسية، مفاتيح الخدام، الصلاحيات، والنسخ الاحتياطي
          </p>
        </div>

        {activeAdminTab === 'servants' && (
          <button
            onClick={() => setIsAddServantModalOpen(true)}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            إضافة خادم جديد
          </button>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto shadow-inner">
        <button
          onClick={() => setActiveAdminTab('servants')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'servants'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          إدارة الخدام والصلاحيات ({servantsList.length})
        </button>

        <button
          onClick={() => setActiveAdminTab('curricula')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'curricula'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          مناهج الشمامسة ومكتبة الألحان
        </button>

        <button
          onClick={() => setActiveAdminTab('branding')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'branding'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          شعار الأكاديمية والموقع
        </button>

        <button
          onClick={() => setActiveAdminTab('backup')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeAdminTab === 'backup'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          النسخ الاحتياطي والاستعادة
        </button>
      </div>

      {/* TAB 2: SERVANTS MANAGEMENT & GRANULAR PERMISSIONS */}
      {activeAdminTab === 'servants' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-slate-100">
                إدارة الخدام ومفاتيح الأمان والصلاحيات ({servantsList.length})
              </h3>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                <tr>
                  <th className="p-4">الخادم</th>
                  <th className="p-4">رمز الدخول والـ QR</th>
                  <th className="p-4">🟢/🔴 إيقاف/تعديل الطلاب</th>
                  <th className="p-4">🟢/🔴 تقييم الـ 5 نجوم</th>
                  <th className="p-4">🟢/🔴 كتابة السلوك</th>
                  <th className="p-4">🟢/🔴 عرض الإحصائيات</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-800/60">
                {servantsList.map((srv) => (
                  <tr key={srv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span>{srv.fullName}</span>
                          <span className="block text-[10px] text-amber-400 font-normal">
                            {srv.role === 'admin' ? 'مسؤول النظام (Admin)' : 'خادم بالمدرسة'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Secret Code & QR Button */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                          {srv.secretCode}
                        </span>
                        <button
                          onClick={() => setSelectedServantForQR(srv)}
                          className="p-1.5 bg-slate-800 hover:bg-sky-500/20 text-sky-400 rounded-lg transition-colors"
                          title="عرض بطاقة الـ QR Code الخاصة بالخادم"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Permission 1: Add/Edit Students */}
                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePermission(srv.id, 'canAddEditStudents')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                          srv.permissions?.canAddEditStudents
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {srv.permissions?.canAddEditStudents ? '🟢 مسموح' : '🔴 معطل'}
                      </button>
                    </td>

                    {/* Permission 2: Set Ratings */}
                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePermission(srv.id, 'canSetRatings')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                          srv.permissions?.canSetRatings
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {srv.permissions?.canSetRatings ? '🟢 مسموح' : '🔴 معطل'}
                      </button>
                    </td>

                    {/* Permission 3: Write Notes */}
                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePermission(srv.id, 'canWriteNotes')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                          srv.permissions?.canWriteNotes
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {srv.permissions?.canWriteNotes ? '🟢 مسموح' : '🔴 معطل'}
                      </button>
                    </td>

                    {/* Permission 4: Analytics */}
                    <td className="p-4">
                      <button
                        onClick={() => handleTogglePermission(srv.id, 'canViewAnalytics')}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all flex items-center gap-1.5 ${
                          srv.permissions?.canViewAnalytics
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {srv.permissions?.canViewAnalytics ? '🟢 مسموح' : '🔴 معطل'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      {srv.id !== session.userId && (
                        <button
                          onClick={() => handleDeleteServant(srv.id)}
                          className="p-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all"
                          title="حذف حساب الخادم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BACKUP & RESTORE */}
      {activeAdminTab === 'backup' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
          {/* Firebase Cloud Sync Card */}
          <div className="p-5 bg-gradient-to-br from-amber-500/10 via-slate-950 to-slate-950 border border-amber-500/30 rounded-3xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    المزامنة السحابية الحية (Firebase Firestore)
                    <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold rounded-full">
                      سحابي نشط
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    يتم حفظ وتحديث كافة البيانات في قاعدة بيانات Firebase Firestore السحابية فورياً بجانب النسخة المحلية
                  </p>
                </div>
              </div>
            </div>

            {/* Project & Database Identifiers */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-800 pb-2">
                <span className="text-slate-400">معرّف المشروع (Project ID):</span>
                <code className="text-amber-400 font-mono font-bold bg-slate-950 px-2 py-1 rounded select-all">
                  gen-lang-client-0121267531
                </code>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-slate-400">اسم قاعدة البيانات (Firestore Database ID):</span>
                <code className="text-emerald-400 font-mono font-bold bg-slate-950 px-2 py-1 rounded select-all">
                  ai-studio-plantoaction-bea57033-bb8e-4b4d-a35d-7fe6614e784a
                </code>
              </div>
              <div className="text-[11px] text-amber-300/80 pt-1">
                💡 <strong>ملاحظة هامة في لوحة Firebase Console:</strong> تأكد من اختيار قاعدة البيانات المسماة <code className="bg-slate-950 px-1 py-0.5 rounded text-emerald-400">ai-studio-plantoaction-bea57033-bb8e-4b4d-a35d-7fe6614e784a</code> من القائمة المنسدلة في أعلى صفحة Firestore Database وليس <code className="bg-slate-950 px-1 py-0.5 rounded text-slate-400">(default)</code> لعرض السجلات.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCloudUploadToFirebase}
                disabled={isFirebaseSyncing}
                className="py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-bold text-xs transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CloudUpload className={`w-4 h-4 ${isFirebaseSyncing ? 'animate-bounce' : ''}`} />
                {isFirebaseSyncing ? 'جاري الرفع السحابي...' : 'رفع كافة البيانات إلى Firebase'}
              </button>

              <button
                onClick={handleCloudPullFromFirebase}
                disabled={isFirebaseSyncing}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CloudDownload className={`w-4 h-4 ${isFirebaseSyncing ? 'animate-bounce' : ''}`} />
                {isFirebaseSyncing ? 'جاري الاسترجاع...' : 'استرجاع ومزامنة من Firebase'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <Database className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100">
              النسخ الاحتياطي والاستعادة لملف خارجي (JSON Backup & Restore)
            </h3>
          </div>

          {backupMessage && (
            <div className={`p-3 rounded-2xl text-xs font-bold border ${
              backupMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
            }`}>
              {backupMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <span className="font-bold text-slate-200 text-xs block">
                تصدير قاعدة البيانات الحالية لملف JSON:
              </span>
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                تنزيل النسخة الاحتياطية JSON
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <span className="font-bold text-slate-200 text-xs block">
                استعادة النظام من ملف JSON محلي:
              </span>
              <label className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                رفع واستعادة ملف JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CURRICULA & HYMNS MANAGEMENT */}
      {activeAdminTab === 'curricula' && (
        <CurriculaModule session={session} />
      )}

      {/* TAB 4: BRANDING & SCHOOL LOGO MANAGEMENT */}
      {activeAdminTab === 'branding' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  شعار مدرسة الشمامسة والهوية البصرية للموقع
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                يظهر هذا الشعار تلقائياً في كامل الموقع: الشريط العلوي (Navbar)، بطاقات الهوية الذكية (الكارنيهات)، صفحة الدخول، وكشوف الدرجات المطبوعة.
              </p>
            </div>

            <button
              onClick={handleResetToDefaultLogo}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto"
              title="استعادة الشعار الرسمي الافتراضي للأكاديمية"
            >
              <RotateCcw className="w-4 h-4" />
              استعادة الشعار الأصلي
            </button>
          </div>

          {logoNotification && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{logoNotification}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Logo Preview Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-400">الشعار المعتمد حالياً:</span>
              <div className="w-36 h-36 rounded-3xl overflow-hidden bg-slate-900 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/20 ring-4 ring-amber-500/20 p-2 flex items-center justify-center">
                <img
                  src={currentLogo}
                  alt="شعار المدرسة الحالي"
                  className="w-full h-full object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                أبعاد مستحسنة: مربعة (1:1)، وضوح عالي، خلفية مفرغة أو داكنة متناسقة
              </p>
            </div>

            {/* Upload / Link Controls */}
            <div className="lg:col-span-2 space-y-5 bg-slate-950/60 border border-slate-800 rounded-2xl p-6">
              <div>
                <h4 className="text-sm font-bold text-slate-200 mb-2">
                  1. رفع شعار المدرسة من جهازك:
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  اختر صورة الشعار من حاسوبك أو هاتفك (PNG, JPG, SVG, WebP) ليتم حفظها محلياً وسحابياً فوراً.
                </p>
                <label className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer shadow-lg shadow-amber-500/20 transition-all">
                  <Upload className="w-4 h-4" />
                  اختيار ورفع ملف الشعار
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="border-t border-slate-800 pt-5">
                <h4 className="text-sm font-bold text-slate-200 mb-2">
                  2. أو وضع رابط مباشر لصورة الشعار:
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  إذا كان الشعار مرفوعاً على رابط خارجي أو خادم خاص:
                </p>
                <form onSubmit={handleSaveLogoUrl} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={customLogoUrlInput}
                    onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all"
                  >
                    حفظ الرابط
                  </button>
                </form>
              </div>

              {/* Where is it used preview list */}
              <div className="border-t border-slate-800 pt-5 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">
                  أماكن تطبيق الشعار في الموقع:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-amber-400 font-bold block mb-1">الرأس العلوي</span>
                    شريط التصفح Navbar
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-sky-400 font-bold block mb-1">الكارنيهات</span>
                    بطاقة الشماس الذكية
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-emerald-400 font-bold block mb-1">شاشة الدخول</span>
                    واجهة الخدام والطلاب
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-purple-400 font-bold block mb-1">التقارير المطبوعة</span>
                    كشوف الرصد والشهادات
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD SERVANT MODAL */}
      {isAddServantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                إضافة خادم جديد بالأكاديمية
              </h3>
              <button
                onClick={() => setIsAddServantModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddServantSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">اسم الخادم كاملاً:</label>
                <input
                  type="text"
                  required
                  value={newServantData.fullName || ''}
                  onChange={(e) =>
                    setNewServantData({ ...newServantData, fullName: e.target.value })
                  }
                  placeholder="مثال: الخادم بيشوي كامل"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">هاتف الخادم:</label>
                <input
                  type="text"
                  value={newServantData.phone || ''}
                  onChange={(e) =>
                    setNewServantData({ ...newServantData, phone: e.target.value })
                  }
                  placeholder="01200000000"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">دور الخادم:</label>
                <select
                  value={newServantData.role || 'servant'}
                  onChange={(e) =>
                    setNewServantData({
                      ...newServantData,
                      role: e.target.value as 'admin' | 'servant',
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                >
                  <option value="servant">خادم مدرسة</option>
                  <option value="admin">مسؤول نظام (Admin كامل الصلاحيات)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddServantModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition-all"
                >
                  حفظ وتوليد الرمز
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SERVANT QR MODAL */}
      {selectedServantForQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="font-bold text-slate-100 text-sm">
                بطاقة دخول الخادم: {selectedServantForQR.fullName}
              </h4>
              <button
                onClick={() => setSelectedServantForQR(null)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-inner">
              <img
                src={selectedServantForQR.secretCode ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${selectedServantForQR.secretCode}` : undefined}
                alt="Servant QR"
                className="w-44 h-44 mx-auto"
              />
            </div>

            <div className="space-y-1">
              <span className="block text-xs text-slate-400">الرمز السري الرقمي:</span>
              <span className="block text-xl font-mono font-black text-amber-400 tracking-widest">
                {selectedServantForQR.secretCode}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL CONFIRMATION MODAL */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl border ${
                confirmModal.isDanger
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">{confirmModal.title}</h4>
                <p className="text-[11px] text-slate-400">تأكيد الإجراء في نظام الإدارة</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {confirmModal.message}
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className={`flex-1 py-2.5 font-bold text-xs rounded-xl transition-all shadow-lg ${
                  confirmModal.isDanger
                    ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {confirmModal.confirmText || 'تأكيد'}
              </button>

              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
