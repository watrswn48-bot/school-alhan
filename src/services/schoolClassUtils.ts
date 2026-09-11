export const SCHOOL_CLASSES = ['كيجي', 'أولى وتانية', 'تالتة لستة', 'إعدادي', 'ثانوي'] as const;
export type SchoolClass = typeof SCHOOL_CLASSES[number];

/** Converts legacy labels into the single current class structure. */
export function normalizeSchoolClass(value?: string | null): string {
  const v = String(value || '').trim();
  if (!v) return '';
  if (v === 'تالتة ورابعة' || v === 'خامسة وسادسة' || v === 'تالتة ورابعة وخامسة وسادسة' || v === 'تالتة' || v === 'رابعة' || v === 'خامسة' || v === 'سادسة') return 'تالتة لستة';
  if (v === 'إعدادي وثانوي') return 'إعدادي';
  return v;
}

export function isSameSchoolClass(value: string | null | undefined, selected: string): boolean {
  return normalizeSchoolClass(value) === normalizeSchoolClass(selected);
}
