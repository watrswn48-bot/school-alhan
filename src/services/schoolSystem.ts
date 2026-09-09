import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AcademicSubjectResult, Lecture, LiturgyAttendance, Servant, Student } from '../types';
import { getAcademicLevels, getAcademicYears, getLiturgyAttendances, getStudents, getSubjectResults, saveStudent } from './storage';

export type AcademicTerm = 'الترم الأول' | 'الترم الثاني';

export interface ChantSubject {
  id: string;
  name: string;
  levelName: string;
  yearName: string;
  schoolClass?: string;
  term: AcademicTerm;
  createdAt: string;
  createdBy: string;
}

export interface AnnualStudentSnapshot {
  academicYear: string;
  schoolLevel?: string;
  schoolYear?: string;
  chantLevel: string;
  chantYear: string;
  levelIndex: number;
  yearIndex: number;
  archivedAt: string;
}

const SUBJECTS_KEY = 'deacon_system_chant_subjects_v2';
const STUDENTS_KEY = 'deacon_system_students_v1';
const LITURGIES_KEY = 'deacon_system_liturgies_v1';
const LAST_TRANSITION_KEY = 'deacon_system_last_academic_transition_v2';

const SCHOOL_YEARS_ORDER = [
  'الصف الأول الابتدائي','الصف الثاني الابتدائي','الصف الثالث الابتدائي','الصف الرابع الابتدائي','الصف الخامس الابتدائي','الصف السادس الابتدائي',
  'الصف الأول الإعدادي','الصف الثاني الإعدادي','الصف الثالث الإعدادي','الصف الأول الثانوي','الصف الثاني الثانوي','الصف الثالث الثانوي',
  'الجامعة - السنة الأولى','الجامعة - السنة الثانية','الجامعة - السنة الثالثة','الجامعة - السنة الرابعة','خريج / أخرى',
];

export function currentAcademicYear(date = new Date()): string {
  const y = date.getFullYear();
  const start = date.getMonth() >= 8 ? y : y - 1;
  return `${start}/${start + 1}`;
}

export function academicYearStart(year = currentAcademicYear()): Date {
  const start = Number(year.split('/')[0]) || new Date().getFullYear();
  return new Date(start, 8, 1, 0, 0, 0, 0);
}

function schoolLevelForYear(year?: string): string | undefined {
  if (!year) return undefined;
  if (year.includes('الابتدائي')) return 'المرحلة الابتدائية';
  if (year.includes('الإعدادي')) return 'المرحلة الإعدادية';
  if (year.includes('الثانوي')) return 'المرحلة الثانوية';
  if (year.includes('الجامعة')) return 'المرحلة الجامعية';
  return 'خريج / أخرى';
}

export function nextRegularSchoolYear(year?: string): string | undefined {
  if (!year) return year;
  const i = SCHOOL_YEARS_ORDER.indexOf(year);
  if (i < 0 || i >= SCHOOL_YEARS_ORDER.length - 1) return year;
  return SCHOOL_YEARS_ORDER[i + 1];
}

export function getChantSubjects(): ChantSubject[] {
  try {
    const raw = localStorage.getItem(SUBJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSubjectsLocal(list: ChantSubject[]) {
  localStorage.setItem(SUBJECTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('deacon_data_updated', { detail: { source: 'subjects' } }));
}

export async function refreshSubjectsFromFirebase(): Promise<ChantSubject[]> {
  try {
    const snap = await getDocs(collection(db, 'chantSubjects'));
    if (!snap.empty) {
      const list = snap.docs.map(d => d.data() as ChantSubject);
      saveSubjectsLocal(list);
      return list;
    }
  } catch (e) {
    console.warn('Subjects cloud refresh:', e);
  }
  return getChantSubjects();
}

export async function saveChantSubject(input: Partial<ChantSubject>): Promise<ChantSubject> {
  const list = getChantSubjects();
  const name = (input.name || '').trim();
  if (!name || !input.levelName || !input.yearName || !input.schoolClass || !input.term) throw new Error('اسم المادة والمستوى والسنة والفصل والترم بيانات مطلوبة.');
  const duplicate = list.find(s => s.id !== input.id && s.name.trim() === name && s.levelName === input.levelName && s.yearName === input.yearName && s.schoolClass === input.schoolClass && s.term === input.term);
  if (duplicate) throw new Error('هذه المادة موجودة بالفعل لنفس السنة والترم.');
  const item: ChantSubject = {
    id: input.id || `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    levelName: input.levelName,
    yearName: input.yearName,
    schoolClass: input.schoolClass,
    term: input.term,
    createdAt: input.createdAt || new Date().toISOString(),
    createdBy: input.createdBy || 'الإدارة',
  };
  const idx = list.findIndex(s => s.id === item.id);
  if (idx >= 0) list[idx] = item; else list.push(item);
  saveSubjectsLocal(list);
  try { await setDoc(doc(db, 'chantSubjects', item.id), item, { merge: true }); } catch (e) { console.warn('Subject queued locally/offline:', e); }
  return item;
}

export async function deleteChantSubject(id: string) {
  saveSubjectsLocal(getChantSubjects().filter(s => s.id !== id));
  try { await deleteDoc(doc(db, 'chantSubjects', id)); } catch (e) { console.warn('Subject delete offline:', e); }
}

export function subjectsForStudent(student: Student, term: AcademicTerm): ChantSubject[] {
  return getChantSubjects().filter(s => s.levelName === student.level && s.yearName === student.year && s.schoolClass === student.schoolClass && s.term === term);
}

export function resultsForStudentTerm(studentId: string, levelIndex: number, yearIndex: number, term: AcademicTerm): AcademicSubjectResult[] {
  return getSubjectResults(studentId).filter(r => r.levelIndex === levelIndex && r.yearIndex === yearIndex && r.term === term);
}

export function chantYearPassStatus(student: Student): { passed: boolean; reason: string; required: number; completed: number } {
  const requiredSubjects = getChantSubjects().filter(s => s.levelName === student.level && s.yearName === student.year && s.schoolClass === student.schoolClass);
  if (!requiredSubjects.length) return { passed: false, reason: 'لا توجد مواد محددة لهذه السنة بعد.', required: 0, completed: 0 };
  const results = getSubjectResults(student.id).filter(r => r.levelIndex === student.levelIndex && r.yearIndex === student.yearIndex);
  let completed = 0;
  for (const subject of requiredSubjects) {
    const result = results.find(r => r.subjectName === subject.name && r.term === subject.term);
    if (!result) return { passed: false, reason: `لم يتم رصد نتيجة مادة ${subject.name} - ${subject.term}.`, required: requiredSubjects.length, completed };
    completed++;
    const pct = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;
    if (pct < 50) return { passed: false, reason: `الطالب أقل من 50% في مادة ${subject.name} - ${subject.term}.`, required: requiredSubjects.length, completed };
  }
  return { passed: true, reason: 'ناجح في جميع المواد بنسبة 50% أو أكثر.', required: requiredSubjects.length, completed };
}

function advanceChantStage(student: Student, graduationAcademicYear?: string): Student {
  const levels = getAcademicLevels();
  const years = getAcademicYears();
  const history = Array.isArray(student.history) ? [...student.history] : [];
  const current = history.find(h => h.levelIndex === student.levelIndex && h.yearIndex === student.yearIndex);
  if (current) { current.status = 'passed'; current.archivedAt = new Date().toISOString(); }
  let nextL = student.levelIndex;
  let nextY = student.yearIndex + 1;
  if (nextY >= years.length) { nextY = 0; nextL += 1; }
  if (nextL >= levels.length) {
    const endYear = Number((graduationAcademicYear || currentAcademicYear()).split('/')[1]);
    return { ...student, history, graduationYear: Number.isFinite(endYear) ? endYear : new Date().getFullYear(), graduatedAt: new Date().toISOString() };
  }
  const next = history.find(h => h.levelIndex === nextL && h.yearIndex === nextY);
  if (next) next.status = 'active';
  return { ...student, levelIndex: nextL, yearIndex: nextY, level: levels[nextL], year: years[nextY], history, graduationYear: undefined, graduatedAt: undefined };
}

export async function runAutomaticAcademicTransition(force = false): Promise<{ processed: boolean; schoolAdvanced: number; chantAdvanced: number; chantHeld: number }> {
  const year = currentAcademicYear();
  const last = localStorage.getItem(LAST_TRANSITION_KEY);
  if (!force && !last) {
    localStorage.setItem(LAST_TRANSITION_KEY, year);
    return { processed: false, schoolAdvanced: 0, chantAdvanced: 0, chantHeld: 0 };
  }
  if (!force && last === year) return { processed: false, schoolAdvanced: 0, chantAdvanced: 0, chantHeld: 0 };

  let schoolAdvanced = 0, chantAdvanced = 0, chantHeld = 0;
  for (const original of getStudents(true).filter(s => !s.isDeleted)) {
    const annualHistory = Array.isArray((original as any).annualHistory) ? [...(original as any).annualHistory] : [];
    if (!annualHistory.some((h: AnnualStudentSnapshot) => h.academicYear === (last || year))) {
      annualHistory.push({ academicYear: last || year, schoolLevel: original.schoolLevel, schoolYear: original.schoolYear, chantLevel: original.level, chantYear: original.year, levelIndex: original.levelIndex, yearIndex: original.yearIndex, archivedAt: new Date().toISOString() });
    }
    let updated: Student = { ...original, annualHistory } as Student;
    const nextSchool = nextRegularSchoolYear(original.schoolYear);
    if (nextSchool && nextSchool !== original.schoolYear) {
      updated.schoolYear = nextSchool;
      updated.schoolLevel = schoolLevelForYear(nextSchool);
      schoolAdvanced++;
    }
    const status = chantYearPassStatus(original);
    if (status.passed) {
      const promoted = advanceChantStage(updated, last || year);
      if (promoted.levelIndex !== updated.levelIndex || promoted.yearIndex !== updated.yearIndex) chantAdvanced++;
      updated = promoted;
    } else chantHeld++;
    saveStudent(updated);
  }
  localStorage.setItem(LAST_TRANSITION_KEY, year);
  return { processed: true, schoolAdvanced, chantAdvanced, chantHeld };
}

export function getFridayDates(from = academicYearStart(), to = new Date()): string[] {
  const cursor = new Date(from); cursor.setHours(0,0,0,0);
  while (cursor.getDay() !== 5) cursor.setDate(cursor.getDate() + 1);
  const end = new Date(to); end.setHours(23,59,59,999);
  const out: string[] = [];
  while (cursor <= end) {
    const y = cursor.getFullYear(); const m = String(cursor.getMonth()+1).padStart(2,'0'); const d = String(cursor.getDate()).padStart(2,'0');
    out.push(`${y}-${m}-${d}`); cursor.setDate(cursor.getDate() + 7);
  }
  return out;
}

export function dedupedLiturgyAttendances(): LiturgyAttendance[] {
  const map = new Map<string, LiturgyAttendance>();
  for (const rec of getLiturgyAttendances()) {
    const key = `${rec.studentId}::${rec.dateStr}`;
    const current = map.get(key);
    if (!current || rec.timestamp < current.timestamp) map.set(key, rec);
  }
  return [...map.values()];
}

export async function recordFridayAttendance(student: Student, recordedBy: string, recordedByName: string, date = new Date()): Promise<{success:boolean; message:string; record?:LiturgyAttendance}> {
  const y = date.getFullYear(); const m = String(date.getMonth()+1).padStart(2,'0'); const d = String(date.getDate()).padStart(2,'0'); const dateStr = `${y}-${m}-${d}`;
  const list = dedupedLiturgyAttendances();
  const existing = list.find(r => r.studentId === student.id && r.dateStr === dateStr);
  if (existing) return { success: false, message: `تم تسجيل حضور ${student.fullName} مسبقًا لهذه المناسبة.`, record: existing };
  const now = new Date();
  const record: LiturgyAttendance = { id: `lit-${dateStr}-${student.id}`, studentId: student.id, studentCode: student.studentCode, studentName: student.fullName, studentRank: student.deaconRank, timestamp: now.toISOString(), dateStr, timeStr: now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit'}), recordedBy, recordedByName };
  const raw = (()=>{try{return JSON.parse(localStorage.getItem(LITURGIES_KEY)||'[]') as LiturgyAttendance[];}catch{return [];}})();
  raw.unshift(record); localStorage.setItem(LITURGIES_KEY, JSON.stringify(raw));
  window.dispatchEvent(new CustomEvent('deacon_data_updated', { detail: { source: 'liturgy' } }));
  try { await setDoc(doc(db, 'liturgies', record.id), record, { merge: true }); } catch (e) { console.warn('Liturgy write queued/offline:', e); }
  return { success: true, message: `تم تسجيل حضور ${student.fullName}.`, record };
}

export function isAllowedLecturer(servant: Servant): boolean {
  return servant.isActive !== false && (servant.role === 'admin' || servant.role === 'family_admin' || servant.role === 'senior_servant') && servant.permissions?.canTeachLectures !== false;
}

export function lecturesNeedingEvaluation(lectures: Lecture[], servantId?: string, isAdmin = false): Lecture[] {
  if (!servantId) return [];
  return lectures.filter(l => l.status === 'elapsed' && !l.isEvaluated && (isAdmin || l.speakerServantId === servantId));
}

export function canEvaluateLecture(lecture: Lecture, servantId?: string, isAdmin = false): boolean {
  return !!servantId && (isAdmin || lecture.speakerServantId === servantId);
}

export function isStudentCodeAvailable(code: string, editingStudentId?: string): boolean {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return false;
  return !getStudents(true).some(s => s.id !== editingStudentId && s.studentCode.trim().toLowerCase() === normalized);
}
