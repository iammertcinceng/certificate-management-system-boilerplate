import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users, organizations, trainings, certificates, certificatePartners } from '@/db/schema';
import { eq, inArray, or, sql } from 'drizzle-orm';

// Simple in-memory cache
let cachedData: { items: any[]; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 1000; // 1 minute cache

// GET /api/collaborations/public-list?q=
// Returns institutions and accreditors with their basic org info and related trainings.
// OPTIMIZED: Parallel queries, caching, minimal data
export async function GET(req: Request) {
  try {
    const startTime = Date.now();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    // Check cache for non-search requests
    if (!q && cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
      console.log(`[collaborations/public-list] Cache hit, returning ${cachedData.items.length} items`);
      return NextResponse.json({ items: cachedData.items }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        }
      });
    }

    // 1) Fetch ONLY essential org data - NO LOGO for performance
    const baseWhere = or(eq(users.role, 'institution'), eq(users.role, 'acreditor'));

    const orgRowsPromise = db
      .select({
        userId: users.id,
        role: users.role,
        slug: organizations.slug,
        publicId: organizations.publicId,
        name: organizations.name,
        hasLogo: sql<boolean>`${organizations.logo} IS NOT NULL AND ${organizations.logo} != ''`,
      })
      .from(users)
      .leftJoin(organizations, eq(users.id, organizations.userId))
      .where(baseWhere)
      .orderBy(organizations.name);

    // Start org query first
    const orgRows = await orgRowsPromise;
    console.log(`[collaborations/public-list] Orgs fetched in ${Date.now() - startTime}ms`);

    if (!orgRows.length) {
      return NextResponse.json({ items: [] });
    }

    const userIds = orgRows.map(r => r.userId);

    // 2) Run training queries in PARALLEL
    const [institutionTrainings, partnerTrainings] = await Promise.all([
      // Institution trainings
      db
        .select({
          institutionUserId: trainings.institutionUserId,
          trainingPk: trainings.id,
          trainingName: trainings.name,
          trainingLanguages: trainings.languages,
          trainingMode: trainings.mode,
          trainingCountry: trainings.country,
        })
        .from(trainings)
        .where(inArray(trainings.institutionUserId, userIds)),

      // Partner trainings - simplified query
      db
        .select({
          partnerUserId: certificatePartners.partnerUserId,
          trainingPk: trainings.id,
          trainingName: trainings.name,
          trainingLanguages: trainings.languages,
          trainingMode: trainings.mode,
          trainingCountry: trainings.country,
        })
        .from(certificatePartners)
        .leftJoin(certificates, eq(certificatePartners.certificateId, certificates.id))
        .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
    ]);

    console.log(`[collaborations/public-list] All trainings fetched in ${Date.now() - startTime}ms`);

    // 3) Aggregate trainings per user
    const instTrainingsMap = new Map<string, { id: string; name: string; languages?: string[] | null; mode?: string | null; country?: string | null }[]>();
    for (const t of institutionTrainings) {
      if (!t.institutionUserId) continue;
      const existing = instTrainingsMap.get(t.institutionUserId) || [];
      if (t.trainingPk && t.trainingName) {
        const seen = new Set(existing.map(x => x.id));
        if (!seen.has(t.trainingPk)) existing.push({ id: t.trainingPk, name: t.trainingName, languages: t.trainingLanguages as any, mode: t.trainingMode as any, country: t.trainingCountry as any });
      }
      instTrainingsMap.set(t.institutionUserId, existing);
    }

    const partnerTrainingsMap = new Map<string, { id: string; name: string; languages?: string[] | null; mode?: string | null; country?: string | null }[]>();
    for (const t of partnerTrainings) {
      if (!t.partnerUserId) continue;
      const existing = partnerTrainingsMap.get(t.partnerUserId) || [];
      if (t.trainingPk && t.trainingName) {
        const seen = new Set(existing.map(x => x.id));
        if (!seen.has(t.trainingPk)) existing.push({ id: t.trainingPk, name: t.trainingName, languages: t.trainingLanguages as any, mode: t.trainingMode as any, country: t.trainingCountry as any });
      }
      partnerTrainingsMap.set(t.partnerUserId, existing);
    }

    // 4) Build items
    let items = orgRows.map(r => {
      const isAcreditor = r.role === 'acreditor';
      const trainingsArr = isAcreditor
        ? partnerTrainingsMap.get(r.userId) || []
        : instTrainingsMap.get(r.userId) || [];

      const displayId = `${isAcreditor ? 'ACR' : 'INS'}-${(r.publicId || '').replace(/\D/g, '').padStart(6, '0') || '000000'}`;

      return {
        id: displayId,
        userId: r.userId,
        slug: r.slug || r.publicId || r.userId,
        name: r.name || '—',
        hasLogo: r.hasLogo,
        isPartner: isAcreditor,
        role: r.role,
        trainings: trainingsArr,
      };
    });

    // 5) Optional search by org name or training name
    if (q) {
      const qLower = q.toLowerCase();
      items = items.filter(it =>
        it.name.toLowerCase().includes(qLower) ||
        it.trainings?.some(tr => tr.name.toLowerCase().includes(qLower))
      );
    } else {
      // Cache non-search results
      cachedData = { items, timestamp: Date.now() };
    }

    console.log(`[collaborations/public-list] Total time: ${Date.now() - startTime}ms, ${items.length} items`);

    return NextResponse.json({ items }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    });
  } catch (err: any) {
    console.error('GET /api/collaborations/public-list error', err);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
