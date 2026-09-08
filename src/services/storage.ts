/**
 * Offline-First Storage & Firebase Cloud Sync Engine
 * منصة الشماس والأكاديمية - محرك التخزين والمزامنة السحابية مع Firebase Firestore
 */

import {
  Student,
  Servant,
  LiturgyAttendance,
  Lecture,
  LectureAttendance,
  AcademicSubjectResult,
  BehaviorNote,
  CurriculumMaterial,
  AcademicLevel,
  AcademicYear,
  YearProgress,
  DeaconRank,
} from '../types';

import {
  syncStudentToCloud,
  deleteStudentFromCloud,
  syncServantToCloud,
  deleteServantFromCloud,
  syncLiturgyAttendanceToCloud,
  syncLectureToCloud,
  deleteLectureFromCloud,
  syncLectureAttendanceToCloud,
  syncSubjectResultToCloud,
  deleteSubjectResultFromCloud,
  syncBehaviorNoteToCloud,
  syncAcademicSettingsToCloud,
  syncCurriculumToCloud,
  deleteCurriculumFromCloud,
  uploadAllLocalDataToFirebase,
  fetchAllDataFromFirebase,
  listenToFirebaseUpdates,
} from './firebaseService';

import {
  enqueueMutation,
  initOfflineSyncListeners,
  getSyncStatus,
  getPendingQueue,
  triggerFullSync,
} from './syncQueue';

export { getSyncStatus, triggerFullSync };

import defaultSchoolLogo from '../assets/images/deacon_school_logo_1788727828867.jpg';

// Constants
export const ACADEMIC_LEVELS: AcademicLevel[] = [
  'المستوى الأول',
  'المستوى الثاني',
];

export const ACADEMIC_YEARS: AcademicYear[] = [
  'السنة الأولى',
  'السنة الثانية',
  'السنة الثالثة',
  'السنة الرابعة',
];

export const SCHOOL_LEVELS: string[] = [
  'المرحلة الابتدائية',
  'المرحلة الإعدادية',
  'المرحلة الثانوية',
  'المرحلة الجامعية',
  'خريج / أخرى',
];

export const SCHOOL_YEARS: string[] = [
  'الصف الأول الابتدائي',
  'الصف الثاني الابتدائي',
  'الصف الثالث الابتدائي',
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الصف الأول الثانوي',
  'الصف الثاني الثانوي',
  'الصف الثالث الثانوي',
  'الجامعة - السنة الأولى',
  'الجامعة - السنة الثانية',
  'الجامعة - السنة الثالثة',
  'الجامعة - السنة الرابعة',
  'خريج / أخرى',
];

export const DEACON_RANKS: DeaconRank[] = [
  'بدون رتبة',
  'إبصالتس',
  'أغنسطس',
  'إبذياكون',
];

export const DEFAULT_SUBJECTS: string[] = [
  'الألحان والتسبيحة',
  'اللغة القبطية',
  'الطقس الكنسي',
  'العقيدة واللاهوت',
  'تاريخ الكنيسة والمجامع',
  'دراسات كتابية وعهد جديد',
  'السلوك والروحيات الشماسية',
];

export const EXAM_TYPES: string[] = [
  'امتحان نهائي',
  'تسميع شفوي للألحان',
  'اختبار تحريري',
  'تقييم شهري دوري',
  'امتحان عملي طقسي',
  'امتحان دور ثان',
];

const STORAGE_KEYS = {
  STUDENTS: 'deacon_system_students_v1',
  SERVANTS: 'deacon_system_servants_v1',
  LITURGIES: 'deacon_system_liturgies_v1',
  LECTURES: 'deacon_system_lectures_v1',
  LECTURE_ATTENDANCE: 'deacon_system_lecture_attendance_v1',
  SUBJECT_RESULTS: 'deacon_system_subject_results_v1',
  BEHAVIOR_NOTES: 'deacon_system_behavior_notes_v1',
  SUPABASE_CONFIG: 'deacon_system_supabase_config_v1',
  SESSION: 'deacon_system_session_v1',
  ACADEMIC_LEVELS: 'deacon_system_academic_levels_v1',
  ACADEMIC_YEARS: 'deacon_system_academic_years_v1',
  CURRICULA: 'deacon_system_curricula_v1',
  SCHOOL_LOGO: 'deacon_system_school_logo_v1',
};

export const DEFAULT_SCHOOL_LOGO = defaultSchoolLogo;

export function getSchoolLogo(): string {
  const saved = localStorage.getItem(STORAGE_KEYS.SCHOOL_LOGO);
  if (saved && saved.trim()) return saved;
  return DEFAULT_SCHOOL_LOGO;
}

export function saveSchoolLogo(logoUrl: string) {
  localStorage.setItem(STORAGE_KEYS.SCHOOL_LOGO, logoUrl);
  window.dispatchEvent(new CustomEvent('school_logo_updated', { detail: logoUrl }));
  enqueueMutation('save_school_logo', logoUrl);
}

export function resetSchoolLogo() {
  localStorage.removeItem(STORAGE_KEYS.SCHOOL_LOGO);
  window.dispatchEvent(new CustomEvent('school_logo_updated', { detail: DEFAULT_SCHOOL_LOGO }));
  enqueueMutation('save_school_logo', DEFAULT_SCHOOL_LOGO);
}

// Getters and Savers for dynamic Academic Levels and Years
export function getAcademicLevels(): string[] {
  const saved = localStorage.getItem(STORAGE_KEYS.ACADEMIC_LEVELS);
  if (saved !== null) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        // If saved contains legacy 4-stage levels, update to new default 2 levels
        if (parsed.includes('المرحلة الابتدائية') || parsed.includes('المرحلة الجامعية والخريجين')) {
          saveAcademicLevels(ACADEMIC_LEVELS);
          return ACADEMIC_LEVELS;
        }
        return parsed;
      }
    } catch {
      // fallback
    }
  }
  return ACADEMIC_LEVELS;
}

export function saveAcademicLevels(levels: string[]) {
  localStorage.setItem(STORAGE_KEYS.ACADEMIC_LEVELS, JSON.stringify(levels));
  enqueueMutation('save_academic_settings', { levels, years: getAcademicYears() });
}

export function deleteAllAcademicLevels() {
  saveAcademicLevels([]);
}

export function getAcademicYears(): string[] {
  const saved = localStorage.getItem(STORAGE_KEYS.ACADEMIC_YEARS);
  if (saved !== null) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fallback
    }
  }
  return ACADEMIC_YEARS;
}

export function saveAcademicYears(years: string[]) {
  localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(years));
  enqueueMutation('save_academic_settings', { levels: getAcademicLevels(), years });
}

export function deleteAllAcademicYears() {
  saveAcademicYears([]);
}

export function renameAcademicLevel(oldName: string, newName: string) {
  const levels = getAcademicLevels();
  const idx = levels.indexOf(oldName);
  if (idx >= 0 && newName.trim()) {
    levels[idx] = newName.trim();
    saveAcademicLevels(levels);

    // Update existing student records
    const students = getStudents(true);
    let updated = false;
    students.forEach((s) => {
      if (s.level === oldName) {
        s.level = newName.trim();
        updated = true;
      }
      if (s.history) {
        s.history.forEach((h) => {
          if (h.levelName === oldName) {
            h.levelName = newName.trim();
            updated = true;
          }
        });
      }
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    }
  }
}

export function renameAcademicYear(oldName: string, newName: string) {
  const years = getAcademicYears();
  const idx = years.indexOf(oldName);
  if (idx >= 0 && newName.trim()) {
    years[idx] = newName.trim();
    saveAcademicYears(years);

    // Update existing student records
    const students = getStudents(true);
    let updated = false;
    students.forEach((s) => {
      if (s.year === oldName) {
        s.year = newName.trim();
        updated = true;
      }
      if (s.history) {
        s.history.forEach((h) => {
          if (h.yearName === oldName) {
            h.yearName = newName.trim();
            updated = true;
          }
        });
      }
    });
    if (updated) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    }
  }
}

export function addAcademicLevel(levelName: string) {
  const levels = getAcademicLevels();
  if (levelName.trim() && !levels.includes(levelName.trim())) {
    levels.push(levelName.trim());
    saveAcademicLevels(levels);
  }
}

export function deleteAcademicLevel(levelName: string) {
  const levels = getAcademicLevels().filter((l) => l !== levelName);
  saveAcademicLevels(levels);
}

export function addAcademicYear(yearName: string) {
  const years = getAcademicYears();
  if (yearName.trim() && !years.includes(yearName.trim())) {
    years.push(yearName.trim());
    saveAcademicYears(years);
  }
}

export function deleteAcademicYear(yearName: string) {
  const years = getAcademicYears().filter((y) => y !== yearName);
  saveAcademicYears(years);
}

// Helper to apply cloud state into localStorage without clobbering pending offline edits
export function applyCloudDataToLocal(cloudData: any, onDataUpdated?: () => void) {
  if (!cloudData) return;
  const pendingQueue = getPendingQueue();
  const pendingEntityIds = new Set<string>();
  pendingQueue.forEach((m) => {
    if (m.payload && m.payload.id) pendingEntityIds.add(m.payload.id);
  });

  if (cloudData.students && Array.isArray(cloudData.students) && cloudData.students.length > 0) {
    const currentStudents = getStudents(true);
    const mergedMap = new Map<string, Student>();
    cloudData.students.forEach((s: Student) => mergedMap.set(s.id, s));
    // If local student has pending offline edits, keep local
    currentStudents.forEach((s) => {
      if (pendingEntityIds.has(s.id)) {
        mergedMap.set(s.id, s);
      }
    });
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(Array.from(mergedMap.values())));
  }

  if (cloudData.servants && cloudData.servants.length > 0) {
    localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(cloudData.servants));
  }
  if (cloudData.liturgies && cloudData.liturgies.length > 0) {
    localStorage.setItem(STORAGE_KEYS.LITURGIES, JSON.stringify(cloudData.liturgies));
  }
  if (cloudData.lectures && cloudData.lectures.length > 0) {
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(cloudData.lectures));
  }
  if (cloudData.lectureAttendance && cloudData.lectureAttendance.length > 0) {
    localStorage.setItem(STORAGE_KEYS.LECTURE_ATTENDANCE, JSON.stringify(cloudData.lectureAttendance));
  }
  if (cloudData.subjectResults && cloudData.subjectResults.length > 0) {
    localStorage.setItem(STORAGE_KEYS.SUBJECT_RESULTS, JSON.stringify(cloudData.subjectResults));
  }
  if (cloudData.behaviorNotes && cloudData.behaviorNotes.length > 0) {
    localStorage.setItem(STORAGE_KEYS.BEHAVIOR_NOTES, JSON.stringify(cloudData.behaviorNotes));
  }
  if (cloudData.curricula && cloudData.curricula.length > 0) {
    localStorage.setItem(STORAGE_KEYS.CURRICULA, JSON.stringify(cloudData.curricula));
  }
  if (cloudData.academicLevels && cloudData.academicLevels.length > 0) {
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_LEVELS, JSON.stringify(cloudData.academicLevels));
  }
  if (cloudData.academicYears && cloudData.academicYears.length > 0) {
    localStorage.setItem(STORAGE_KEYS.ACADEMIC_YEARS, JSON.stringify(cloudData.academicYears));
  }
  if (cloudData.schoolLogo && cloudData.schoolLogo.trim()) {
    localStorage.setItem(STORAGE_KEYS.SCHOOL_LOGO, cloudData.schoolLogo);
    window.dispatchEvent(new CustomEvent('school_logo_updated', { detail: cloudData.schoolLogo }));
  }

  if (onDataUpdated) onDataUpdated();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('deacon_data_updated', { detail: { source: 'cloud_sync' } }));
  }
}

// Initializer
export function migratePriestName() {
  const raw = localStorage.getItem(STORAGE_KEYS.SERVANTS);
  if (!raw) return;
  try {
    const servants: Servant[] = JSON.parse(raw);
    let changed = false;
    servants.forEach((servant) => {
      if (servant.id === 'srv-admin-01' && servant.fullName !== 'أبونا فيلبس ميلاد') {
        servant.fullName = 'أبونا فيلبس ميلاد';
        changed = true;
      }
    });
    if (changed) {
      localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(servants));
      const admin = servants.find((servant) => servant.id === 'srv-admin-01');
      if (admin) enqueueMutation('save_servant', admin);
    }
  } catch {
    // Ignore malformed legacy servant data.
  }
}

export async function initStorage(onDataUpdated?: () => void) {
  migratePriestName();
  migratePriestName();
  migratePriestName();
  migratePriestName();
  migratePriestName();
  migratePriestName();
  migratePriestName();
  // Check if students exist locally, if not seed initial dataset
  const existingStudents = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (!existingStudents) {
    seedInitialData();
    // Automatically push seeded initial data to Firebase so Firestore has all records
    syncAllToFirebase().catch((err) => console.warn('Initial cloud seed sync:', err));
  }

  const existingCurricula = localStorage.getItem(STORAGE_KEYS.CURRICULA);
  if (!existingCurricula) {
    seedInitialCurricula();
  }

  // Initialize offline network listeners & automatic sync when reconnecting to network
  initOfflineSyncListeners((cloudData) => {
    applyCloudDataToLocal(cloudData, onDataUpdated);
  });

  // Check and perform immediate pull from Firebase if online
  if (typeof navigator === 'undefined' || navigator.onLine) {
    try {
      const cloudData = await fetchAllDataFromFirebase();
      if (cloudData && cloudData.students && cloudData.students.length > 0) {
        applyCloudDataToLocal(cloudData, onDataUpdated);
      }
    } catch (err) {
      console.warn('Initial cloud pull note:', err);
    }
  }

  // Set up real-time listener from Firebase Firestore
  try {
    listenToFirebaseUpdates(async () => {
      console.log('Firebase remote update detected, syncing...');
      const cloudData = await fetchAllDataFromFirebase();
      if (cloudData) {
        applyCloudDataToLocal(cloudData, onDataUpdated);
      }
    });
  } catch (err) {
    console.warn('Real-time listener setup note:', err);
  }
}

// Helper: Helper to generate dynamic stage history template
export function createDefaultHistory(currentLevelIdx = 0, currentYearIdx = 0): YearProgress[] {
  const levels = getAcademicLevels();
  const years = getAcademicYears();
  const history: YearProgress[] = [];
  
  for (let l = 0; l < levels.length; l++) {
    for (let y = 0; y < years.length; y++) {
      let status: YearProgress['status'] = 'future';
      if (l < currentLevelIdx || (l === currentLevelIdx && y < currentYearIdx)) {
        status = 'passed';
      } else if (l === currentLevelIdx && y === currentYearIdx) {
        status = 'active';
      } else {
        status = 'future';
      }

      history.push({
        levelIndex: l,
        yearIndex: y,
        levelName: levels[l] || `مستوى ${l + 1}`,
        yearName: years[y] || `سنة ${y + 1}`,
        status,
        liturgyAttendanceRate: status === 'passed' ? Math.floor(80 + Math.random() * 20) : undefined,
        lectureAttendanceRate: status === 'passed' ? Math.floor(75 + Math.random() * 25) : undefined,
        examScore: status === 'passed' ? Math.floor(85 + Math.random() * 15) : undefined,
      });
    }
  }
  return history;
}

// Seed initial data for smooth out-of-the-box usage
function seedInitialData() {
  const initialServants: Servant[] = [
    {
      id: 'srv-admin-01',
      fullName: 'أبونا فيلبس ميلاد',
      phone: '01223344556',
      secretCode: '123456',
      qrCode: 'SRV-ADMIN-01',
      role: 'admin',
      permissions: {
        canAddEditStudents: true,
        canSetRatings: true,
        canWriteNotes: true,
        canViewAnalytics: true,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'srv-02',
      fullName: 'الخادم مينا بولس',
      phone: '01001122334',
      secretCode: '777888',
      qrCode: 'SRV-02',
      role: 'servant',
      permissions: {
        canAddEditStudents: true,
        canSetRatings: true,
        canWriteNotes: true,
        canViewAnalytics: true,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const levels = getAcademicLevels();
  const years = getAcademicYears();

  const sampleNames = [
    { name: 'يوستس سمير لبيب حنا', rank: 'أغنسطس' as DeaconRank, levelIdx: 0, yearIdx: 0, schoolLvl: 'المرحلة الابتدائية', schoolYr: 'الصف الخامس الابتدائي', code: 'STU-2026-001', national: '30201011234561', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { name: 'كيرلس عماد نصيف إبراهيم', rank: 'إبصالتس' as DeaconRank, levelIdx: 0, yearIdx: 1, schoolLvl: 'المرحلة الابتدائية', schoolYr: 'الصف السادس الابتدائي', code: 'STU-2026-002', national: '30201011234562', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { name: 'مارك مجدي شاكر توفيق', rank: 'أغنسطس' as DeaconRank, levelIdx: 0, yearIdx: 2, schoolLvl: 'المرحلة الإعدادية', schoolYr: 'الصف الأول الإعدادي', code: 'STU-2026-003', national: '30201011234563', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { name: 'أنطونيوس سامح كامل رزق', rank: 'إبذياكون' as DeaconRank, levelIdx: 1, yearIdx: 0, schoolLvl: 'المرحلة الإعدادية', schoolYr: 'الصف الثالث الإعدادي', code: 'STU-2026-004', national: '30201011234564', photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80' },
    { name: 'بيشوي عاطف وهبة بشاي', rank: 'إبصالتس' as DeaconRank, levelIdx: 0, yearIdx: 0, schoolLvl: 'المرحلة الابتدائية', schoolYr: 'الصف الرابع الابتدائي', code: 'STU-2026-005', national: '30201011234565', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
    { name: 'جورج رفيق فهمي خليل', rank: 'عريف' as DeaconRank, levelIdx: 1, yearIdx: 1, schoolLvl: 'المرحلة الثانوية', schoolYr: 'الصف الثاني الثانوي', code: 'STU-2026-006', national: '30201011234566', photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { name: 'بولس ناصر صبحي متى', rank: 'دياكون' as DeaconRank, levelIdx: 1, yearIdx: 3, schoolLvl: 'المرحلة الجامعية', schoolYr: 'الجامعة - السنة الثانية', code: 'STU-2026-007', national: '30201011234567', photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80' },
    { name: 'يوحنا مدحت صادق فرج', rank: 'لم يشرس' as DeaconRank, levelIdx: 0, yearIdx: 1, schoolLvl: 'المرحلة الابتدائية', schoolYr: 'الصف الخامس الابتدائي', code: 'STU-2026-008', national: '30201011234568', photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  ];

  const initialStudents: Student[] = sampleNames.map((s, idx) => ({
    id: `stu-${idx + 1}`,
    studentCode: s.code,
    nationalId: s.national,
    fullName: s.name,
    photoUrl: s.photo,
    deaconRank: s.rank,
    ordinationDate: '2022-11-14',
    level: levels[s.levelIdx] || 'المستوى الأول',
    year: years[s.yearIdx] || 'السنة الأولى',
    levelIndex: s.levelIdx,
    yearIndex: s.yearIdx,
    schoolLevel: s.schoolLvl,
    schoolYear: s.schoolYr,
    phone: `0128000000${idx + 1}`,
    guardianPhone: `0109000000${idx + 1}`,
    notes: 'طالب منتظم ومتميز في خورس الشمامسة وحفظ الألحان',
    isDeleted: false,
    createdAt: new Date().toISOString(),
    history: createDefaultHistory(s.levelIdx, s.yearIdx),
  }));

  const initialLectures: Lecture[] = [
    {
      id: 'lec-01',
      title: 'محاضرة ألحان صوم العذراء مريم وتسبحة الكهكيات',
      speaker: 'الدياكون ميخائيل فتحي',
      levelName: 'المرحلة الإعدادية',
      dateStr: new Date().toISOString().split('T')[0],
      timeStr: '06:00 PM',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'أبونا فيلبس ميلاد',
    },
    {
      id: 'lec-02',
      title: 'تاريخ الكنيسة ومجامع المسكونية الثلاثة',
      speaker: 'الأستاذ توفيق شاكر',
      levelName: 'المرحلة الثانوية',
      dateStr: new Date().toISOString().split('T')[0],
      timeStr: '07:30 PM',
      status: 'active',
      createdAt: new Date().toISOString(),
      createdBy: 'أبونا فيلبس ميلاد',
    },
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const initialLiturgies: LiturgyAttendance[] = [
    {
      id: 'lit-01',
      studentId: 'stu-1',
      studentCode: 'STU-2026-001',
      studentName: 'يوستس سمير لبيب حنا',
      studentRank: 'أغنسطس',
      timestamp: new Date().toISOString(),
      dateStr: todayStr,
      timeStr: '06:42:15 AM',
      recordedBy: 'srv-admin-01',
      recordedByName: 'أبونا فيلبس ميلاد',
    },
    {
      id: 'lit-02',
      studentId: 'stu-2',
      studentCode: 'STU-2026-002',
      studentName: 'كيرلس عماد نصيف إبراهيم',
      studentRank: 'إبصالتس',
      timestamp: new Date().toISOString(),
      dateStr: todayStr,
      timeStr: '06:50:04 AM',
      recordedBy: 'srv-admin-01',
      recordedByName: 'أبونا فيلبس ميلاد',
    },
  ];

  const initialGrades: AcademicSubjectResult[] = [];
  initialStudents.forEach((stu) => {
    ['الألحان والتسبيحة', 'اللغة القبطية', 'الطقس الكنسي', 'العقيدة والتاريخ'].forEach((subj, idx) => {
      initialGrades.push({
        id: `res-${stu.id}-${idx}`,
        studentId: stu.id,
        levelIndex: stu.levelIndex,
        yearIndex: stu.yearIndex,
        subjectName: subj,
        score: Math.floor(82 + Math.random() * 18),
        maxScore: 100,
        isApproved: true,
        updatedBy: 'أبونا فيلبس ميلاد',
        updatedAt: new Date().toISOString(),
      });
    });
  });

  const initialBehaviorNotes: BehaviorNote[] = [
    {
      id: 'note-01',
      studentId: 'stu-1',
      levelIndex: 1,
      yearIndex: 1,
      noteText: 'مواظب جداً على الحضور ومشاركة إخوته في خورس الشمامسة بكل محبة وتواضع.',
      category: 'إيجابي',
      authorId: 'srv-02',
      authorName: 'الخادم مينا بولس',
      createdAt: new Date().toISOString(),
    },
  ];

  localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(initialServants));
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
  localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(initialLectures));
  localStorage.setItem(STORAGE_KEYS.LITURGIES, JSON.stringify(initialLiturgies));
  localStorage.setItem(STORAGE_KEYS.LECTURE_ATTENDANCE, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SUBJECT_RESULTS, JSON.stringify(initialGrades));
  localStorage.setItem(STORAGE_KEYS.BEHAVIOR_NOTES, JSON.stringify(initialBehaviorNotes));
}

// STUDENTS MANAGEMENT
export function getStudents(includeDeleted = false): Student[] {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (!data) return [];
  try {
    const list: Student[] = JSON.parse(data);
    return includeDeleted ? list : list.filter((s) => !s.isDeleted);
  } catch {
    return [];
  }
}

export function getDeletedStudents(): Student[] {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  if (!data) return [];
  try {
    const list: Student[] = JSON.parse(data);
    return list.filter((s) => s.isDeleted);
  } catch {
    return [];
  }
}

export function saveStudent(studentData: Partial<Student>): Student {
  const list = getStudents(true);
  const requestedCode = (studentData.studentCode || '').trim();
  if (requestedCode) {
    const duplicate = list.find((st) => st.id !== studentData.id && st.studentCode.trim().toLowerCase() === requestedCode.toLowerCase());
    if (duplicate) {
      throw new Error(`كود الطالب مستخدم بالفعل لطالب آخر: ${duplicate.fullName}`);
    }
  }
  let existingIndex = -1;
  if (studentData.id) {
    existingIndex = list.findIndex((s) => s.id === studentData.id);
  }

  let resultStudent: Student;
  if (existingIndex >= 0) {
    const updated: Student = {
      ...list[existingIndex],
      ...studentData,
    };
    list[existingIndex] = updated;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    resultStudent = updated;
  } else {
    // Generate code
    const count = list.length + 1;
    const studentCode = studentData.studentCode || `STU-2026-${String(count).padStart(3, '0')}`;
    const levelIdx = studentData.levelIndex ?? 0;
    const yearIdx = studentData.yearIndex ?? 0;

    const newStudent: Student = {
      id: studentData.id || `stu-${Date.now()}`,
      studentCode,
      nationalId: studentData.nationalId || `3020101${Date.now().toString().slice(-7)}`,
      fullName: studentData.fullName || 'طالب جديد',
      photoUrl: studentData.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      deaconRank: studentData.deaconRank || 'بدون رتبة',
      ordinationDate: studentData.ordinationDate || new Date().toISOString().split('T')[0],
      level: studentData.level || ACADEMIC_LEVELS[levelIdx],
      year: studentData.year || ACADEMIC_YEARS[yearIdx],
      levelIndex: levelIdx,
      yearIndex: yearIdx,
      phone: studentData.phone || '',
      guardianPhone: studentData.guardianPhone || '',
      notes: studentData.notes || '',
      isDeleted: false,
      createdAt: new Date().toISOString(),
      history: studentData.history || createDefaultHistory(levelIdx, yearIdx),
    };
    list.push(newStudent);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    resultStudent = newStudent;
  }

  // Push to Firebase / offline queue
  enqueueMutation('save_student', resultStudent);
  return resultStudent;
}

export function softDeleteStudent(id: string): boolean {
  const list = getStudents(true);
  const idx = list.findIndex((s) => s.id === id);
  if (idx >= 0) {
    list[idx].isDeleted = true;
    list[idx].deletedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    enqueueMutation('save_student', list[idx]);
    return true;
  }
  return false;
}

export function restoreStudent(id: string): boolean {
  const list = getStudents(true);
  const idx = list.findIndex((s) => s.id === id);
  if (idx >= 0) {
    list[idx].isDeleted = false;
    list[idx].deletedAt = undefined;
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
    enqueueMutation('save_student', list[idx]);
    return true;
  }
  return false;
}

export function permanentlyDeleteStudent(id: string): boolean {
  const list = getStudents(true);
  const filtered = list.filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(filtered));
  enqueueMutation('delete_student', id);
  return true;
}

// LITURGY ATTENDANCE
export function getLiturgyAttendances(): LiturgyAttendance[] {
  const data = localStorage.getItem(STORAGE_KEYS.LITURGIES);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function recordLiturgyAttendance(
  student: Student,
  recordedBy: string,
  recordedByName: string
): { success: boolean; message: string; record?: LiturgyAttendance } {
  const list = getLiturgyAttendances();
  const todayStr = new Date().toISOString().split('T')[0];

  // Check if already checked in today
  const existing = list.find((l) => l.studentId === student.id && l.dateStr === todayStr);
  if (existing) {
    return {
      success: false,
      message: `تم تسجيل حضور الطالب ${student.fullName} بالقداس مسبقاً اليوم في تمام ${existing.timeStr}`,
      record: existing,
    };
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  const newRecord: LiturgyAttendance = {
    id: `lit-${Date.now()}`,
    studentId: student.id,
    studentCode: student.studentCode,
    studentName: student.fullName,
    studentRank: student.deaconRank,
    timestamp: now.toISOString(),
    dateStr: todayStr,
    timeStr,
    recordedBy,
    recordedByName,
  };

  list.unshift(newRecord);
  localStorage.setItem(STORAGE_KEYS.LITURGIES, JSON.stringify(list));
  enqueueMutation('save_liturgy', newRecord);

  return {
    success: true,
    message: `تم تسجيل حضور القداس بنجاح للطالب: ${student.fullName}`,
    record: newRecord,
  };
}

// LECTURES & LECTURE ATTENDANCE
export function getLectures(): Lecture[] {
  const data = localStorage.getItem(STORAGE_KEYS.LECTURES);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveLecture(lec: Partial<Lecture>): Lecture {
  const list = getLectures();
  const newLec: Lecture = {
    id: lec.id || `lec-${Date.now()}`,
    title: lec.title || 'محاضرة طقس وألحان',
    speaker: lec.speaker || 'أحد الخدام',
    speakerServantId: lec.speakerServantId,
    levelName: lec.levelName || ACADEMIC_LEVELS[0],
    yearName: lec.yearName,
    dateStr: lec.dateStr || new Date().toISOString().split('T')[0],
    timeStr: lec.timeStr || '07:00 PM',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: lec.createdBy || 'الإدارة',
  };
  list.unshift(newLec);
  localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(list));
  enqueueMutation('save_lecture', newLec);
  return newLec;
}

export function deleteLecture(lectureId: string) {
  const lectures = getLectures().filter((l) => l.id !== lectureId);
  localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
  enqueueMutation('delete_lecture', lectureId);
}

export function closeLectureAndMarkAbsent(lectureId: string): { closedCount: number; lecture?: Lecture } {
  const lectures = getLectures();
  const lecIdx = lectures.findIndex((l) => l.id === lectureId);
  if (lecIdx < 0) return { closedCount: 0 };

  const targetLec = lectures[lecIdx];

  // Find all active students in the target stage or all active students if general
  const targetLevel = targetLec.levelName;
  const allStudents = getStudents().filter((s) => !s.isDeleted);
  const targetStudents = allStudents.filter((s) => {
    if (
      !targetLevel ||
      targetLevel === 'جميع المراحل والصفوف' ||
      targetLevel === 'عام' ||
      targetLevel === 'جميع المراحل'
    ) {
      return true;
    }
    return s.level === targetLevel;
  });

  const attendances = getLectureAttendances();
  const recordedStudentIds = new Set(attendances.filter((a) => a.lectureId === lectureId).map((a) => a.studentId));

  let absentCount = 0;
  const todayStr = targetLec.dateStr || new Date().toISOString().split('T')[0];

  targetStudents.forEach((stu) => {
    if (!recordedStudentIds.has(stu.id)) {
      const absentRec: LectureAttendance = {
        id: `lec-att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${stu.id}`,
        lectureId,
        lectureTitle: targetLec.title,
        studentId: stu.id,
        studentCode: stu.studentCode,
        studentName: stu.fullName,
        status: 'absent',
        timestamp: new Date().toISOString(),
        dateStr: todayStr,
        recordedBy: 'system-auto-close',
        recordedByName: 'النظام الآلي (إغلاق المحاضرة)',
      };
      attendances.push(absentRec);
      syncLectureAttendanceToCloud(absentRec);
      absentCount++;
    }
  });

  localStorage.setItem(STORAGE_KEYS.LECTURE_ATTENDANCE, JSON.stringify(attendances));

  // Mark the closed lecture status as 'elapsed'
  lectures[lecIdx].status = 'elapsed';
  localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
  enqueueMutation('save_lecture', lectures[lecIdx]);

  return { closedCount: absentCount, lecture: targetLec };
}

export function getLectureAttendances(): LectureAttendance[] {
  const data = localStorage.getItem(STORAGE_KEYS.LECTURE_ATTENDANCE);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function recordLectureAttendance(
  lectureId: string,
  student: Student,
  status: 'committed' | 'late',
  lateMinutes: number | undefined,
  recordedBy: string,
  recordedByName: string
): { success: boolean; message: string; record?: LectureAttendance } {
  const list = getLectureAttendances();
  const existingIdx = list.findIndex((a) => a.lectureId === lectureId && a.studentId === student.id);

  const todayStr = new Date().toISOString().split('T')[0];
  const lectureObj = getLectures().find((l) => l.id === lectureId);
  const lectureTitle = lectureObj?.title || 'محاضرة طقس وألحان';

  if (existingIdx >= 0) {
    // update
    list[existingIdx].status = status;
    list[existingIdx].lateMinutes = lateMinutes;
    list[existingIdx].lectureTitle = lectureTitle;
    list[existingIdx].timestamp = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.LECTURE_ATTENDANCE, JSON.stringify(list));
    enqueueMutation('save_lecture_attendance', list[existingIdx]);
    return {
      success: true,
      message: `تم تحديث حالة حضور المحاضرة للطالب ${student.fullName}`,
      record: list[existingIdx],
    };
  }

  const record: LectureAttendance = {
    id: `lec-att-${Date.now()}`,
    lectureId,
    lectureTitle,
    studentId: student.id,
    studentCode: student.studentCode,
    studentName: student.fullName,
    status,
    lateMinutes,
    rating: 5, // default 5 stars
    timestamp: new Date().toISOString(),
    dateStr: todayStr,
    recordedBy,
    recordedByName,
  };

  list.unshift(record);
  localStorage.setItem(STORAGE_KEYS.LECTURE_ATTENDANCE, JSON.stringify(list));
  enqueueMutation('save_lecture_attendance', record);
  return {
    success: true,
    message: `تم تسجيل حضور المحاضرة بنجاح للطالب ${student.fullName}`,
    record,
  };
}

export function updateLectureRating(attendanceId: string, rating: number): { success: boolean; message?: string } {
  const list = getLectureAttendances();
  const idx = list.findIndex((a) => a.id === attendanceId);
  if (idx >= 0) {
    if (list[idx].isEvaluationLocked) {
      return { success: false, message: 'عفواً، تم إغلاق التقييم واعتتماده نهائياً ولا يمكن تعديله.' };
    }
    list[idx].rating = rating;
    localStorage.setItem(STORAGE_KEYS.LECTURE_ATTENDANCE, JSON.stringify(list));
    enqueueMutation('save_lecture_attendance', list[idx]);
    return { success: true };
  }
  return { success: false };
}

export function saveLectureEvaluation(
  lectureId: string,
  evaluations: { attendanceId: string; rating: number; note?: string }[],
  evaluatorName: string
): { success: boolean; message: string } {
  const lectures = getLectures();
  const lecIdx = lectures.findIndex((l) => l.id === lectureId);
  if (lecIdx >= 0) {
    lectures[lecIdx].isEvaluated = true;
    lectures[lecIdx].evaluatedAt = new Date().toISOString();
    lectures[lecIdx].evaluatedByName = evaluatorName;
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    enqueueMutation('save_lecture', lectures[lecIdx]);
  }

  const list = getLectureAttendances();
  evaluations.forEach((item) => {
    const idx = list.findIndex((a) => a.id === item.attendanceId);
    if (idx >= 0) {
      list[idx].rating = item.rating;
      if (item.note !== undefined) {
        list[idx].evaluationNote = item.note;
      }
      list[idx].isEvaluationLocked = true;
      enqueueMutation('save_lecture_attendance', list[idx]);
    }
  });

  localStorage.setItem(STORAGE_KEYS.LECTURE_ATTENDANCE, JSON.stringify(list));
  return { success: true, message: 'تم حفظ واعتماد تقييمات الطلاب نهائياً وقفلها بنجاح.' };
}

// SERVANTS & PERMISSIONS
export function getServants(): Servant[] {
  const data = localStorage.getItem(STORAGE_KEYS.SERVANTS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveServant(servant: Partial<Servant>): Servant {
  const list = getServants();
  let existingIdx = -1;
  if (servant.id) {
    existingIdx = list.findIndex((s) => s.id === servant.id);
  }

  let resultServant: Servant;
  if (existingIdx >= 0) {
    const updated = { ...list[existingIdx], ...servant };
    list[existingIdx] = updated;
    localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(list));
    resultServant = updated;
  } else {
    const newServant: Servant = {
      id: servant.id || `srv-${Date.now()}`,
      fullName: servant.fullName || 'خادم جديد',
      phone: servant.phone || '',
      secretCode: servant.secretCode || String(Math.floor(100000 + Math.random() * 900000)),
      qrCode: servant.qrCode || `SRV-${Date.now().toString().slice(-4)}`,
      role: servant.role || 'junior_servant',
      permissions: servant.permissions || {
        canRecordAttendance: true,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    list.push(newServant);
    localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(list));
    resultServant = newServant;
  }
  enqueueMutation('save_servant', resultServant);
  return resultServant;
}

export function deleteServant(id: string) {
  const list = getServants().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(list));
  enqueueMutation('delete_servant', id);
}

// ACADEMIC SUBJECT RESULTS & EXAM GRADING
export function calculateGradeEstimate(score: number, maxScore = 100): {
  percentage: number;
  estimate: string;
  color: string;
  badgeBg: string;
} {
  const max = maxScore > 0 ? maxScore : 100;
  const pct = Math.max(0, Math.min(100, Math.round(((score || 0) / max) * 100)));
  if (pct >= 90) return { percentage: pct, estimate: 'ممتاز مرتفع', color: 'text-amber-400', badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
  if (pct >= 85) return { percentage: pct, estimate: 'ممتاز', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  if (pct >= 75) return { percentage: pct, estimate: 'جيد جداً', color: 'text-teal-400', badgeBg: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
  if (pct >= 65) return { percentage: pct, estimate: 'جيد', color: 'text-blue-400', badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
  if (pct >= 50) return { percentage: pct, estimate: 'مقبول', color: 'text-yellow-400', badgeBg: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' };
  return { percentage: pct, estimate: 'يحتاج تدريب / دور ثان', color: 'text-rose-400', badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
}

export function getSubjectResults(studentId?: string): AcademicSubjectResult[] {
  const data = localStorage.getItem(STORAGE_KEYS.SUBJECT_RESULTS);
  if (!data) return [];
  try {
    const list: AcademicSubjectResult[] = JSON.parse(data);
    return studentId ? list.filter((r) => r.studentId === studentId) : list;
  } catch {
    return [];
  }
}

export function saveSubjectResult(res: Partial<AcademicSubjectResult>): AcademicSubjectResult {
  const list = getSubjectResults();
  const maxScore = res.maxScore ?? 100;
  const score = res.score ?? 0;
  const est = calculateGradeEstimate(score, maxScore);

  let existingIdx = -1;
  if (res.id) {
    existingIdx = list.findIndex((r) => r.id === res.id);
  }
  if (existingIdx === -1 && res.studentId) {
    existingIdx = list.findIndex(
      (r) =>
        r.studentId === res.studentId &&
        r.levelIndex === res.levelIndex &&
        r.yearIndex === res.yearIndex &&
        r.subjectName === res.subjectName &&
        r.term === (res.term || 'سنوي') &&
        (!res.examType || r.examType === res.examType)
    );
  }

  let finalRes: AcademicSubjectResult;
  if (existingIdx >= 0) {
    finalRes = {
      ...list[existingIdx],
      ...res,
      score,
      maxScore,
      percentage: est.percentage,
      gradeEstimate: res.gradeEstimate || est.estimate,
      updatedAt: new Date().toISOString(),
    };
    list[existingIdx] = finalRes;
  } else {
    finalRes = {
      id: res.id || `res-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentId: res.studentId || '',
      studentCode: res.studentCode,
      studentName: res.studentName,
      levelIndex: res.levelIndex ?? 0,
      yearIndex: res.yearIndex ?? 0,
      levelName: res.levelName,
      yearName: res.yearName,
      subjectName: res.subjectName || 'الألحان والتسبيحة',
      examType: res.examType || 'امتحان نهائي',
      term: res.term || 'سنوي',
      score,
      maxScore,
      percentage: est.percentage,
      gradeEstimate: res.gradeEstimate || est.estimate,
      notes: res.notes || '',
      isApproved: res.isApproved ?? true,
      updatedBy: res.updatedBy || 'الإدارة',
      updatedAt: new Date().toISOString(),
    };
    list.push(finalRes);
  }

  localStorage.setItem(STORAGE_KEYS.SUBJECT_RESULTS, JSON.stringify(list));
  enqueueMutation('save_subject_result', finalRes);
  return finalRes;
}

export function saveBatchSubjectResults(results: Partial<AcademicSubjectResult>[]): { success: boolean; count: number } {
  let count = 0;
  for (const item of results) {
    if (item.studentId && item.subjectName) {
      saveSubjectResult(item);
      count++;
    }
  }
  return { success: true, count };
}

export function deleteSubjectResult(id: string): boolean {
  const list = getSubjectResults();
  const filtered = list.filter((r) => r.id !== id);
  if (filtered.length !== list.length) {
    localStorage.setItem(STORAGE_KEYS.SUBJECT_RESULTS, JSON.stringify(filtered));
    enqueueMutation('delete_subject_result', id);
    return true;
  }
  return false;
}

export function approveAllSubjectResults(levelIndex?: number, yearIndex?: number, subjectName?: string): { success: boolean; count: number } {
  const list = getSubjectResults();
  let count = 0;
  list.forEach((r) => {
    let match = true;
    if (levelIndex !== undefined && r.levelIndex !== levelIndex) match = false;
    if (yearIndex !== undefined && r.yearIndex !== yearIndex) match = false;
    if (subjectName && r.subjectName !== subjectName) match = false;
    if (match && !r.isApproved) {
      r.isApproved = true;
      r.updatedAt = new Date().toISOString();
      enqueueMutation('save_subject_result', r);
      count++;
    }
  });

  if (count > 0) {
    localStorage.setItem(STORAGE_KEYS.SUBJECT_RESULTS, JSON.stringify(list));
  }
  return { success: true, count };
}

// BEHAVIOR NOTES
export function getBehaviorNotes(studentId?: string): BehaviorNote[] {
  const data = localStorage.getItem(STORAGE_KEYS.BEHAVIOR_NOTES);
  if (!data) return [];
  try {
    const list: BehaviorNote[] = JSON.parse(data);
    return studentId ? list.filter((n) => n.studentId === studentId) : list;
  } catch {
    return [];
  }
}

export function addBehaviorNote(note: Partial<BehaviorNote>): BehaviorNote {
  const list = getBehaviorNotes();
  const newNote: BehaviorNote = {
    id: note.id || `note-${Date.now()}`,
    studentId: note.studentId || '',
    levelIndex: note.levelIndex ?? 0,
    yearIndex: note.yearIndex ?? 0,
    noteText: note.noteText || '',
    category: note.category || 'إيجابي',
    authorId: note.authorId || 'admin',
    authorName: note.authorName || 'الإدارة',
    createdAt: new Date().toISOString(),
  };
  list.unshift(newNote);
  localStorage.setItem(STORAGE_KEYS.BEHAVIOR_NOTES, JSON.stringify(list));
  enqueueMutation('save_behavior_note', newNote);
  return newNote;
}

// PROMOTION & PROGRESSION MECHANISM (Module 5)
export function promoteStudentToNextStage(studentId: string): { success: boolean; message: string; updatedStudent?: Student } {
  const students = getStudents(true);
  const idx = students.findIndex((s) => s.id === studentId);
  if (idx < 0) return { success: false, message: 'الطالب غير موجود' };

  const student = students[idx];
  const currentL = student.levelIndex;
  const currentY = student.yearIndex;

  // Calculate next stage indices
  let nextL = currentL;
  let nextY = currentY + 1;

  if (nextY > 3) {
    nextY = 0;
    nextL = currentL + 1;
  }

  if (nextL > 3) {
    return {
      success: false,
      message: 'الطالب أتم بالفعل كافة المراحل الدراسية الـ 16 بالأكاديمية بنجاح وتم تخرجه!',
    };
  }

  // Update current history stage status to 'passed'
  const history = [...student.history];
  const currentStageIdx = history.findIndex((h) => h.levelIndex === currentL && h.yearIndex === currentY);
  if (currentStageIdx >= 0) {
    history[currentStageIdx].status = 'passed';
    history[currentStageIdx].archivedAt = new Date().toISOString();
  }

  // Update next stage status to 'active'
  const nextStageIdx = history.findIndex((h) => h.levelIndex === nextL && h.yearIndex === nextY);
  if (nextStageIdx >= 0) {
    history[nextStageIdx].status = 'active';
  }

  student.levelIndex = nextL;
  student.yearIndex = nextY;
  student.level = ACADEMIC_LEVELS[nextL];
  student.year = ACADEMIC_YEARS[nextY];
  student.history = history;

  students[idx] = student;
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  enqueueMutation('save_student', student);

  return {
    success: true,
    message: `تم ترفيع الطالب ${student.fullName} بنجاح إلى: ${ACADEMIC_LEVELS[nextL]} - ${ACADEMIC_YEARS[nextY]}`,
    updatedStudent: student,
  };
}

// =============================================================
// CURRICULA & STUDY MATERIALS (مناهج الشمامسة والألحان والمذكرات)
// =============================================================

export const INITIAL_CURRICULA: CurriculumMaterial[] = [
  {
    id: 'cur-01',
    title: 'مذكرة حروف اللغة القبطية وقواعد النطق الشماسي',
    subject: 'اللغة القبطية',
    levelName: 'المستوى الأول',
    yearName: 'السنة الأولى',
    materialType: 'pdf',
    fileName: 'coptic_alphabet_and_pronunciation.pdf',
    fileSize: '1.8 MB',
    contentNotes: 'شرح كامل لـ 32 حرفاً قبطياً مع الحركات والقواعد الصوتية، وقواعد نطق حرف الغنغما (Gamma)، والبي والفي والرو والشاي والخاي.',
    uploadedBy: 'أبونا فيلبس ميلاد',
    uploadedById: 'srv-admin-01',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cur-02',
    title: 'تسجيل لحن تين أو أووشت (Tenen Ou-osht) السنوي مع الكلمات',
    subject: 'الألحان والتسبيحة',
    levelName: 'المستوى الأول',
    yearName: 'السنة الأولى',
    materialType: 'audio',
    fileName: 'tenen_ouosht_audio.mp3',
    fileSize: '3.4 MB',
    fileUrl: 'https://ia800301.us.archive.org/15/items/CopticHymnsDeacon/TentenOuosht.mp3',
    contentNotes: 'تين أوأوشت إمفيوت نيم إبشيري : نيم بي إبنيفما إثؤواب : تي اترياس إتجوم إن أوموسيوس.\n\nالمعنى: نسجد للآب والابن والروح القدس، الثالوث الكامل المتساوي في الجوهر.',
    uploadedBy: 'أبونا فيلبس ميلاد',
    uploadedById: 'srv-admin-01',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cur-03',
    title: 'فيديو شرح طقس رفع بخور عشية وباكر وحركات الشماس بالهيكل',
    subject: 'الطقس الكنسي',
    levelName: 'المستوى الأول',
    yearName: 'السنة الثانية',
    materialType: 'video',
    fileUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    contentNotes: 'شرح تفصيلي لدورة البخور الأولى والثانية، ووقفة الشماس أمام باب الهيكل ممسكاً بالشورية، ومردات أوشية المسافرين والراقدين والقرابين.',
    uploadedBy: 'الخادم مينا بولس',
    uploadedById: 'srv-02',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cur-04',
    title: 'لحن أمين تون ثاناتون - تسجيل صوتي ومردات القداس الباسيلي',
    subject: 'الألحان والتسبيحة',
    levelName: 'المستوى الثاني',
    yearName: 'السنة الأولى',
    materialType: 'audio',
    fileName: 'amen_ton_thanaton_hymn.mp3',
    fileSize: '2.9 MB',
    fileUrl: 'https://ia800301.us.archive.org/15/items/CopticHymnsDeacon/AmenTonThanaton.mp3',
    contentNotes: 'آمين آمين آمين بموتك يارب نبشر وبقيامتك المقدسة وصعودك إلى السموات نعترف : نسبحك نباركك نشكرك يارب ونتضرع إليك يا إلهنا.',
    uploadedBy: 'أبونا فيلبس ميلاد',
    uploadedById: 'srv-admin-01',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'cur-05',
    title: 'مذكرة دراسات في قانون الإيمان وتاريخ المجامع المسكونية',
    subject: 'العقيدة والتاريخ',
    levelName: 'لكل المستويات',
    yearName: 'لكل السنوات',
    materialType: 'doc',
    fileName: 'creed_and_councils_study.docx',
    fileSize: '950 KB',
    contentNotes: 'دراسة مبسطة في بنود الإيمان الأرثوذكسي، مجمع نيقية 325م، مجمع القسطنطينية 381م، ومجمع أفسس 431م، ومصطلحات هوموؤوسيوس وطبيعة السيد المسيح الواحدة المتجسدة.',
    uploadedBy: 'أبونا فيلبس ميلاد',
    uploadedById: 'srv-admin-01',
    createdAt: new Date().toISOString(),
  },
];

export function getCurricula(levelName?: string, yearName?: string, subject?: string): CurriculumMaterial[] {
  const data = localStorage.getItem(STORAGE_KEYS.CURRICULA);
  if (!data) {
    seedInitialCurricula();
    const seeded = localStorage.getItem(STORAGE_KEYS.CURRICULA);
    return seeded ? JSON.parse(seeded) : [];
  }
  try {
    let list: CurriculumMaterial[] = JSON.parse(data);
    if (levelName && levelName !== 'all' && levelName !== 'لكل المستويات') {
      list = list.filter((m) => m.levelName === 'لكل المستويات' || m.levelName === levelName);
    }
    if (yearName && yearName !== 'all' && yearName !== 'لكل السنوات') {
      list = list.filter((m) => !m.yearName || m.yearName === 'لكل السنوات' || m.yearName === yearName);
    }
    if (subject && subject !== 'all' && subject !== 'الكل') {
      list = list.filter((m) => m.subject === subject);
    }
    return list;
  } catch {
    return [];
  }
}

export function saveCurriculum(material: Partial<CurriculumMaterial>): CurriculumMaterial {
  const list = getCurricula();
  let existingIdx = -1;
  if (material.id) {
    existingIdx = list.findIndex((m) => m.id === material.id);
  }

  let result: CurriculumMaterial;
  if (existingIdx >= 0) {
    result = { ...list[existingIdx], ...material };
    list[existingIdx] = result;
  } else {
    result = {
      id: material.id || `cur-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: material.title || 'منهج جديد',
      subject: material.subject || 'الألحان والتسبيحة',
      levelName: material.levelName || 'المستوى الأول',
      yearName: material.yearName || 'لكل السنوات',
      materialType: material.materialType || 'pdf',
      fileUrl: material.fileUrl || '',
      fileData: material.fileData || '',
      fileName: material.fileName || '',
      fileSize: material.fileSize || '',
      contentNotes: material.contentNotes || '',
      uploadedBy: material.uploadedBy || 'الإدارة',
      uploadedById: material.uploadedById || 'admin',
      createdAt: material.createdAt || new Date().toISOString(),
    };
    list.unshift(result);
  }

  localStorage.setItem(STORAGE_KEYS.CURRICULA, JSON.stringify(list));
  enqueueMutation('save_curriculum', result);
  return result;
}

export function deleteCurriculum(id: string) {
  const list = getCurricula().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEYS.CURRICULA, JSON.stringify(list));
  enqueueMutation('delete_curriculum', id);
}

export function seedInitialCurricula() {
  localStorage.setItem(STORAGE_KEYS.CURRICULA, JSON.stringify(INITIAL_CURRICULA));
  INITIAL_CURRICULA.forEach((c) => syncCurriculumToCloud(c));
}

// BACKUP & RESTORE UTILITY
export function exportDataJSON(): string {
  const backup = {
    students: getStudents(true),
    servants: getServants(),
    liturgies: getLiturgyAttendances(),
    lectures: getLectures(),
    lectureAttendance: getLectureAttendances(),
    subjectResults: getSubjectResults(),
    behaviorNotes: getBehaviorNotes(),
    curricula: getCurricula(),
    academicLevels: getAcademicLevels(),
    academicYears: getAcademicYears(),
    schoolLogo: getSchoolLogo(),
    exportedAt: new Date().toISOString(),
    version: '1.2',
  };
  return JSON.stringify(backup, null, 2);
}

export function importDataJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.students) localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
    if (data.servants) localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(data.servants));
    if (data.liturgies) localStorage.setItem(STORAGE_KEYS.LITURGIES, JSON.stringify(data.liturgies));
    if (data.lectures) localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(data.lectures));
    if (data.lectureAttendance) localStorage.setItem(STORAGE_KEYS.LECTURE_ATTENDANCE, JSON.stringify(data.lectureAttendance));
    if (data.subjectResults) localStorage.setItem(STORAGE_KEYS.SUBJECT_RESULTS, JSON.stringify(data.subjectResults));
    if (data.behaviorNotes) localStorage.setItem(STORAGE_KEYS.BEHAVIOR_NOTES, JSON.stringify(data.behaviorNotes));
    if (data.curricula) localStorage.setItem(STORAGE_KEYS.CURRICULA, JSON.stringify(data.curricula));
    if (data.academicLevels) saveAcademicLevels(data.academicLevels);
    if (data.academicYears) saveAcademicYears(data.academicYears);
    if (data.schoolLogo) saveSchoolLogo(data.schoolLogo);
    return true;
  } catch (e) {
    console.error('Import JSON error:', e);
    return false;
  }
}

// FIREBASE CLOUD SYNC ACTIONS
export async function syncAllToFirebase(): Promise<{ success: boolean; count: number; error?: string }> {
  return uploadAllLocalDataToFirebase({
    students: getStudents(true),
    servants: getServants(),
    liturgies: getLiturgyAttendances(),
    lectures: getLectures(),
    lectureAttendance: getLectureAttendances(),
    subjectResults: getSubjectResults(),
    behaviorNotes: getBehaviorNotes(),
    curricula: getCurricula(),
    academicLevels: getAcademicLevels(),
    academicYears: getAcademicYears(),
  });
}

export async function pullFromFirebase(): Promise<{ success: boolean; message: string }> {
  try {
    const data = await fetchAllDataFromFirebase();
    if (!data) {
      return { success: false, message: 'تعذر الاتصال بـ Firebase أو جلب البيانات' };
    }

    if (data.students && data.students.length > 0) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(data.students));
    }
    if (data.servants && data.servants.length > 0) {
      localStorage.setItem(STORAGE_KEYS.SERVANTS, JSON.stringify(data.servants));
    }
    if (data.liturgies && data.liturgies.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LITURGIES, JSON.stringify(data.liturgies));
    }
    if (data.lectures && data.lectures.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(data.lectures));
    }
    if (data.lectureAttendance && data.lectureAttendance.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LECTURE_ATTENDANCE, JSON.stringify(data.lectureAttendance));
    }
    if (data.subjectResults && data.subjectResults.length > 0) {
      localStorage.setItem(STORAGE_KEYS.SUBJECT_RESULTS, JSON.stringify(data.subjectResults));
    }
    if (data.behaviorNotes && data.behaviorNotes.length > 0) {
      localStorage.setItem(STORAGE_KEYS.BEHAVIOR_NOTES, JSON.stringify(data.behaviorNotes));
    }
    if (data.curricula && data.curricula.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CURRICULA, JSON.stringify(data.curricula));
    }
    if (data.academicLevels && data.academicLevels.length > 0) {
      saveAcademicLevels(data.academicLevels);
    }
    if (data.academicYears && data.academicYears.length > 0) {
      saveAcademicYears(data.academicYears);
    }

    return { success: true, message: 'تم استرجاع ومزامنة البيانات السحابية من Firebase Firestore بنجاح' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `فشلت المزامنة: ${errorMsg}` };
  }
}
