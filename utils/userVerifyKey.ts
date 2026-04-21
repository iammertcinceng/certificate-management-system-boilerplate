// Utilities for building and parsing the public student verify key
// Key format: <INITIAL><TC_FIRST4><DD><MM>
// Example: C12340708

// Normalize Turkish characters to ASCII (upper-case)
export function turkishToAscii(input: string): string {
  const map: Record<string, string> = {
    ç: 'c', Ç: 'C', ğ: 'g', Ğ: 'G', ı: 'i', I: 'I', İ: 'I', i: 'I', ö: 'o', Ö: 'O', ş: 's', Ş: 'S', ü: 'u', Ü: 'U',
  };
  return (input || '')
    .split('')
    .map(ch => map[ch] ?? ch)
    .join('');
}

export function normalizeInitial(ch: string): string {
  const first = (ch || '').trim().charAt(0);
  if (!first) return '';
  const ascii = turkishToAscii(first).toUpperCase();
  if (!/^[A-Z]$/.test(ascii)) return '';
  return ascii;
}

export function normalizeInitials(firstName: string, lastName: string): string {
  const i1 = normalizeInitial(firstName);
  const i2 = normalizeInitial(lastName);
  if (!i1 || !i2) return '';
  return `${i1}${i2}`;
}

export function ensureTwoDigits(n: number): string {
  const s = String(n);
  return s.length === 1 ? `0${s}` : s;
}

export function isValidDayMonth(dd: string, mm: string): boolean {
  if (!/^\d{2}$/.test(dd) || !/^\d{2}$/.test(mm)) return false;
  const day = Number(dd);
  const month = Number(mm);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  return true;
}

export function buildVerifyBaseKey(params: { firstName: string; lastName: string; nationalId: string; birthDate: string | Date; }): string | null {
  const { firstName, lastName, nationalId, birthDate } = params;
  const initials = normalizeInitials(firstName, lastName);
  if (!initials) return null;
  const tc4 = (nationalId || '').replace(/\D/g, '').slice(0, 4);
  if (tc4.length !== 4) return null;
  const d = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  if (!(d instanceof Date) || isNaN(d.getTime())) return null;
  const dd = ensureTwoDigits(d.getDate());
  const mm = ensureTwoDigits(d.getMonth() + 1);
  if (!isValidDayMonth(dd, mm)) return null;
  return `${initials}${tc4}${dd}${mm}`;
}

// Parse user input like C12340708 or C123407081 (suffix is 1-based index for certificate)
export function parseUserVerifyInput(input: string): { baseKey: string; index?: number } | null {
  const raw = (input || '').trim().toUpperCase();
  if (!/^([A-Z]{2}\d{8})(\d+)?$/.test(raw)) {
    // base is 10 chars: 2 + 4 + 2 + 2; optional numeric suffix
    return null;
  }
  const baseKey = raw.slice(0, 10);
  const suffix = raw.slice(10);
  let index: number | undefined = undefined;
  if (suffix) {
    const n = Number(suffix);
    if (!Number.isInteger(n) || n < 1) return null;
    index = n; // 1-based
  }
  // Validate day-month constraint embedded in base
  const dd = baseKey.slice(6, 8);
  const mm = baseKey.slice(8, 10);
  if (!isValidDayMonth(dd, mm)) return null;
  return { baseKey, index };
}

export function matchesBaseKey(candidate: { firstName: string; lastName: string; nationalId: string; birthDate: Date | string }, baseKey: string): boolean {
  const initials = normalizeInitials(candidate.firstName, candidate.lastName);
  if (!initials) return false;
  const tc4 = (candidate.nationalId || '').replace(/\D/g, '').slice(0, 4);
  if (tc4.length !== 4) return false;
  const d = typeof candidate.birthDate === 'string' ? new Date(candidate.birthDate) : candidate.birthDate;
  if (!(d instanceof Date) || isNaN(d.getTime())) return false;
  const dd = ensureTwoDigits(d.getDate());
  const mm = ensureTwoDigits(d.getMonth() + 1);
  const built = `${initials}${tc4}${dd}${mm}`.toUpperCase();
  return built === baseKey.toUpperCase();
}
