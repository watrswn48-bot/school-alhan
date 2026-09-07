import { ServantPermissions, ServantRole, UserSession, Servant } from '../types';

export const ALL_SERVANT_PERMISSIONS: (keyof ServantPermissions)[] = [
  'canRecordAttendance',
  'canAddEditStudents',
  'canUploadFiles',
  'canEvaluateLectures',
  'canManageLectures',
  'canManageCurricula',
  'canManageGrades',
  'canWriteNotes',
  'canViewAnalytics',
];

export const PERMISSION_LABELS: Record<string, string> = {
  canRecordAttendance: 'تسجيل الحضور والغياب',
  canAddEditStudents: 'إضافة وتعديل الطلاب',
  canUploadFiles: 'رفع الملفات والمرفقات',
  canEvaluateLectures: 'تقييم المحاضرات والـ 5 نجوم',
  canManageLectures: 'إنشاء وإدارة المحاضرات',
  canManageCurricula: 'إدارة المناهج ومكتبة الألحان',
  canManageGrades: 'رصد وإدارة النتائج',
  canWriteNotes: 'كتابة الملاحظات والسلوك',
  canViewAnalytics: 'عرض الإحصائيات والتحليلات',
};

export const ADMIN_PERMISSIONS: ServantPermissions = Object.fromEntries(
  ALL_SERVANT_PERMISSIONS.map((key) => [key, true])
) as ServantPermissions;

export const FAMILY_ADMIN_PERMISSIONS: ServantPermissions = {
  canRecordAttendance: true,
  canUploadFiles: true,
  canEvaluateLectures: true,
};

export const SERVANT_PERMISSIONS: ServantPermissions = {
  canRecordAttendance: true,
};

export function permissionsForRole(role: ServantRole): ServantPermissions {
  if (role === 'admin') return { ...ADMIN_PERMISSIONS };
  if (role === 'family_admin') return { ...FAMILY_ADMIN_PERMISSIONS };
  return { ...SERVANT_PERMISSIONS };
}

export function normalizeServantPermissions(
  role: ServantRole | undefined,
  permissions?: ServantPermissions
): ServantPermissions {
  const base = permissionsForRole(role || 'servant');
  const incoming = permissions || {};
  // New records use the granular fields. Legacy canSetRatings is kept compatible.
  if (incoming.canEvaluateLectures === undefined && incoming.canSetRatings !== undefined) {
    base.canEvaluateLectures = incoming.canSetRatings;
  }
  for (const key of ALL_SERVANT_PERMISSIONS) {
    if (incoming[key] !== undefined) base[key] = incoming[key];
  }
  if (role === 'admin') return { ...ADMIN_PERMISSIONS };
  // Attendance remains enabled for every servant unless explicitly changed by admin.
  if (incoming.canRecordAttendance === undefined) base.canRecordAttendance = true;
  return base;
}

export function normalizeServant(servant: Servant): Servant {
  return {
    ...servant,
    role: servant.role || 'servant',
    permissions: normalizeServantPermissions(servant.role, servant.permissions),
  };
}

export function sessionHasPermission(
  session: UserSession | undefined,
  permission: keyof ServantPermissions
): boolean {
  if (!session?.isLoggedIn || session.mode !== 'servant') return false;
  if (session.role === 'admin' || session.userId === 'srv-admin-01') return true;
  return !!normalizeServantPermissions(session.role, session.permissions)[permission];
}

export function roleLabel(role?: ServantRole): string {
  if (role === 'admin') return 'أبونا / مسؤول النظام';
  if (role === 'family_admin') return 'أمين الأسرة';
  return 'خادم';
}
