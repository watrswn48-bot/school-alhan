/**
 * Main Application Shell - Deacon School & Academy Management System
 * منصة الشماس والأكاديمية - نظام إدارة مدرسة الشمامسة
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Church,
  BookOpen,
  BarChart3,
  Sliders,
  ShieldCheck,
  UserCheck,
  Sparkles,
  GraduationCap,
} from 'lucide-react';

import { UserSession, Student } from './types';
import { initStorage, getStudents, getSchoolLogo } from './services/storage';

import { Navbar } from './components/Navbar';
import { LoginModule } from './components/LoginModule';
import { ClassesAndStudentsModule } from './components/ClassesAndStudentsModule';
import { LiturgyAttendanceModule } from './components/LiturgyAttendanceModule';
import { LectureAttendanceModule } from './components/LectureAttendanceModule';
import { AnalyticsModule } from './components/AnalyticsModule';
import { AdminPanelModule } from './components/AdminPanelModule';
import { CurriculaModule } from './components/CurriculaModule';
import { ResultsManagementModule } from './components/ResultsManagementModule';

import { CumulativeProfileModal } from './components/CumulativeProfileModal';
import { PromotionModal } from './components/PromotionModal';
import { SmartIDCardModal } from './components/SmartIDCardModal';

const SchoolBackgroundWatermark: React.FC<{ logo: string }> = ({ logo }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center select-none" aria-hidden="true">
      <div className="w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] lg:w-[850px] lg:h-[850px] max-w-[90vw] max-h-[90vh] rounded-full overflow-hidden opacity-10 border-4 border-amber-400/20 shadow-2xl transition-all duration-700 filter contrast-125">
        <img src={logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.06)_0%,rgba(15,23,42,0)_70%)]" />
    </div>
  );
};

export default function App() {
  const [dataVersion, setDataVersion] = useState(0);
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem('deacon_system_session_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return { isLoggedIn: false, mode: 'servant' };
  });

  const [schoolLogo, setSchoolLogo] = useState<string>(() => getSchoolLogo());

  useEffect(() => {
    const handleLogoUpdate = () => setSchoolLogo(getSchoolLogo());
    window.addEventListener('school_logo_updated', handleLogoUpdate);
    return () => window.removeEventListener('school_logo_updated', handleLogoUpdate);
  }, []);

  useEffect(() => {
    initStorage(() => setDataVersion((v) => v + 1));
  }, []);

  const [activeNavTab, setActiveNavTab] = useState<'class1' | 'class2' | 'class3' | 'class4' | 'class5' | 'class6' | 'admin'>('class1');
  const [studentPortalTab, setStudentPortalTab] = useState<'profile' | 'curricula'>('profile');
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedStudentForPromotion, setSelectedStudentForPromotion] = useState<Student | null>(null);
  const [selectedStudentForIDCard, setSelectedStudentForIDCard] = useState<Student | null>(null);

  useEffect(() => {
    localStorage.setItem('deacon_system_session_v1', JSON.stringify(session));
  }, [session]);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    if (newSession.mode === 'student') {
      const student = getStudents().find((s) => s.id === newSession.userId || s.studentCode === newSession.studentCode);
      if (student) setSelectedStudentForProfile(student);
    }
  };

  const handleLogout = () => {
    setSession({ isLoggedIn: false, mode: 'servant' });
    localStorage.removeItem('deacon_system_session_v1');
    setSelectedStudentForProfile(null);
    setActiveNavTab('class1');
  };

  if (!session.isLoggedIn) return <LoginModule onLoginSuccess={handleLoginSuccess} />;

  if (session.mode === 'student') {
    const student = selectedStudentForProfile || getStudents().find((s) => s.id === session.userId || s.studentCode === session.studentCode);
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 font-['Tajawal'] pb-12 relative overflow-x-hidden">
        <SchoolBackgroundWatermark logo={schoolLogo} />
        <div className="relative z-10">
          <Navbar session={session} onLogout={handleLogout} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30"><UserCheck className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-100">بوابة متابعة الطالب وولي الأمر (قراءة فقط)</h2>
                  <p className="text-xs text-slate-400">عرض سجلات حضور القداسات، المحاضرات، التقييم الـ 5 نجوم، والنتائج الأكاديمية</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleLogout} className="px-4 py-2 bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-bold transition-all">تسجيل الخروج / تبديل الحساب</button>
                {student && <button onClick={() => setSelectedStudentForIDCard(student)} className="px-4 py-2 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 rounded-xl text-xs font-bold transition-all">بطاقة الهوية الذكية</button>}
              </div>
            </div>
            <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex items-center gap-2 overflow-x-auto shadow-inner">
              <button onClick={() => setStudentPortalTab('profile')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${studentPortalTab === 'profile' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}><UserCheck className="w-4 h-4" /><span>سجلي وتدرجي الشماسي التراكمي</span></button>
              <button onClick={() => setStudentPortalTab('curricula')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${studentPortalTab === 'curricula' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}><BookOpen className="w-4 h-4" /><span>مناهج وألحان صفي ({student?.level || 'المناهج'})</span></button>
            </div>
            {student ? (studentPortalTab === 'profile' ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl"><CumulativeProfileModal student={student} isOpen={true} onClose={handleLogout} onLogout={handleLogout} session={session} onGenerateIDCard={(s) => setSelectedStudentForIDCard(s)} /></div>
            ) : (
              <CurriculaModule session={session} studentLevel={student.level} studentYear={student.year} isStudentPortal={true} />
            )) : <div className="p-12 text-center text-slate-400">لم يتم العثور على سجلات هذا الطالب.</div>}
          </main>
        </div>
        <SmartIDCardModal student={selectedStudentForIDCard} isOpen={!!selectedStudentForIDCard} onClose={() => setSelectedStudentForIDCard(null)} />
      </div>
    );
  }

  // The admin tab must remain available for the administrator even if an older
  // saved/cloud servant record lost its role field. The seeded administrator has
  // a stable id, so this fallback restores access without exposing the tab to
  // normal servants.
  const isAdministrator = session.role === 'admin' || session.userId === 'srv-admin-01';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-['Tajawal'] pb-16 selection:bg-amber-500 selection:text-slate-950 relative overflow-x-hidden">
      <SchoolBackgroundWatermark logo={schoolLogo} />
      <div className="relative z-10">
        <Navbar session={session} onLogout={handleLogout} onRefreshData={() => setDataVersion((v) => v + 1)} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <div className="bg-slate-950/90 border border-slate-800 p-2 rounded-3xl shadow-xl flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <button onClick={() => setActiveNavTab('class1')} className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 ${activeNavTab === 'class1' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}><Users className="w-4 h-4" /><span>الخانة 1: الفصول والطلاب</span></button>
              <button onClick={() => setActiveNavTab('class2')} className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 ${activeNavTab === 'class2' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}><Church className="w-4 h-4" /><span>الخانة 2: حضور القداس الإلهي</span></button>
              <button onClick={() => setActiveNavTab('class3')} className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 ${activeNavTab === 'class3' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}><BookOpen className="w-4 h-4" /><span>الخانة 3: حضور المحاضرات</span></button>
              <button onClick={() => setActiveNavTab('class4')} className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 ${activeNavTab === 'class4' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}><BarChart3 className="w-4 h-4" /><span>الخانة 4: الإحصائيات والمصفوفة</span></button>
              <button onClick={() => setActiveNavTab('class5')} className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 ${activeNavTab === 'class5' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}><BookOpen className="w-4 h-4" /><span>الخانة 5: المناهج ومكتبة الألحان</span></button>
              <button onClick={() => setActiveNavTab('class6')} className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 ${activeNavTab === 'class6' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/40' : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'}`}><GraduationCap className="w-4 h-4" /><span>الخانة 6: رصد وإدخال النتائج</span></button>
            </div>

            {isAdministrator && (
              <button onClick={() => setActiveNavTab('admin')} className={`px-4 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${activeNavTab === 'admin' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' : 'bg-slate-900 text-sky-400 hover:bg-slate-800 border border-sky-500/30'}`}>
                <Sliders className="w-4 h-4" />
                <span>لوحة التحكم للإدارة</span>
              </button>
            )}
          </div>

          <div key={dataVersion} className="min-h-[70vh]">
            {activeNavTab === 'class1' && <ClassesAndStudentsModule session={session} onSelectStudentProfile={(stu) => setSelectedStudentForProfile(stu)} onGenerateIDCard={(stu) => setSelectedStudentForIDCard(stu)} />}
            {activeNavTab === 'class2' && <LiturgyAttendanceModule session={session} />}
            {activeNavTab === 'class3' && <LectureAttendanceModule session={session} />}
            {activeNavTab === 'class4' && <AnalyticsModule session={session} onSelectStudentProfile={(stu) => setSelectedStudentForProfile(stu)} />}
            {activeNavTab === 'class5' && <CurriculaModule session={session} />}
            {activeNavTab === 'class6' && <ResultsManagementModule session={session} />}
            {activeNavTab === 'admin' && isAdministrator && <AdminPanelModule session={session} />}
          </div>

          {selectedStudentForProfile && <CumulativeProfileModal student={selectedStudentForProfile} isOpen={!!selectedStudentForProfile} onClose={() => setSelectedStudentForProfile(null)} session={session} onGenerateIDCard={(stu) => setSelectedStudentForIDCard(stu)} onTriggerPromotion={(stu) => setSelectedStudentForPromotion(stu)} />}
          <PromotionModal student={selectedStudentForPromotion} isOpen={!!selectedStudentForPromotion} onClose={() => setSelectedStudentForPromotion(null)} onPromoteSuccess={(updatedStudent) => setSelectedStudentForProfile(updatedStudent)} />
          <SmartIDCardModal student={selectedStudentForIDCard} isOpen={!!selectedStudentForIDCard} onClose={() => setSelectedStudentForIDCard(null)} />
        </main>
      </div>
    </div>
  );
}
