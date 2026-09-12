import { ServantPermissions, ServantRole, UserSession, Servant } from '../types';

export const ALL_SERVANT_PERMISSIONS: (keyof ServantPermissions)[] = [
  'canRecordAttendance','canAddEditStudents','canUploadFiles','canEvaluateLectures','canTeachLectures','canManageLectures','canManageCurricula','canManageSubjects','canManageGrades','canManageAcademicYear','canViewAdminPanel','canWriteNotes','canViewAnalytics',
];

export const PERMISSION_LABELS: Record<string, string> = {
  canRecordAttendance: 'تسجيل الحضور والغياب', canAddEditStudents: 'إضافة وتعديل الطلاب', canUploadFiles: 'رفع الملفات والمرفقات', canEvaluateLectures: 'تقييم الطلاب بعد المحاضرات', canTeachLectures: 'السماح باختياره كمحاضر', canManageLectures: 'إنشاء وإدارة المحاضرات', canManageCurricula: 'إدارة المناهج ومكتبة الألحان', canManageSubjects: 'إضافة وإدارة مواد مدرسة الألحان', canManageGrades: 'رصد وإدارة النتائج', canManageAcademicYear: 'إدارة ومراجعة السنة الدراسية', canViewAdminPanel: 'ظهور وفتح لوحة الإدارة', canWriteNotes: 'كتابة الملاحظات والسلوك', canViewAnalytics: 'عرض الإحصائيات والتحليلات',
};

export const ADMIN_PERMISSIONS: ServantPermissions = Object.fromEntries(ALL_SERVANT_PERMISSIONS.map(key => [key, true])) as ServantPermissions;
export const SENIOR_SERVANT_PERMISSIONS: ServantPermissions = { canRecordAttendance: true, canTeachLectures: true, canEvaluateLectures: true, canManageLectures: true };
export const JUNIOR_SERVANT_PERMISSIONS: ServantPermissions = { canRecordAttendance: true };

export function normalizeRole(role?: ServantRole): ServantRole {
  if (role === 'admin') return 'admin';
  if ((role as string) === 'family_admin' || role === 'senior_servant') return 'senior_servant';
  return 'junior_servant';
}

export function permissionsForRole(role: ServantRole): ServantPermissions {
  const actual = normalizeRole(role);
  if (actual === 'admin') return { ...ADMIN_PERMISSIONS };
  if (actual === 'senior_servant') return { ...SENIOR_SERVANT_PERMISSIONS };
  return { ...JUNIOR_SERVANT_PERMISSIONS };
}

export function normalizeServantPermissions(role: ServantRole | undefined, permissions?: ServantPermissions): ServantPermissions {
  const actualRole = normalizeRole(role);
  const base = permissionsForRole(actualRole);
  const incoming = permissions || {};
  for (const key of ALL_SERVANT_PERMISSIONS) {
    if (incoming[key] !== undefined) base[key] = incoming[key];
  }
  if (actualRole === 'admin') return { ...ADMIN_PERMISSIONS };
  if (incoming.canRecordAttendance === undefined) base.canRecordAttendance = true;
  return base;
}

export function normalizeServant(servant: Servant): Servant {
  const role = normalizeRole(servant.role);
  return { ...servant, role, permissions: normalizeServantPermissions(role, servant.permissions) };
}

export function sessionHasPermission(session: UserSession | undefined, permission: keyof ServantPermissions): boolean {
  if (!session?.isLoggedIn || session.mode !== 'servant') return false;
  if (session.role === 'admin' || session.userId === 'srv-admin-01') return true;
  return !!normalizeServantPermissions(session.role, session.permissions)[permission];
}

export function roleLabel(role?: ServantRole): string {
  const actual = normalizeRole(role);
  if (actual === 'admin') return 'أبونا';
  if (actual === 'senior_servant') return 'خادم كبير';
  return 'خادم صغير';
}
