import React, { useState, useEffect } from 'react';
import { UserCheck, LogOut, Shield, Sun, Moon } from 'lucide-react';
import { UserSession } from '../types';
import { getSchoolLogo } from '../services/storage';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';

interface NavbarProps { session: UserSession; onLogout: () => void; onRefreshData?: () => void; }

export const Navbar: React.FC<NavbarProps> = ({ session, onLogout, onRefreshData }) => {
  const [schoolLogo, setSchoolLogo] = useState<string>(() => getSchoolLogo());
  const [lightMode, setLightMode] = useState(() => localStorage.getItem('deacon_theme_v1') === 'light');

  useEffect(() => {
    const handleLogoUpdate = () => setSchoolLogo(getSchoolLogo());
    window.addEventListener('school_logo_updated', handleLogoUpdate);
    return () => window.removeEventListener('school_logo_updated', handleLogoUpdate);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', lightMode);
    localStorage.setItem('deacon_theme_v1', lightMode ? 'light' : 'dark');
  }, [lightMode]);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/25 ring-2 ring-amber-400/60 border-2 border-amber-500/60 shrink-0 p-1">
              <img src={schoolLogo} alt="شعار مدرسة الشمامسة" className="w-full h-full object-cover rounded-lg sm:rounded-2xl" referrerPolicy="no-referrer" />
            </div>
            <div className="min-w-0 flex-1"><div className="flex items-center gap-2 min-w-0"><h1 className="text-base sm:text-2xl lg:text-3xl font-black text-slate-100 tracking-tight truncate">مدرسة تي اتشرومبي للألحان</h1></div><p className="hidden sm:block text-xs sm:text-sm text-slate-400 font-medium truncate">نظام إدارة مدرسة الشمامسة ومتابعة الحضور والخدمة</p></div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto min-w-0">
            <div className="shrink-0"><OfflineSyncIndicator onRefreshData={onRefreshData} /></div>
            <button onClick={() => setLightMode(v => !v)} className="theme-toggle shrink-0 w-10 h-10 rounded-xl transition-colors flex items-center justify-center" title={lightMode ? 'الوضع الغامق' : 'الوضع الفاتح'} aria-label={lightMode ? 'الوضع الغامق' : 'الوضع الفاتح'}>{lightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}</button>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-2.5 sm:px-3 py-1.5 rounded-2xl min-w-0 max-w-[48vw] sm:max-w-none"><div className="p-1 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">{session.role === 'admin' ? <Shield className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}</div><div className="text-right min-w-0"><span className="block text-xs font-bold text-slate-200 max-w-[110px] sm:max-w-[160px] truncate">{session.fullName || 'مستخدم النظام'}</span><span className="hidden sm:block text-[10px] text-amber-400/90 font-medium truncate">{session.mode === 'student' ? 'بوابة ولي الأمر / الطالب' : session.role === 'admin' ? 'مسؤول النظام (Admin)' : 'خادم مدرسة الشمامسة'}</span></div></div>
            <button onClick={onLogout} className="shrink-0 min-h-[42px] px-3 sm:px-4 py-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-xl sm:rounded-2xl text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap" title="تسجيل الخروج / تبديل الحساب" aria-label="تسجيل الخروج"><LogOut className="w-4 h-4" /><span>تسجيل الخروج</span></button>
          </div>
        </div>
      </div>
    </header>
  );
};
