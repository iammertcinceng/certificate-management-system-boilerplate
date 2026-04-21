import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db/client';
import { institutionPartners } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { calculateAccreditationEndDate } from '@/utils/specialPartners';

// POST /api/external-partnerships/renew - Akreditasyonu yenile
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;

        if (userRole !== 'institution') {
            return NextResponse.json({ error: 'Only institutions can renew accreditation' }, { status: 403 });
        }

        const body = await req.json();
        const { partnershipId, accreditationDuration } = body;

        if (!partnershipId || !accreditationDuration) {
            return NextResponse.json({ error: 'partnershipId and accreditationDuration are required' }, { status: 400 });
        }

        // Partnership'in bu kuruma ait olduğunu doğrula
        const [existing] = await db
            .select()
            .from(institutionPartners)
            .where(
                and(
                    eq(institutionPartners.id, partnershipId),
                    eq(institutionPartners.institutionUserId, userId)
                )
            )
            .limit(1);

        if (!existing) {
            return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
        }

        // Yeni akreditasyon tarihleri hesapla
        const startDate = new Date();
        const accreditationStartDate = startDate.toISOString().split('T')[0];
        const accreditationEndDate = calculateAccreditationEndDate(startDate, accreditationDuration).toISOString().split('T')[0];

        // Güncelle - status pending'e çevir (admin onayı gerekli)
        await db
            .update(institutionPartners)
            .set({
                accreditationStartDate,
                accreditationEndDate,
                accreditationDuration,
                status: 'pending', // Yenileme de admin onayı gerektirir
                updatedAt: new Date(),
            })
            .where(eq(institutionPartners.id, partnershipId));

        const [updated] = await db
            .select()
            .from(institutionPartners)
            .where(eq(institutionPartners.id, partnershipId))
            .limit(1);

        return NextResponse.json({
            partnership: updated,
            message: 'Accreditation renewal submitted for admin approval'
        }, { status: 200 });

    } catch (err: any) {
        console.error('POST /api/external-partnerships/renew error', err);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.'}, { status: 500 });
    }
}
