/**
 * Firebase Firestore Cloud Synchronization Service
 * خدمة الربط والمزامنة السحابية الحية مع Firebase Firestore
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Student,
  Servant,
  LiturgyAttendance,
  Lecture,
  LectureAttendance,
  AcademicSubjectResult,
  BehaviorNote,
  CurriculumMaterial,
} from '../types';

// Collection Names
export const COLLECTIONS = {
  STUDENTS: 'students',
  SERVANTS: 'servants',
  LITURGIES: 'liturgies',
  LECTURES: 'lectures',
  LECTURE_ATTENDANCE: 'lecture_attendance',
  SUBJECT_RESULTS: 'subject_results',
  BEHAVIOR_NOTES: 'behavior_notes',
  SYSTEM_SETTINGS: 'system_settings',
  CURRICULA: 'curricula',
};

// Safe helper to strip undefined values which Firestore rejects
export function sanitizeForFirestore<T>(data: T): Record<string, unknown> {
  const json = JSON.stringify(data, (_, value) => {
    return value === undefined ? null : value;
  });
  return JSON.parse(json);
}

// -------------------------------------------------------------
// REAL-TIME FIRESTORE WRITERS
// -------------------------------------------------------------

export async function syncStudentToCloud(student: Student): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.STUDENTS, student.id);
    await setDoc(docRef, sanitizeForFirestore(student), { merge: true });
  } catch (error) {
    console.warn('Firebase student sync error:', error);
  }
}

export async function deleteStudentFromCloud(studentId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.STUDENTS, studentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firebase student delete error:', error);
  }
}

export async function syncServantToCloud(servant: Servant): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SERVANTS, servant.id);
    await setDoc(docRef, sanitizeForFirestore(servant), { merge: true });
  } catch (error) {
    console.warn('Firebase servant sync error:', error);
  }
}

export async function deleteServantFromCloud(servantId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SERVANTS, servantId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firebase servant delete error:', error);
  }
}

export async function syncLiturgyAttendanceToCloud(record: LiturgyAttendance): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.LITURGIES, record.id);
    await setDoc(docRef, sanitizeForFirestore(record), { merge: true });
  } catch (error) {
    console.warn('Firebase liturgy attendance sync error:', error);
  }
}

export async function syncLectureToCloud(lecture: Lecture): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.LECTURES, lecture.id);
    await setDoc(docRef, sanitizeForFirestore(lecture), { merge: true });
  } catch (error) {
    console.warn('Firebase lecture sync error:', error);
  }
}

export async function deleteLectureFromCloud(lectureId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.LECTURES, lectureId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firebase lecture delete error:', error);
  }
}

export async function syncLectureAttendanceToCloud(record: LectureAttendance): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.LECTURE_ATTENDANCE, record.id);
    await setDoc(docRef, sanitizeForFirestore(record), { merge: true });
  } catch (error) {
    console.warn('Firebase lecture attendance sync error:', error);
  }
}

export async function syncSubjectResultToCloud(result: AcademicSubjectResult): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SUBJECT_RESULTS, result.id);
    await setDoc(docRef, sanitizeForFirestore(result), { merge: true });
  } catch (error) {
    console.warn('Firebase subject result sync error:', error);
  }
}

export async function deleteSubjectResultFromCloud(resultId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SUBJECT_RESULTS, resultId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firebase subject result delete error:', error);
  }
}

export async function syncBehaviorNoteToCloud(note: BehaviorNote): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.BEHAVIOR_NOTES, note.id);
    await setDoc(docRef, sanitizeForFirestore(note), { merge: true });
  } catch (error) {
    console.warn('Firebase behavior note sync error:', error);
  }
}

export async function syncAcademicSettingsToCloud(levels: string[], years: string[]): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'academic_structure');
    await setDoc(docRef, {
      levels,
      years,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.warn('Firebase settings sync error:', error);
  }
}

export async function syncCurriculumToCloud(material: CurriculumMaterial): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CURRICULA, material.id);
    await setDoc(docRef, sanitizeForFirestore(material), { merge: true });
  } catch (error) {
    console.warn('Firebase curriculum sync error:', error);
  }
}

export async function deleteCurriculumFromCloud(materialId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.CURRICULA, materialId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('Firebase curriculum delete error:', error);
  }
}

export async function syncSchoolLogoToCloud(logoUrl: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'school_branding');
    await setDoc(docRef, { logoUrl, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.warn('Firebase school logo sync error:', error);
  }
}

// -------------------------------------------------------------
// BULK CLOUD SYNC & PULL HELPERS
// -------------------------------------------------------------

export async function uploadAllLocalDataToFirebase(data: {
  students: Student[];
  servants: Servant[];
  liturgies: LiturgyAttendance[];
  lectures: Lecture[];
  lectureAttendance: LectureAttendance[];
  subjectResults: AcademicSubjectResult[];
  behaviorNotes: BehaviorNote[];
  curricula?: CurriculumMaterial[];
  academicLevels: string[];
  academicYears: string[];
}): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const operations: Array<{ ref: ReturnType<typeof doc>; data: Record<string, unknown> }> = [];

    // Students
    data.students.forEach((s) => {
      operations.push({ ref: doc(db, COLLECTIONS.STUDENTS, s.id), data: sanitizeForFirestore(s) });
    });

    // Servants
    data.servants.forEach((srv) => {
      operations.push({ ref: doc(db, COLLECTIONS.SERVANTS, srv.id), data: sanitizeForFirestore(srv) });
    });

    // Liturgies
    data.liturgies.forEach((l) => {
      operations.push({ ref: doc(db, COLLECTIONS.LITURGIES, l.id), data: sanitizeForFirestore(l) });
    });

    // Lectures
    data.lectures.forEach((lec) => {
      operations.push({ ref: doc(db, COLLECTIONS.LECTURES, lec.id), data: sanitizeForFirestore(lec) });
    });

    // Lecture attendance
    data.lectureAttendance.forEach((la) => {
      operations.push({ ref: doc(db, COLLECTIONS.LECTURE_ATTENDANCE, la.id), data: sanitizeForFirestore(la) });
    });

    // Subject results
    data.subjectResults.forEach((sr) => {
      operations.push({ ref: doc(db, COLLECTIONS.SUBJECT_RESULTS, sr.id), data: sanitizeForFirestore(sr) });
    });

    // Behavior notes
    data.behaviorNotes.forEach((bn) => {
      operations.push({ ref: doc(db, COLLECTIONS.BEHAVIOR_NOTES, bn.id), data: sanitizeForFirestore(bn) });
    });

    // Curricula
    if (data.curricula && data.curricula.length > 0) {
      data.curricula.forEach((cur) => {
        operations.push({ ref: doc(db, COLLECTIONS.CURRICULA, cur.id), data: sanitizeForFirestore(cur) });
      });
    }

    // Settings
    operations.push({
      ref: doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'academic_structure'),
      data: {
        levels: data.academicLevels,
        years: data.academicYears,
        updatedAt: new Date().toISOString(),
      },
    });

    // Commit in safe chunks of 350 operations (Firestore limit is 500 per batch)
    const BATCH_SIZE = 350;
    for (let i = 0; i < operations.length; i += BATCH_SIZE) {
      const chunk = operations.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      chunk.forEach((op) => {
        batch.set(op.ref, op.data, { merge: true });
      });
      await batch.commit();
    }

    return { success: true, count: operations.length };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Firebase bulk upload error:', err);
    return { success: false, count: 0, error: errorMsg };
  }
}

export async function fetchAllDataFromFirebase(): Promise<{
  students: Student[];
  servants: Servant[];
  liturgies: LiturgyAttendance[];
  lectures: Lecture[];
  lectureAttendance: LectureAttendance[];
  subjectResults: AcademicSubjectResult[];
  behaviorNotes: BehaviorNote[];
  curricula?: CurriculumMaterial[];
  academicLevels?: string[];
  academicYears?: string[];
  schoolLogo?: string;
} | null> {
  try {
    const [
      studentsSnap,
      servantsSnap,
      liturgiesSnap,
      lecturesSnap,
      lectureAttSnap,
      subjectsSnap,
      notesSnap,
      curriculaSnap,
      settingsSnap,
    ] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.STUDENTS)),
      getDocs(collection(db, COLLECTIONS.SERVANTS)),
      getDocs(collection(db, COLLECTIONS.LITURGIES)),
      getDocs(collection(db, COLLECTIONS.LECTURES)),
      getDocs(collection(db, COLLECTIONS.LECTURE_ATTENDANCE)),
      getDocs(collection(db, COLLECTIONS.SUBJECT_RESULTS)),
      getDocs(collection(db, COLLECTIONS.BEHAVIOR_NOTES)),
      getDocs(collection(db, COLLECTIONS.CURRICULA)),
      getDocs(collection(db, COLLECTIONS.SYSTEM_SETTINGS)),
    ]);

    const students = studentsSnap.docs.map((d) => d.data() as Student);
    const servants = servantsSnap.docs.map((d) => d.data() as Servant);
    const liturgies = liturgiesSnap.docs.map((d) => d.data() as LiturgyAttendance);
    const lectures = lecturesSnap.docs.map((d) => d.data() as Lecture);
    const lectureAttendance = lectureAttSnap.docs.map((d) => d.data() as LectureAttendance);
    const subjectResults = subjectsSnap.docs.map((d) => d.data() as AcademicSubjectResult);
    const behaviorNotes = notesSnap.docs.map((d) => d.data() as BehaviorNote);
    const curricula = curriculaSnap.docs.map((d) => d.data() as CurriculumMaterial);

    let academicLevels: string[] | undefined;
    let academicYears: string[] | undefined;
    let schoolLogo: string | undefined;

    settingsSnap.docs.forEach((docSnap) => {
      if (docSnap.id === 'academic_structure') {
        const data = docSnap.data();
        if (data.levels) academicLevels = data.levels;
        if (data.years) academicYears = data.years;
      } else if (docSnap.id === 'school_branding') {
        const data = docSnap.data();
        if (data.logoUrl) schoolLogo = data.logoUrl;
      }
    });

    return {
      students,
      servants,
      liturgies,
      lectures,
      lectureAttendance,
      subjectResults,
      behaviorNotes,
      curricula,
      academicLevels,
      academicYears,
      schoolLogo,
    };
  } catch (error) {
    console.error('Failed to pull from Firebase:', error);
    return null;
  }
}

// -------------------------------------------------------------
// REAL-TIME LISTENERS
// -------------------------------------------------------------

export function listenToFirebaseUpdates(onUpdate: () => void): () => void {
  const unsubStudents = onSnapshot(collection(db, COLLECTIONS.STUDENTS), () => onUpdate(), (err) => console.warn('Students listener:', err));
  const unsubLiturgies = onSnapshot(collection(db, COLLECTIONS.LITURGIES), () => onUpdate(), (err) => console.warn('Liturgies listener:', err));
  const unsubLectures = onSnapshot(collection(db, COLLECTIONS.LECTURES), () => onUpdate(), (err) => console.warn('Lectures listener:', err));
  const unsubLectureAtt = onSnapshot(collection(db, COLLECTIONS.LECTURE_ATTENDANCE), () => onUpdate(), (err) => console.warn('Lecture Attendance listener:', err));
  const unsubCurricula = onSnapshot(collection(db, COLLECTIONS.CURRICULA), () => onUpdate(), (err) => console.warn('Curricula listener:', err));

  return () => {
    unsubStudents();
    unsubLiturgies();
    unsubLectures();
    unsubLectureAtt();
    unsubCurricula();
  };
}
