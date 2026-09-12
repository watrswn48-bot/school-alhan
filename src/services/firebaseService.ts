import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db, authReady } from '../lib/firebase';
import { Student, Servant, LiturgyAttendance, Lecture, LectureAttendance, AcademicSubjectResult, BehaviorNote, CurriculumMaterial } from '../types';

export const COLLECTIONS = {
  STUDENTS: 'students', SERVANTS: 'servants', LITURGIES: 'liturgies', LECTURES: 'lectures',
  LECTURE_ATTENDANCE: 'lecture_attendance', SUBJECT_RESULTS: 'subject_results',
  BEHAVIOR_NOTES: 'behavior_notes', SYSTEM_SETTINGS: 'system_settings', CURRICULA: 'curricula',
};

export function sanitizeForFirestore<T>(data: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data, (_, value) => value === undefined ? null : value));
}

async function ready() { await authReady; }

export async function syncStudentToCloud(student: Student): Promise<void> { await ready(); await setDoc(doc(db, COLLECTIONS.STUDENTS, student.id), sanitizeForFirestore(student), { merge: true }); }
export async function deleteStudentFromCloud(id: string): Promise<void> { await ready(); await deleteDoc(doc(db, COLLECTIONS.STUDENTS, id)); }
export async function syncServantToCloud(servant: Servant): Promise<void> { await ready(); await setDoc(doc(db, COLLECTIONS.SERVANTS, servant.id), sanitizeForFirestore(servant), { merge: true }); }
export async function deleteServantFromCloud(id: string): Promise<void> { await ready(); await deleteDoc(doc(db, COLLECTIONS.SERVANTS, id)); }
export async function syncLiturgyAttendanceToCloud(record: LiturgyAttendance): Promise<void> { await ready(); await setDoc(doc(db, COLLECTIONS.LITURGIES, record.id), sanitizeForFirestore(record), { merge: true }); }
export async function syncLectureToCloud(lecture: Lecture): Promise<void> { await ready(); await setDoc(doc(db, COLLECTIONS.LECTURES, lecture.id), sanitizeForFirestore(lecture), { merge: true }); }
export async function deleteLectureFromCloud(id: string): Promise<void> { await ready(); await deleteDoc(doc(db, COLLECTIONS.LECTURES, id)); }
export async function syncLectureAttendanceToCloud(record: LectureAttendance): Promise<void> { await ready(); await setDoc(doc(db, COLLECTIONS.LECTURE_ATTENDANCE, record.id), sanitizeForFirestore(record), { merge: true }); }
export async function syncSubjectResultToCloud(result: AcademicSubjectResult): Promise<void> { await ready(); await setDoc(doc(db, COLLECTIONS.SUBJECT_RESULTS, result.id), sanitizeForFirestore(result), { merge: true }); }
export async function deleteSubjectResultFromCloud(id: string): Promise<void> { await ready(); await deleteDoc(doc(db, COLLECTIONS.SUBJECT_RESULTS, id)); }
export async function syncBehaviorNoteToCloud(note: BehaviorNote): Promise<void> { await ready(); await setDoc(doc(db, COLLECTIONS.BEHAVIOR_NOTES, note.id), sanitizeForFirestore(note), { merge: true }); }
export async function syncAcademicSettingsToCloud(levels: string[], years: string[]): Promise<void> { await ready(); await setDoc(doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'academic_structure'), { levels, years, updatedAt: new Date().toISOString() }, { merge: true }); }
export async function syncCurriculumToCloud(material: CurriculumMaterial): Promise<void> { await ready(); await setDoc(doc(db, COLLECTIONS.CURRICULA, material.id), sanitizeForFirestore(material), { merge: true }); }
export async function deleteCurriculumFromCloud(id: string): Promise<void> { await ready(); await deleteDoc(doc(db, COLLECTIONS.CURRICULA, id)); }
export async function syncSchoolLogoToCloud(logoUrl: string): Promise<void> { await ready(); await setDoc(doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'school_branding'), { logoUrl, updatedAt: new Date().toISOString() }, { merge: true }); }
export async function syncChantSubjectToCloud(subject: { id: string }): Promise<void> { await ready(); await setDoc(doc(db, 'chantSubjects', subject.id), sanitizeForFirestore(subject), { merge: true }); }
export async function deleteChantSubjectFromCloud(id: string): Promise<void> { await ready(); await deleteDoc(doc(db, 'chantSubjects', id)); }

export async function uploadAllLocalDataToFirebase(data: {
  students: Student[]; servants: Servant[]; liturgies: LiturgyAttendance[]; lectures: Lecture[];
  lectureAttendance: LectureAttendance[]; subjectResults: AcademicSubjectResult[]; behaviorNotes: BehaviorNote[];
  curricula?: CurriculumMaterial[]; academicLevels: string[]; academicYears: string[];
}): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await ready();
    const operations: Array<{ ref: ReturnType<typeof doc>; data: Record<string, unknown> }> = [];
    data.students.forEach(x => operations.push({ ref: doc(db, COLLECTIONS.STUDENTS, x.id), data: sanitizeForFirestore(x) }));
    data.servants.forEach(x => operations.push({ ref: doc(db, COLLECTIONS.SERVANTS, x.id), data: sanitizeForFirestore(x) }));
    data.liturgies.forEach(x => operations.push({ ref: doc(db, COLLECTIONS.LITURGIES, x.id), data: sanitizeForFirestore(x) }));
    data.lectures.forEach(x => operations.push({ ref: doc(db, COLLECTIONS.LECTURES, x.id), data: sanitizeForFirestore(x) }));
    data.lectureAttendance.forEach(x => operations.push({ ref: doc(db, COLLECTIONS.LECTURE_ATTENDANCE, x.id), data: sanitizeForFirestore(x) }));
    data.subjectResults.forEach(x => operations.push({ ref: doc(db, COLLECTIONS.SUBJECT_RESULTS, x.id), data: sanitizeForFirestore(x) }));
    data.behaviorNotes.forEach(x => operations.push({ ref: doc(db, COLLECTIONS.BEHAVIOR_NOTES, x.id), data: sanitizeForFirestore(x) }));
    (data.curricula || []).forEach(x => operations.push({ ref: doc(db, COLLECTIONS.CURRICULA, x.id), data: sanitizeForFirestore(x) }));
    operations.push({ ref: doc(db, COLLECTIONS.SYSTEM_SETTINGS, 'academic_structure'), data: { levels: data.academicLevels, years: data.academicYears, updatedAt: new Date().toISOString() } });
    for (let i = 0; i < operations.length; i += 350) {
      const batch = writeBatch(db);
      operations.slice(i, i + 350).forEach(op => batch.set(op.ref, op.data, { merge: true }));
      await batch.commit();
    }
    return { success: true, count: operations.length };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Firebase bulk upload error:', error);
    return { success: false, count: 0, error: message };
  }
}

export async function fetchAllDataFromFirebase(): Promise<{
  students: Student[]; servants: Servant[]; liturgies: LiturgyAttendance[]; lectures: Lecture[];
  lectureAttendance: LectureAttendance[]; subjectResults: AcademicSubjectResult[]; behaviorNotes: BehaviorNote[];
  curricula?: CurriculumMaterial[]; academicLevels?: string[]; academicYears?: string[]; schoolLogo?: string;
} | null> {
  try {
    await ready();
    const [studentsSnap, servantsSnap, liturgiesSnap, lecturesSnap, lectureAttSnap, subjectsSnap, notesSnap, curriculaSnap, settingsSnap] = await Promise.all([
      getDocs(collection(db, COLLECTIONS.STUDENTS)), getDocs(collection(db, COLLECTIONS.SERVANTS)),
      getDocs(collection(db, COLLECTIONS.LITURGIES)), getDocs(collection(db, COLLECTIONS.LECTURES)),
      getDocs(collection(db, COLLECTIONS.LECTURE_ATTENDANCE)), getDocs(collection(db, COLLECTIONS.SUBJECT_RESULTS)),
      getDocs(collection(db, COLLECTIONS.BEHAVIOR_NOTES)), getDocs(collection(db, COLLECTIONS.CURRICULA)),
      getDocs(collection(db, COLLECTIONS.SYSTEM_SETTINGS)),
    ]);
    let academicLevels: string[] | undefined; let academicYears: string[] | undefined; let schoolLogo: string | undefined;
    settingsSnap.docs.forEach(d => { const x = d.data(); if (d.id === 'academic_structure') { academicLevels = x.levels; academicYears = x.years; } if (d.id === 'school_branding') schoolLogo = x.logoUrl; });
    return {
      students: studentsSnap.docs.map(d => d.data() as Student), servants: servantsSnap.docs.map(d => d.data() as Servant),
      liturgies: liturgiesSnap.docs.map(d => d.data() as LiturgyAttendance), lectures: lecturesSnap.docs.map(d => d.data() as Lecture),
      lectureAttendance: lectureAttSnap.docs.map(d => d.data() as LectureAttendance), subjectResults: subjectsSnap.docs.map(d => d.data() as AcademicSubjectResult),
      behaviorNotes: notesSnap.docs.map(d => d.data() as BehaviorNote), curricula: curriculaSnap.docs.map(d => d.data() as CurriculumMaterial),
      academicLevels, academicYears, schoolLogo,
    };
  } catch (error) { console.error('Failed to pull from Firebase:', error); return null; }
}

export function listenToFirebaseUpdates(onUpdate: () => void): () => void {
  let active = true; const unsubscribers: (() => void)[] = [];
  authReady.then(() => {
    if (!active) return;
    const watch = (name: string) => onSnapshot(collection(db, name), () => onUpdate(), err => console.warn(`${name} listener:`, err));
    [COLLECTIONS.STUDENTS, COLLECTIONS.SERVANTS, COLLECTIONS.LITURGIES, COLLECTIONS.LECTURES, COLLECTIONS.LECTURE_ATTENDANCE, COLLECTIONS.SUBJECT_RESULTS, COLLECTIONS.BEHAVIOR_NOTES, COLLECTIONS.CURRICULA, COLLECTIONS.SYSTEM_SETTINGS].forEach(name => unsubscribers.push(watch(name)));
  }).catch(err => console.warn('Firebase listener authentication:', err));
  return () => { active = false; unsubscribers.splice(0).forEach(unsub => unsub()); };
}
