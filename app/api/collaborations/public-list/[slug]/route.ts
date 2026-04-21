import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { users, organizations, trainings, certificates, certificatePartners } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/collaborations/public-list/[slug]
// Returns a single entity (institution or accreditor) with related trainings
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    if (!slug) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const rows = await db
      .select({
        userId: users.id,
        role: users.role,
        slug: organizations.slug,
        publicId: organizations.publicId,
        name: organizations.name,
        logo: organizations.logo,
        infoEmail: organizations.infoEmail,
        phone: organizations.phone,
        website: organizations.website,
        address: organizations.address,
        about: organizations.about,
        mission: organizations.mission,
        vision: organizations.vision,
        socialLinkedin: organizations.socialLinkedin,
        socialTwitter: organizations.socialTwitter,
        socialFacebook: organizations.socialFacebook,
        socialInstagram: organizations.socialInstagram,
        advantages: organizations.advantages,
      })
      .from(users)
      .leftJoin(organizations, eq(users.id, organizations.userId))
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (!rows.length) {
      return NextResponse.json({ item: null }, { status: 200 });
    }

    const r = rows[0];
    const isAcreditor = r.role === 'acreditor';

    if (isAcreditor) {
      // trainings associated via certificates -> certificate_partners
      const partnerTs = await db
        .select({
          trainingPk: trainings.id,
          trainingName: trainings.name,
          trainingLanguages: trainings.languages,
          trainingMode: trainings.mode,
          trainingCountry: trainings.country,
        })
        .from(certificatePartners)
        .leftJoin(certificates, eq(certificatePartners.certificateId, certificates.id))
        .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
        .where(eq(certificatePartners.partnerUserId, r.userId));

      // de-duplicate by trainingId
      const uniqMap = new Map<string, { id: string; name: string; languages?: string[] | null; mode?: string | null; country?: string | null }>();
      for (const t of partnerTs) {
        if (t.trainingPk && t.trainingName && !uniqMap.has(t.trainingPk)) {
          uniqMap.set(t.trainingPk, { id: t.trainingPk, name: t.trainingName, languages: t.trainingLanguages as any, mode: t.trainingMode as any, country: t.trainingCountry as any });
        }
      }

      return NextResponse.json({
        item: {
          id: `ACR-${(r.publicId || '').replace(/\D/g, '').padStart(6, '0') || '000000'}`,
          userId: r.userId,
          slug: r.slug || r.publicId || r.userId,
          name: r.name || '—',
          logo: r.logo || null,
          role: r.role,
          trainings: Array.from(uniqMap.values()),
          organization: {
            infoEmail: r.infoEmail,
            phone: r.phone,
            website: r.website,
            address: r.address,
            about: r.about,
            mission: r.mission,
            vision: r.vision,
            socialLinkedin: r.socialLinkedin,
            socialTwitter: r.socialTwitter,
            socialFacebook: r.socialFacebook,
            socialInstagram: r.socialInstagram,
            advantages: r.advantages,
          },
        }
      });
    }

    // institution: trainings they own
    const instTs = await db
      .select({ trainingPk: trainings.id, trainingName: trainings.name, trainingLanguages: trainings.languages, trainingMode: trainings.mode, trainingCountry: trainings.country })
      .from(trainings)
      .where(eq(trainings.institutionUserId, r.userId));
    // de-duplicate by trainingId
    const uniqInst = new Map<string, { id: string; name: string; languages?: string[] | null; mode?: string | null; country?: string | null }>();
    for (const t of instTs) {
      if (t.trainingPk && t.trainingName && !uniqInst.has(t.trainingPk)) {
        uniqInst.set(t.trainingPk, { id: t.trainingPk, name: t.trainingName, languages: t.trainingLanguages as any, mode: t.trainingMode as any, country: t.trainingCountry as any });
      }
    }

    return NextResponse.json({
      item: {
        id: `INS-${(r.publicId || '').replace(/\D/g, '').padStart(6, '0') || '000000'}`,
        userId: r.userId,
        slug: r.slug || r.publicId || r.userId,
        name: r.name || '—',
        logo: r.logo || null,
        role: r.role,
        trainings: Array.from(uniqInst.values()),
        organization: {
          infoEmail: r.infoEmail,
          phone: r.phone,
          website: r.website,
          address: r.address,
          about: r.about,
          mission: r.mission,
          vision: r.vision,
          socialLinkedin: r.socialLinkedin,
          socialTwitter: r.socialTwitter,
          socialFacebook: r.socialFacebook,
          socialInstagram: r.socialInstagram,
          advantages: r.advantages,
        },
      }
    });
  } catch (err: any) {
    console.error('GET /api/collaborations/public-list/[slug] error', err);
    return NextResponse.json({ error: 'u{0130}u{015F}lem su{0131}rasu{0131}nda bir hata oluu{015F}tu.'}, { status: 500 });
  }
}
