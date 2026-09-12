export const SCHOOL_CLASSES = ['كيجي', 'أولى وتانية', 'تالتة ل سته', 'إعدادي وثانوي'] as const;
export type SchoolClass = typeof SCHOOL_CLASSES[number];

/** Converts legacy labels into the canonical four-class structure. */
export function normalizeSchoolClass(value?: string | null): SchoolClass {
  const v = String(value || '').trim();
  if (!v) return '' as SchoolClass;
  if (v === 'تالتة' || v === 'رابعة' || v === 'خامسة' || v === 'سادسة' || v === 'تالتة ورابعة' || v === 'ثالثة ورابعة' || v === 'خامسة وسادسة' || v === 'تالتة ل سته' || v === 'تالتة ل ستة' || v === 'تالتة ل سادسة') return 'تالتة ل سته';
  if (v === 'إعدادي' || v === 'ثانوي' || v === 'إعدادي وثانوي' || v === 'اعدادي وثانوي' || v === 'إعدادي و ثانوي') return 'إعدادي وثانوي';
  if (v === 'أولى' || v === 'تانية' || v === 'أولى وتانية' || v === 'اولى وتانية') return 'أولى وتانية';
  if (v === 'كيجي' || v === 'KG' || v === 'KG1' || v === 'KG2') return 'كيجي';
  return v as SchoolClass;
}

export function isSameSchoolClass(value: string | null | undefined, selected: string): boolean {
  return normalizeSchoolClass(value) === normalizeSchoolClass(selected);
}
