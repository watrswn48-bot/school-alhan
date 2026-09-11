export const SCHOOL_CLASSES = ['كيجي', 'أولى وتانية', 'تالتة ورابعة وخامسة وسادسة', 'إعدادي وثانوي'] as const;
export type SchoolClass = typeof SCHOOL_CLASSES[number];

/** Converts every legacy class label into the current combined school class. */
export function normalizeSchoolClass(value?: string | null): string {
  const v = String(value || '').trim();
  if (!v) return '';
  if (v === 'تالتة ورابعة' || v === 'خامسة وسادسة' || v === 'تالتة' || v === 'رابعة' || v === 'خامسة' || v === 'سادسة') {
    return 'تالتة ورابعة وخامسة وسادسة';
  }
  if (v === 'إعدادي' || v === 'ثانوي') return 'إعدادي وثانوي';
  return v;
}

export function isSameSchoolClass(value: string | null | undefined, selected: string): boolean {
  return normalizeSchoolClass(value) === normalizeSchoolClass(selected);
}
