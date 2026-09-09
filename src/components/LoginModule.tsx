/**
 * Module 1: AUTHENTICATION & LOGIN (تسجيل الدخول والتحقق)
 * واجهة دخول الخدام والإدارة والطلاب وأولياء الأمور
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  QrCode,
  KeyRound,
  Sparkles,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { UserSession } from '../types';
import { getServants, getStudents, getSchoolLogo } from '../services/storage';
import { QRScannerModal } from './QRScannerModal';
import { SiteFooter } from './SiteFooter';

interface LoginModuleProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginModule: React.FC<LoginModuleProps> = ({ onLoginSuccess }) => {
  const [loginTab, setLoginTab] = useState<'servant' | 'student'>('servant');
  const [secretCodeInput, setSecretCodeInput] = useState('');
  const [studentInput, setStudentInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [schoolLogo, setSchoolLogo] = useState<string>(() => getSchoolLogo());

  useEffect(() => {
    const handleLogoUpdate = () => {
      setSchoolLogo(getSchoolLogo());
    };
    window.addEventListener('school_logo_updated', handleLogoUpdate);
    return () => {
      window.removeEventListener('school_logo_updated', handleLogoUpdate);
    };
  }, []);

  // Servant / Admin login handler via Code or QR text
  const authenticateServant = (codeOrQr: string) => {
    setErrorMessage(null);
    const servants = getServants();
    const clean = codeOrQr.trim();

    const servant = servants.find(
      (s) => s.isActive && (s.secretCode === clean || s.qrCode === clean || s.id === clean)
    );

    if (servant) {
      const session: UserSession = {
        isLoggedIn: true,
        mode: 'servant',
        role: servant.role,
        userId: servant.id,
        fullName: servant.fullName,
        permissions: servant.permissions,
      };
      onLoginSuccess(session);
    } else {
      setErrorMessage('رمز الدخول السري أو الـ QR Code غير صحيح. يرجى المراجعة والتأكد.');
    }
  };

  // Student / Parent login handler via Code, National ID, or QR text
  const authenticateStudent = (codeOrNationalOrQr: string) => {
    setErrorMessage(null);
    const students = getStudents();
    const clean = codeOrNationalOrQr.trim();

    const student = students.find(
      (s) =>
        s.studentCode.toLowerCase() === clean.toLowerCase() ||
        s.nationalId === clean ||
        s.id === clean
    );

    if (student) {
      const session: UserSession = {
        isLoggedIn: true,
        mode: 'student',
        userId: student.id,
        fullName: student.fullName,
        studentCode: student.studentCode,
        deaconRank: student.deaconRank,
      };
      onLoginSuccess(session);
    } else {
      setErrorMessage('كود الطالب أو الرقم القومي غير مسجّل بالمنصة. يرجى التواصل مع إدارة المدرسة.');
    }
  };

  const handleQRScanned = (scannedText: string) => {
    if (loginTab === 'servant') {
      authenticateServant(scannedText);
    } else {
      authenticateStudent(scannedText);
    }
  };

  const handleSecretCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authenticateServant(secretCodeInput);
  };

  const handleStudentFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    authenticateStudent(studentInput);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-['Tajawal']">
      {/* Background School Logo Watermark */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center select-none" aria-hidden="true">
        <div className="w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] max-w-[90vw] max-h-[90vh] rounded-full overflow-hidden opacity-10 border-4 border-amber-400/20 shadow-2xl transition-all duration-700 filter contrast-125">
          <img
            src={schoolLogo}
            alt=""
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,rgba(15,23,42,0)_75%)]" />
      </div>

      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-slate-900/95 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        
        {/* Header Branding - Big Prominent Logo */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-32 h-32 sm:w-36 sm:h-36 mx-auto rounded-3xl overflow-hidden bg-slate-950 border-2 border-amber-400 shadow-2xl shadow-amber-500/30 ring-4 ring-amber-500/25 flex items-center justify-center p-1.5 transition-transform hover:scale-105 duration-300">
            <img
              src={schoolLogo}
              alt="شعار مدرسة الشمامسة"
              className="w-full h-full object-cover rounded-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="inline-block px-3 py-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] font-black rounded-full shadow-xs mb-2">
              مدرسة تي اتشرومبي للألحان
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
              مدرسة تي اتشرومبي للألحان
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            أهلاً بك في مدرسة تي اتشرومبي للألحان - اختر نوع الدخول للمتابعة
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl mb-6">
          <button
            onClick={() => {
              setLoginTab('servant');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              loginTab === 'servant'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`} aria-label="دخول الخدام والإدارة" title="الخدام والإدارة">
            <ShieldCheck className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setLoginTab('student');
              setErrorMessage(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              loginTab === 'student'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`} aria-label="دخول الطالب وولي الأمر" title="الطالب وولي الأمر">
            <User className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: Servants & Admin Login */}
        {loginTab === 'servant' && (
          <div className="space-y-5 animate-fade-in">
            {/* Camera QR Button */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-amber-500/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]" aria-label="مسح QR" title="مسح QR">
              <QrCode className="w-5 h-5" />
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-800" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-medium absolute">
                أو إدخال الرمز السري الرقمي
              </span>
            </div>

            {/* Manual Secret Code Form */}
            <form onSubmit={handleSecretCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الرمز السري الخاص بالخادم:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={8}
                    value={secretCodeInput}
                    onChange={(e) => setSecretCodeInput(e.target.value)}
                    placeholder="مثال: 123456"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-500 rounded-2xl px-4 py-3 text-slate-100 font-mono text-center tracking-[0.3em] text-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-4" />
                </div>
              </div>

              <button
                type="submit"
                disabled={!secretCodeInput.trim()}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 font-bold text-xs rounded-2xl transition-all border border-slate-700 flex items-center justify-center gap-2" aria-label="دخول الخادم" title="دخول">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </form>

            {/* Quick Test Demo Credentials */}
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
              <span className="block font-semibold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                حسابات للتجربة السريعة:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => authenticateServant('123456')}
                  className="p-2 bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700/80 rounded-xl text-right transition-colors"
                >
                  <span className="block font-bold text-slate-200">القمص يوحنا (Admin)</span>
                  <span className="text-[10px] text-amber-400 font-mono">رمز: 123456</span>
                </button>
                <button
                  type="button"
                  onClick={() => authenticateServant('777888')}
                  className="p-2 bg-slate-800/80 hover:bg-amber-500/20 hover:text-amber-300 border border-slate-700/80 rounded-xl text-right transition-colors"
                >
                  <span className="block font-bold text-slate-200">الخادم مينا (Servant)</span>
                  <span className="text-[10px] text-amber-400 font-mono">رمز: 777888</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Student & Parent Access */}
        {loginTab === 'student' && (
          <div className="space-y-5 animate-fade-in">
            {/* Scan ID Card QR Code */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full py-4 bg-gradient-to-r from-sky-500 via-sky-600 to-sky-700 hover:from-sky-400 hover:to-sky-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]" aria-label="مسح QR" title="مسح QR">
              <QrCode className="w-5 h-5" />
            </button>

            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-800" />
              <span className="bg-slate-900 px-3 text-[11px] text-slate-500 font-medium absolute">
                أو كود الطالب / الرقم القومي
              </span>
            </div>

            {/* Student Code / National ID Form */}
            <form onSubmit={handleStudentFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  كود الطالب أو الرقم القومي (14 رقم):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentInput}
                    onChange={(e) => setStudentInput(e.target.value)}
                    placeholder="مثال: STU-2026-001 أو 30201011234561"
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-2xl px-4 py-3 text-slate-100 font-mono text-center text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  />
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={!studentInput.trim()}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                عرض سجلات الحضور والدرجات (قراءة فقط)
                <Eye className="w-4 h-4" />
              </button>
            </form>

            {/* Sample Student for quick testing */}
            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
              <span className="block font-semibold text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-sky-400" />
                دخول تجريبي سريع كولي أمر طالب:
              </span>
              <button
                type="button"
                onClick={() => authenticateStudent('STU-2026-001')}
                className="w-full p-2.5 bg-slate-800/80 hover:bg-sky-500/20 hover:text-sky-300 border border-slate-700/80 rounded-xl text-right transition-colors flex items-center justify-between"
              >
                <div>
                  <span className="block font-bold text-slate-200">الطالب: يوستس سمير لبيب (أغنسطس)</span>
                  <span className="text-[10px] text-sky-400 font-mono">STU-2026-001</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center text-[10px] text-slate-500">
          🔒 جميع البيانات محميّة ومحفوظة محلياً وفي الخادم السحابي للأكاديمية
        </div>
      </div>

      {/* QR Scanner Camera Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRScanned}
        title={
          loginTab === 'servant'
            ? 'مسح رمز الخادم الشخصي (Servant QR)'
            : 'مسح الـ QR Code من بطاقة الهوية الذكية للطالب'
        }
      />
      <SiteFooter />
    </div>
  );
};
