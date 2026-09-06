/**
 * Header & Navigation Bar
 * الشريط العلوي لمنصة الشماس والأكاديمية
 */

import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  LogOut,
  Shield,
} from 'lucide-react';
import { UserSession } from '../types';
import { getSchoolLogo } from '../services/storage';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';

interface NavbarProps {
  session: UserSession;
  onLogout: () => void;
  onRefreshData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ session, onLogout, onRefreshData }) => {
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

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 min-h-[5rem] sm:min-h-[5.75rem] flex items-center justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/25 ring-2 ring-amber-400/60 border-2 border-amber-500/60 shrink-0 p-1 transition-transform hover:scale-105 duration-200">
              <img
                src={schoolLogo}
                alt="شعار مدرسة الشمامسة"
                className="w-full h-full object-cover rounded-xl sm:rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-100 tracking-tight">
                  منصة الشماس والأكاديمية
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-black rounded-full">
                  إصدار الأكاديمية
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 hidden xs:block font-medium">
                نظام إدارة مدرسة الشمامسة ومتابعة الحضور والخدمة
              </p>
            </div>
          </div>

          {/* Right Control Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Real-time Cloud Sync & Offline-First Badge */}
            <OfflineSyncIndicator onRefreshData={onRefreshData} />

            {/* User Session Info & Role */}
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-2xl">
              <div className="p-1 bg-amber-500/20 text-amber-400 rounded-xl">
                {session.role === 'admin' ? (
                  <Shield className="w-4 h-4" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold text-slate-200 max-w-[120px] sm:max-w-[160px] truncate">
                  {session.fullName || 'مستخدم النظام'}
                </span>
                <span className="block text-[10px] text-amber-400/90 font-medium">
                  {session.mode === 'student'
                    ? 'بوابة ولي الأمر / الطالب'
                    : session.role === 'admin'
                    ? 'مسؤول النظام (Admin)'
                    : 'خادم مدرسة الشمامسة'}
                </span>
              </div>
            </div>

            {/* Logout / Switch Account */}
            <button
              onClick={onLogout}
              className="p-2.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700/80 rounded-2xl text-xs transition-colors cursor-pointer"
              title="تسجيل الخروج / تبديل الحساب"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
