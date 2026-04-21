import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { trainings, users, organizations, certificates, certificatePartners } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

// GET /api/trainings/public/[id]
// Public training details by training publicId
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // 1) Find training by internal primary key (trainings.id)
    const tRows = await db
      .select({
        id: trainings.id,
        publicId: trainings.publicId,
        name: trainings.name,
        description: trainings.description,
        level: trainings.level,
        language: trainings.language,
        languages: trainings.languages,
        mode: trainings.mode,
        country: trainings.country,
        totalHours: trainings.totalHours,
        status: trainings.status,
        institutionUserId: trainings.institutionUserId,
      })
      .from(trainings)
      .where(eq(trainings.id, id as any))
      .limit(1);

    if (!tRows.length) return NextResponse.json({ training: null }, { status: 200 });
    const tr = tRows[0];

    // 2) Owning institution org info
    const instOrgRows = await db
      .select({
        userId: organizations.userId,
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
      .from(organizations)
      .where(eq(organizations.userId, tr.institutionUserId))
      .limit(1);

    const institution = instOrgRows[0] || null;

    // 3) Certificates for this training
    const certRows = await db
      .select({ id: certificates.id })
      .from(certificates)
      .where(eq(certificates.trainingId, tr.id));

    const certIds = certRows.map(c => c.id);

    // 4) Partners via certificatePartners
    let partners: any[] = [];
    if (certIds.length) {
      const partnerLinks = await db
        .select({ partnerUserId: certificatePartners.partnerUserId })
        .from(certificatePartners)
        .where(inArray(certificatePartners.certificateId, certIds));
      const partnerUserIds = Array.from(new Set(partnerLinks.map(p => p.partnerUserId)));

      if (partnerUserIds.length) {
        const partnerOrgs = await db
          .select({
            userId: organizations.userId,
            slug: organizations.slug,
            publicId: organizations.publicId,
            name: organizations.name,
            logo: organizations.logo,
            infoEmail: organizations.infoEmail,
            phone: organizations.phone,
            website: organizations.website,
          })
          .from(organizations)
          .where(inArray(organizations.userId, partnerUserIds));
        partners = partnerOrgs;
      }
    }

    return NextResponse.json({
      training: {
        id: tr.id,
        name: tr.name,
        description: tr.description,
        level: tr.level,
        language: tr.language,
        languages: tr.languages,
        mode: tr.mode,
        country: tr.country,
        totalHours: tr.totalHours,
        status: tr.status,
      },
      institution,
      partners,
    });
  } catch (err: any) {
    console.error('GET /api/trainings/public/[id] error', err);
    return NextResponse.json({ error: 'u{0130}u{015F}lem su{0131}rasu{0131}nda bir hata oluu{015F}tu.'}, { status: 500 });
  }
}
