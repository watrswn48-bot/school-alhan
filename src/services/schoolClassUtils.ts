export const SCHOOL_CLASSES = ['كيجي', 'أولى وتانية', 'تالتة ورابعة', 'خامسة وسادسة', 'إعدادي وثانوي'] as const;
export type SchoolClass = typeof SCHOOL_CLASSES[number];

/** Converts legacy class names into the current combined preparatory/secondary class. */
export function normalizeSchoolClass(value?: string | null): string {
  if (value === 'إعدادي' || value === 'ثانوي') return 'إعدادي وثانوي';
  return value || '';
}

export function isSameSchoolClass(value: string | null | undefined, selected: string): boolean {
  return normalizeSchoolClass(value) === normalizeSchoolClass(selected);
}
