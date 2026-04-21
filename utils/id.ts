// ID generation utilities
// - Client-side helper: PREFIX-000001 (6-digit zero-padded, localStorage counter)
// - Server-side robust: uses DB to fetch last id per prefix and increments (with retry + fallback)

export type IdPrefix = 'INS' | 'ACR' | 'STD' | 'CRT' | 'TRN' | 'RFR';

type Counters = Record<IdPrefix, number>;

const STORAGE_KEY = 'id.counters.v1';
const PAD = 6;

// -----------------------------
// Client-side helpers (no DB)
// -----------------------------
function loadCounters(): Counters {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) return JSON.parse(raw) as Counters;
  } catch { }
  return { INS: 0, ACR: 0, STD: 0, CRT: 0, TRN: 0, RFR: 0 } as Counters;
}

function saveCounters(counters: Counters) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
    }
  } catch { }
}

export function generateId(prefix: IdPrefix): string {
  const counters = loadCounters();
  const next = (counters[prefix] || 0) + 1;
  counters[prefix] = next;
  saveCounters(counters);
  const seq = String(next).padStart(PAD, '0');
  return `${prefix}-${seq}`;
}

export function isValidId(id: string, prefix?: IdPrefix): boolean {
  const re = /^([A-Z]{3})-(\d{6})$/;
  const m = id.match(re);
  if (!m) return false;
  if (prefix && m[1] !== prefix) return false;
  return true;
}

// ----------------------------------
// Server-side robust ID generation
// ----------------------------------
interface GenerateUniqueIdOptions {
  prefix: IdPrefix;
  tableName: string; // DB table with a public_id column
  maxRetries?: number;
}

/**
 * Generates a unique sequential ID with retry and fallback.
 * Imports DB lazily to avoid client bundle issues.
 */
export async function generateUniqueId(options: GenerateUniqueIdOptions): Promise<string> {
  const { prefix, tableName, maxRetries = 5 } = options;

  // Lazy import to keep this file safe for client usage
  const { db } = await import('@/db/client');
  const { sql } = await import('drizzle-orm');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await db.execute( //Drizzle ORM'in parameterized query'lerini kullanabiliriz:
        sql.raw(` 
          SELECT public_id 
          FROM ${tableName} 
          WHERE public_id LIKE '${prefix}-%' 
          ORDER BY public_id DESC 
          LIMIT 1
        `)
      );

      let lastCount = 0;
      if (result.rows && (result.rows as any[]).length > 0) {
        const lastId = (result.rows[0] as any).public_id as string;
        const match = lastId?.match(/\d+$/);
        if (match) lastCount = parseInt(match[0], 10);
      }

      const nextCount = lastCount + 1;
      return `${prefix}-${String(nextCount).padStart(PAD, '0')}`;
    } catch (error) {
      // Last attempt -> fallback
      if (attempt === maxRetries - 1) {
        const timestamp = Date.now().toString().slice(-6);
        const rnd = Math.floor(Math.random() * 100)
          .toString()
          .padStart(2, '0');
        return `${prefix}-${timestamp}${rnd}`;
      }
      await new Promise((r) => setTimeout(r, 100 * Math.pow(2, attempt)));
    }
  }

  // Safety net
  const timestamp = Date.now().toString().slice(-6);
  return `${prefix}-${timestamp}`;
}

// Convenience server-side helpers
export const generateTrainingId = () => generateUniqueId({ prefix: 'TRN', tableName: 'trainings' });
export const generateCertificateId = () => generateUniqueId({ prefix: 'CRT', tableName: 'certificates' });
export const generateStudentId = () => generateUniqueId({ prefix: 'STD', tableName: 'students' });
export const generateInstitutionId = () => generateUniqueId({ prefix: 'INS', tableName: 'organizations' });
export const generateReferencePartnerId = () => generateUniqueId({ prefix: 'RFR', tableName: 'external_partners' });

// Backward compatible simple server helper (still available)
export async function generatePublicId(prefix: IdPrefix, getLastCount?: () => Promise<number>): Promise<string> {
  let lastCount = 0;
  if (getLastCount) {
    try {
      lastCount = await getLastCount();
    } catch (error) {
      const timestamp = Date.now().toString().slice(-6);
      return `${prefix}-${timestamp}`;
    }
  }
  const next = lastCount + 1;
  return `${prefix}-${String(next).padStart(PAD, '0')}`;
}
