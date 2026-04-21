import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db/client';
import { externalPartners, institutionPartners } from '@/db/schema';
import { eq } from 'drizzle-orm';

// NOTE: DELETE is handled by /api/admin/external-partners with proper admin protection and special partner safeguards


// GET /api/reference-partners - Kurumun partnership durumları ile birlikte
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const rows = await db.select().from(externalPartners);

    // Eğer kurum giriş yaptıysa, partnership durumlarını da getir
    let partnershipMap: Record<string, { status: string; partnershipId: string }> = {};
    if (userId) {
      const partnerships = await db
        .select({
          externalPartnerId: institutionPartners.externalPartnerId,
          status: institutionPartners.status,
          id: institutionPartners.id,
        })
        .from(institutionPartners)
        .where(eq(institutionPartners.institutionUserId, userId));

      partnerships.forEach(p => {
        partnershipMap[p.externalPartnerId] = {
          status: p.status,
          partnershipId: p.id,
        };
      });
    }

    const partners = rows.map(p => ({
      id: p.id,
      name: p.name,
      logo: p.logo,
      publicId: p.publicId,
      createdAt: p.createdAt,
      partnershipStatus: partnershipMap[p.id]?.status || null,
      partnershipId: partnershipMap[p.id]?.partnershipId || null,
    }));

    return NextResponse.json({ partners });
  } catch (err) {
    console.error('GET /api/reference-partners error', err);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
