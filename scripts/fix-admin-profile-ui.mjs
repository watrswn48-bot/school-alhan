import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s);

// 1) Remove the redundant curriculum tab from the cumulative student profile.
{
  const p = 'src/components/CumulativeProfileModal.tsx';
  let s = read(p);
  s = s.replace("import { CurriculaModule } from './CurriculaModule';\n", '');
  s = s.replace("  const [activeTab, setActiveTab] = useState<'liturgies' | 'lectures' | 'grades' | 'behavior' | 'curricula'>('liturgies');", "  const [activeTab, setActiveTab] = useState<'liturgies' | 'lectures' | 'grades' | 'behavior'>('liturgies');");
  s = s.replace(/\n\s*<button\n\s*onClick=\{\(\) => setActiveTab\('curricula'\)\}[\s\S]*?<\/button>\n\s*<\/div>/m, '\n              </div>');
  // Keep the close button isolated from the header fields.
  s = s.replace(/\{session\.mode !== 'student' && \(\n\s*<button\n\s*onClick=\{onClose\}[\s\S]*?<\/button>\n\s*\)\}/m, `{session.mode !== 'student' && (\n            <button\n              onClick={onClose}\n              className="absolute left-3 top-3 sm:left-5 sm:top-5 z-30 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-700/60 rounded-2xl transition-colors no-print"\n              aria-label="إغلاق الملف الشخصي"\n              title="إغلاق"\n            >\n              <X className="w-5 h-5" />\n            </button>\n          )}`);
  // Profile header action buttons: keep the controls compact and icon-only.
  s = s.replace(/\{\(onLogout \|\| session\.mode === 'student'\) && \([\s\S]*?<\/button>\n\s*\)\}/m, `{(onLogout || session.mode === 'student') && (\n                <button\n                  onClick={onLogout || onClose}\n                  className="w-10 h-10 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 rounded-2xl text-xs font-bold transition-all flex items-center justify-center shadow-sm"\n                  title="تسجيل الخروج من الحساب"\n                  aria-label="تسجيل الخروج"\n                >\n                  <LogOut className="w-4 h-4" />\n                </button>\n              )}`);
  s = s.replace(/className="px-4 py-2\.5 bg-amber-500\/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500\/40 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"\n\s*title="طباعة التقرير التراكمي الشامل للطالب"/m, 'className="w-10 h-10 bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/40 rounded-2xl text-xs font-bold transition-all flex items-center justify-center shadow-sm"\n                title="طباعة التقرير التراكمي الشامل للطالب"\n                aria-label="طباعة التقرير"');
  s = s.replace(/\n\s*طباعة التقرير\n\s*<\/button>/m, '\n              </button>');
  s = s.replace(/className="px-4 py-2\.5 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"/m, 'className="w-10 h-10 bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-400 border border-slate-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-center shadow-sm"');
  s = s.replace(/\n\s*بطاقة الهوية الذكية\n\s*<\/button>/m, '\n              </button>');
  write(p, s);
}

// 2) Add a dedicated permission that only controls whether a servant can see/open Admin.
{
  const p = 'src/types/index.ts';
  let s = read(p);
  s = s.replace('canManageAcademicYear?: boolean; [key: string]', 'canManageAcademicYear?: boolean; canViewAdminPanel?: boolean; [key: string]');
  write(p, s);
}

{
  const p = 'src/services/permissions.ts';
  let s = read(p);
  s = s.replace("'canManageAcademicYear',", "'canManageAcademicYear','canViewAdminPanel',");
  s = s.replace("canManageAcademicYear: 'إدارة ومراجعة السنة الدراسية',", "canManageAcademicYear: 'إدارة ومراجعة السنة الدراسية', canViewAdminPanel: 'ظهور وفتح لوحة الإدارة',");
  write(p, s);
}

// 3) Move إضافة المواد into the Admin panel and allow it there through its normal permission.
{
  const p = 'src/App.tsx';
  let s = read(p);
  s = s.replace(', SubjectsManagementModule', '');
  s = s.replace("  const canSubjects=isAdministrator||sessionHasPermission(session,'canManageSubjects');\n", '');
  s = s.replace("  const isAdministrator=session.role==='admin'||session.userId==='srv-admin-01';", "  const isAdministrator=session.role==='admin'||session.userId==='srv-admin-01';\n  const canOpenAdmin=isAdministrator||sessionHasPermission(session,'canViewAdminPanel');");
  s = s.replace("type NavTab = 'class1'|'class2'|'class3'|'class4'|'class5'|'class6'|'class7'|'class8'|'admin';", "type NavTab = 'class1'|'class2'|'class3'|'class4'|'class5'|'class6'|'class8'|'admin';");
  s = s.replace("{nav('class7',<BookPlus className=\"w-4 h-4\"/>,'إضافة المواد',canSubjects)}", '');
  s = s.replace("{isAdministrator&&nav('admin',<Sliders className=\"w-4 h-4\"/>,'لوحة الإدارة',true)}", "{canOpenAdmin&&nav('admin',<Sliders className=\"w-4 h-4\"/>,'لوحة الإدارة',true)}");
  s = s.replace("{activeNavTab==='class7'&&<Guard allowed={canSubjects}><SubjectsManagementModule session={session}/></Guard>} ", '');
  s = s.replace("{activeNavTab==='admin'&&isAdministrator&&<AdminPanelModule session={session}/>}", "{activeNavTab==='admin'&&<Guard allowed={canOpenAdmin}><AdminPanelModule session={session}/></Guard>}");
  // Remove now-unused icon import if no other usage remains.
  s = s.replace(' BookPlus,', '');
  write(p, s);
}

{
  const p = 'src/components/AdminPanelModule.tsx';
  let s = read(p);
  s = s.replace("import { GraduatesModule } from './GraduatesModule';", "import { GraduatesModule } from './GraduatesModule';\nimport { SubjectsManagementModule } from './SubjectsManagementModule';");
  s = s.replace("useState<'servants' | 'graduates' | 'branding' | 'backup'>('servants')", "useState<'servants' | 'subjects' | 'graduates' | 'branding' | 'backup'>('servants')");
  s = s.replace("if (session.role !== 'admin' && session.userId !== 'srv-admin-01')", "if (session.role !== 'admin' && session.userId !== 'srv-admin-01' && !session.permissions?.canViewAdminPanel)");
  s = s.replace("{([['servants','إدارة الخدام والصلاحيات'],['graduates','الخريجون']", "{([['servants','إدارة الخدام والصلاحيات'],['subjects','إضافة المواد'],['graduates','الخريجون']");
  s = s.replace("{activeAdminTab==='graduates' && <GraduatesModule session={session} />}", "{activeAdminTab==='subjects' && <SubjectsManagementModule session={session} />}\n    {activeAdminTab==='graduates' && <GraduatesModule session={session} />}");
  write(p, s);
}

console.log('Admin/profile UI patch applied: profile cleanup, icon-only header actions, admin visibility permission, and subjects moved into Admin.');
