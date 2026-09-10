import { Student } from '../types';
import { getStudents, saveStudent } from './storage';
import { AcademicTerm, getChantSubjects, getSubjectResults } from './schoolSystem';

const TRANSITION_KEY = 'deacon_system_regular_school_transition_v3';
const RESULT_PUBLICATION_KEY = 'deacon_system_result_publication_v1';

const SCHOOL_YEARS_ORDER = [
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

function schoolLevelForYear(year?: string): string | undefined {
  if (!year) return undefined;
  if (year.includes('الابتدائي')) return 'المرحلة الابتدائية';
  if (year.includes('الإعدادي')) return 'المرحلة الإعدادية';
  if (year.includes('الثانوي')) return 'المرحلة الثانوية';
  if (year.includes('الجامعة')) return 'المرحلة الجامعية';
  return 'خريج / أخرى';
}

export function currentSchoolAcademicYear(date = new Date()): string {
  const y = date.getFullYear();
  const start = date.getMonth() >= 8 ? y : y - 1;
  return `${start}/${start + 1}`;
}

export function nextSchoolYear(year?: string): string | undefined {
  if (!year) return undefined;
  const index = SCHOOL_YEARS_ORDER.indexOf(year);
  if (index < 0 || index >= SCHOOL_YEARS_ORDER.length - 1) return year;
  return SCHOOL_YEARS_ORDER[index + 1];
}

function previousSchoolAcademicYear(academicYear: string): string {
  const start = Number(academicYear.split('/')[0]);
  return Number.isFinite(start) ? `${start - 1}/${start}` : academicYear;
}

/**
 * Moves regular-school students exactly one school year when a new academic
 * year starts. This is independent from chant-school promotion and does not
 * check grades: regular school always advances one grade.
 */
export function runAutomaticRegularSchoolPromotion(force = false): { processed: boolean; advanced: number } {
  const current = currentSchoolAcademicYear();
  const last = localStorage.getItem(TRANSITION_KEY);

  if (!force && last === current) return { processed: false, advanced: 0 };

  // On the first run of this version, only students that clearly belong to an
  // older school-year record are advanced. Newly created students are tagged
  // with their registration academic year below and therefore stay put.
  const previous = last || previousSchoolAcademicYear(current);
  let advanced = 0;

  for (const original of getStudents(true).filter(s => !s.isDeleted)) {
    const studentAcademicYear = (original as Student & { schoolAcademicYear?: string }).schoolAcademicYear;
    const shouldAdvance = studentAcademicYear ? studentAcademicYear !== current : !!last;
    if (!shouldAdvance) continue;

    const next = nextSchoolYear(original.schoolYear);
    if (!next || next === original.schoolYear) continue;

    const annualHistory = Array.isArray((original as any).annualHistory) ? [...(original as any).annualHistory] : [];
    if (!annualHistory.some((h: any) => h.academicYear === previous)) {
      annualHistory.push({
        academicYear: previous,
        schoolLevel: original.schoolLevel,
        schoolYear: original.schoolYear,
        chantLevel: original.level,
        chantYear: original.year,
        levelIndex: original.levelIndex,
        yearIndex: original.yearIndex,
        archivedAt: new Date().toISOString(),
      });
    }

    saveStudent({
      ...original,
      schoolYear: next,
      schoolLevel: schoolLevelForYear(next),
      schoolAcademicYear: current,
      annualHistory,
    } as Partial<Student>);
    advanced++;
  }

  localStorage.setItem(TRANSITION_KEY, current);
  return { processed: true, advanced };
}

function publicationMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(RESULT_PUBLICATION_KEY) || '{}'); } catch { return {}; }
}

function publicationKey(level: string, year: string, term: AcademicTerm): string {
  return `${level}::${year}::${term}`;
}

export function publishResults(level: string, year: string, term: AcademicTerm): void {
  const map = publicationMap();
  map[publicationKey(level, year, term)] = new Date().toISOString();
  localStorage.setItem(RESULT_PUBLICATION_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent('deacon_results_published', { detail: { level, year, term } }));
}

export function unpublishResults(level: string, year: string, term: AcademicTerm): void {
  const map = publicationMap();
  delete map[publicationKey(level, year, term)];
  localStorage.setItem(RESULT_PUBLICATION_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent('deacon_results_unpublished', { detail: { level, year, term } }));
}

export function areResultsPublished(level: string, year: string, term: AcademicTerm): boolean {
  return !!publicationMap()[publicationKey(level, year, term)];
}

export function publishedResultsForStudent(student: Student) {
  return getSubjectResults(student.id).filter(r => {
    const level = r.levelName || student.level;
    const year = r.yearName || student.year;
    const term = r.term as AcademicTerm;
    return !!term && areResultsPublished(level, year, term);
  });
}

/** A full chant-year pass requires every configured subject in both terms. */
export function studentPassedBothTerms(student: Student): { passed: boolean; reason: string } {
  const subjects = getChantSubjects().filter(s => s.levelName === student.level && s.yearName === student.year && s.schoolClass === student.schoolClass);
  if (!subjects.length) return { passed: false, reason: 'لا توجد مواد محددة لهذه السنة والفصل.' };

  const results = getSubjectResults(student.id).filter(r => r.levelIndex === student.levelIndex && r.yearIndex === student.yearIndex);
  for (const term of ['الترم الأول', 'الترم الثاني'] as AcademicTerm[]) {
    const termSubjects = subjects.filter(s => s.term === term);
    if (!termSubjects.length) return { passed: false, reason: `لا توجد مواد محددة في ${term}.` };
    for (const subject of termSubjects) {
      const result = results.find(r => r.subjectName === subject.name && r.term === term);
      if (!result) return { passed: false, reason: `لم تُرصد نتيجة ${subject.name} في ${term}.` };
      const pct = result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0;
      if (pct < 50) return { passed: false, reason: `الطالب أقل من 50% في ${subject.name} في ${term}.` };
    }
  }
  return { passed: true, reason: 'ناجح في جميع مواد الترمين.' };
}
