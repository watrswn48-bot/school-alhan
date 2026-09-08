/**
 * Types and Interfaces for Deacon School & Academy Management System
 * منصة الشماس والأكاديمية - نظام إدارة مدرسة الشمامسة
 */

export type DeaconRank = 'بدون رتبة' | 'لم يشرس' | 'إبصالتس' | 'أغنسطس' | 'إبذياكون' | 'عريف' | 'دياكون' | 'أرشيدياكون';
export type AcademicLevel = string;
export type AcademicYear = string;
export type YearStatus = 'passed' | 'failed' | 'active' | 'future';

export interface ServantPermissions { canRecordAttendance?: boolean; canAddEditStudents?: boolean; canUploadFiles?: boolean; canSetRatings?: boolean; canEvaluateLectures?: boolean; canTeachLectures?: boolean; canWriteNotes?: boolean; canViewAnalytics?: boolean; canManageLectures?: boolean; canManageCurricula?: boolean; canManageGrades?: boolean; canManageSubjects?: boolean; canManageAcademicYear?: boolean; [key: string]: boolean | undefined; }
export type ServantRole = 'admin' | 'family_admin' | 'senior_servant' | 'junior_servant' | 'servant';
export interface Servant { id: string; fullName: string; phone: string; secretCode: string; qrCode: string; role: ServantRole; permissions: ServantPermissions; isActive: boolean; createdAt: string; }
export interface YearProgress { levelIndex: number; yearIndex: number; levelName: AcademicLevel; yearName: AcademicYear; status: YearStatus; liturgyAttendanceRate?: number; lectureAttendanceRate?: number; examScore?: number; notes?: string; archivedAt?: string; }
export interface AnnualStudentRecord { academicYear: string; schoolLevel?: string; schoolYear?: string; chantLevel: string; chantYear: string; levelIndex: number; yearIndex: number; archivedAt: string; }
export interface Student {
  id: string;
  studentCode: string;
  nationalId: string;
  fullName: string;
  photoUrl: string;
  deaconRank: DeaconRank;
  ordinationDate?: string;
  level: AcademicLevel;
  year: AcademicYear;
  levelIndex: number;
  yearIndex: number;
  schoolLevel?: string;
  schoolYear?: string;
  phone: string;
  guardianPhone: string;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  history: YearProgress[];
  annualHistory?: AnnualStudentRecord[];
  graduationYear?: number;
  graduatedAt?: string;
}

export interface LiturgyAttendance { id: string; studentId: string; studentCode: string; studentName: string; studentRank: DeaconRank; timestamp: string; dateStr: string; timeStr: string; recordedBy: string; recordedByName: string; }
export interface Lecture { id: string; title: string; speaker: string; speakerServantId?: string; levelName: AcademicLevel; yearName?: AcademicYear; dateStr: string; timeStr: string; status: 'active' | 'elapsed'; isEvaluated?: boolean; evaluatedAt?: string; evaluatedBy?: string; evaluatedByName?: string; createdAt: string; createdBy: string; }
export type LectureAttendanceStatus = 'committed' | 'late' | 'absent';
export interface LectureAttendance { id: string; lectureId: string; lectureTitle?: string; studentId: string; studentCode: string; studentName: string; status: LectureAttendanceStatus; lateMinutes?: number; rating?: number; evaluationNote?: string; isEvaluationLocked?: boolean; timestamp: string; dateStr: string; recordedBy: string; recordedByName: string; }
export interface AcademicSubjectResult { id: string; studentId: string; studentCode?: string; studentName?: string; levelIndex: number; yearIndex: number; levelName?: string; yearName?: string; subjectName: string; examType?: string; term?: string; score: number; maxScore: number; percentage?: number; gradeEstimate?: string; notes?: string; isApproved: boolean; updatedBy: string; updatedAt: string; }
export interface BehaviorNote { id: string; studentId: string; levelIndex: number; yearIndex: number; noteText: string; category: 'إيجابي' | 'تنبيه' | 'ملاحظة عامة'; authorId: string; authorName: string; createdAt: string; }
export interface UserSession { isLoggedIn: boolean; mode: 'servant' | 'student'; role?: ServantRole; userId?: string; fullName?: string; studentCode?: string; permissions?: ServantPermissions; deaconRank?: DeaconRank; }
export interface FirebaseSyncStatus { isConnected: boolean; isSyncing: boolean; lastSyncedAt?: string; projectId?: string; error?: string; }
export type MaterialType = 'pdf' | 'audio' | 'video' | 'link' | 'image' | 'doc';
export interface CurriculumMaterial { id: string; title: string; subject: string; levelName: string; yearName?: string; materialType: MaterialType; fileUrl?: string; fileData?: string; fileName?: string; fileSize?: string; contentNotes?: string; uploadedBy: string; uploadedById: string; createdAt: string; }
