/**
 * Types and Interfaces for Deacon School & Academy Management System
 * منصة الشماس والأكاديمية - نظام إدارة مدرسة الشمامسة
 */

export type DeaconRank = 
  | 'لم يشرس'
  | 'إبصالتس'
  | 'أغنسطس'
  | 'عريف'
  | 'إبذياكون'
  | 'دياكون'
  | 'أرشيدياكون';

export type AcademicLevel = string;

export type AcademicYear = string;

export type YearStatus = 'passed' | 'failed' | 'active' | 'future';

export interface ServantPermissions {
  canAddEditStudents: boolean;
  canSetRatings: boolean;
  canWriteNotes: boolean;
  canViewAnalytics: boolean;
  canManageGrades?: boolean;
}

export interface Servant {
  id: string;
  fullName: string;
  phone: string;
  secretCode: string; // e.g. 123456
  qrCode: string;
  role: 'admin' | 'servant';
  permissions: ServantPermissions;
  isActive: boolean;
  createdAt: string;
}

export interface YearProgress {
  levelIndex: number; // 0 to 3
  yearIndex: number;  // 0 to 3
  levelName: AcademicLevel;
  yearName: AcademicYear;
  status: YearStatus; // 'passed' | 'failed' | 'active' | 'future'
  liturgyAttendanceRate?: number; // percentage e.g. 85
  lectureAttendanceRate?: number; // percentage e.g. 90
  examScore?: number; // out of 100
  notes?: string;
  archivedAt?: string;
}

export interface Student {
  id: string;
  studentCode: string; // e.g. STU-2026-001
  nationalId: string;
  fullName: string; // 4-part name
  photoUrl: string;
  deaconRank: DeaconRank;
  ordinationDate?: string;
  level: AcademicLevel;
  year: AcademicYear;
  levelIndex: number; // 0..1 (المستوى الأول، المستوى الثاني)
  yearIndex: number;  // 0..3 (السنة الأولى، الثانية، الثالثة، الرابعة)
  schoolLevel?: string; // المرحلة الدراسية بالمدرسة
  schoolYear?: string;  // السنة الدراسية بالمدرسة
  phone: string;
  guardianPhone: string;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  history: YearProgress[]; // 16 stages array
}

export interface LiturgyAttendance {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  studentRank: DeaconRank;
  timestamp: string; // ISO string
  dateStr: string;   // YYYY-MM-DD
  timeStr: string;   // e.g. 06:45:12 AM
  recordedBy: string;
  recordedByName: string;
}

export interface Lecture {
  id: string;
  title: string;
  speaker: string;
  levelName: AcademicLevel;
  yearName?: AcademicYear;
  dateStr: string; // YYYY-MM-DD
  timeStr: string;
  status: 'active' | 'elapsed';
  isEvaluated?: boolean;
  evaluatedAt?: string;
  evaluatedBy?: string;
  evaluatedByName?: string;
  createdAt: string;
  createdBy: string;
}

export type LectureAttendanceStatus = 'committed' | 'late' | 'absent';

export interface LectureAttendance {
  id: string;
  lectureId: string;
  lectureTitle?: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  status: LectureAttendanceStatus;
  lateMinutes?: number;
  rating?: number; // 1 to 5 stars
  evaluationNote?: string;
  isEvaluationLocked?: boolean;
  timestamp: string;
  dateStr: string;
  recordedBy: string;
  recordedByName: string;
}

export interface AcademicSubjectResult {
  id: string;
  studentId: string;
  studentCode?: string;
  studentName?: string;
  levelIndex: number;
  yearIndex: number;
  levelName?: string;
  yearName?: string;
  subjectName: string; // e.g. "الألحان والتسبيحة", "اللغة القبطية", "الطقس الكنسي", "العقيدة والتاريخ"
  examType?: string;   // e.g. "امتحان نهائي", "شفوي ألحان", "اختبار تحريري", "تقييم شهري", "دور ثان"
  term?: string;       // e.g. "سنوي", "الترم الأول", "الترم الثاني"
  score: number;       // 0 - 100
  maxScore: number;    // 100
  percentage?: number; // (score / maxScore) * 100
  gradeEstimate?: string; // ممتاز / جيد جداً / جيد / مقبول / يحتاج تدريب / راسب
  notes?: string;      // ملاحظات الممتحن أو التقييم
  isApproved: boolean; // approved by Admin
  updatedBy: string;
  updatedAt: string;
}

export interface BehaviorNote {
  id: string;
  studentId: string;
  levelIndex: number;
  yearIndex: number;
  noteText: string;
  category: 'إيجابي' | 'تنبيه' | 'ملاحظة عامة';
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface UserSession {
  isLoggedIn: boolean;
  mode: 'servant' | 'student';
  role?: 'admin' | 'servant';
  userId?: string; // servantId or studentId
  fullName?: string;
  studentCode?: string;
  permissions?: ServantPermissions;
  deaconRank?: DeaconRank;
}

export interface FirebaseSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncedAt?: string;
  projectId?: string;
  error?: string;
}

export type MaterialType = 'pdf' | 'audio' | 'video' | 'link' | 'image' | 'doc';

export interface CurriculumMaterial {
  id: string;
  title: string;              // عنوان المنهج / الدرس / المذكرة
  subject: string;            // اسم المادة: "الألحان والتسبيحة", "اللغة القبطية", "الطقس الكنسي", "العقيدة والتاريخ", "دراسات كتابية", "طقس القداس", "أخرى"
  levelName: string;          // "المستوى الأول", "المستوى الثاني", أو "لكل المستويات"
  yearName?: string;          // "السنة الأولى", "السنة الثانية", ... أو "لكل السنوات"
  materialType: MaterialType; // pdf, audio, video, link, image, doc
  fileUrl?: string;           // Direct link or YouTube / Google Drive / Soundcloud link
  fileData?: string;          // Base64 Data URL for uploaded files
  fileName?: string;          // Original file name if uploaded
  fileSize?: string;          // File size e.g. "1.5 MB"
  contentNotes?: string;      // كلمات اللحن، نصوص الشرح، ملخص المذكرة
  uploadedBy: string;         // Name of the servant / admin
  uploadedById: string;
  createdAt: string;
}
