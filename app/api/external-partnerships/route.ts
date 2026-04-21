import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db/client';
import { externalPartners, institutionPartners } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { SPECIAL_PARTNER_IDS, calculateAccreditationEndDate } from '@/utils/specialPartners';

// POST /api/institution-partners - Kurum için external partner ekleme
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const userRole = (session.user as any).role;

        if (userRole !== 'institution') {
            return NextResponse.json({ error: 'Only institutions can add partners' }, { status: 403 });
        }

        const body = await req.json();
        const { partnerPublicId, accreditationDuration } = body;

        if (!partnerPublicId) {
            return NextResponse.json({ error: 'partnerPublicId is required' }, { status: 400 });
        }

        // External partner'ı bul
        const [externalPartner] = await db
            .select()
            .from(externalPartners)
            .where(eq(externalPartners.publicId, partnerPublicId))
            .limit(1);

        if (!externalPartner) {
            return NextResponse.json({ error: 'External partner not found' }, { status: 404 });
        }

        // Zaten ekli mi kontrol et
        const [existing] = await db
            .select()
            .from(institutionPartners)
            .where(
                and(
                    eq(institutionPartners.institutionUserId, userId),
                    eq(institutionPartners.externalPartnerId, externalPartner.id)
                )
            )
            .limit(1);

        if (existing) {
            // Eğer rejected ise tekrar pending'e çevirebiliriz
            if (existing.status === 'rejected') {
                // Rejected kaydı güncelle - tekrar onaya gönder
                const [updated] = await db
                    .update(institutionPartners)
                    .set({
                        status: 'pending',
                        updatedAt: new Date(),
                    })
                    .where(eq(institutionPartners.id, existing.id))
                    .returning();

                return NextResponse.json({
                    partnership: updated,
                    message: 'Partnership resubmitted for approval'
                }, { status: 200 });
            }

            // Pending veya approved ise hata dön
            if (existing.status === 'pending') {
                return NextResponse.json({ error: 'Bu partner için zaten bir onay bekleyen başvurunuz var' }, { status: 409 });
            }

            return NextResponse.json({ error: 'Bu partner zaten ekli' }, { status: 409 });
        }

        // Special partner (RFR-000001, RFR-000002) kontrolü - accreditasyon zorunlu
        const isSpecial = SPECIAL_PARTNER_IDS.includes(partnerPublicId as any);

        if (isSpecial && !accreditationDuration) {
            return NextResponse.json({
                error: 'Accreditation duration is required for this partner',
                isSpecialPartner: true
            }, { status: 400 });
        }

        // Accreditation tarihleri hesapla
        let accreditationStartDate: string | null = null;
        let accreditationEndDate: string | null = null;

        if (isSpecial && accreditationDuration) {
            const startDate = new Date();
            accreditationStartDate = startDate.toISOString().split('T')[0];
            accreditationEndDate = calculateAccreditationEndDate(startDate, accreditationDuration).toISOString().split('T')[0];
        }

        // Partnership oluştur (tüm RFR partnerler admin onayına gider)
        const [inserted] = await db
            .insert(institutionPartners)
            .values({
                institutionUserId: userId,
                externalPartnerId: externalPartner.id,
                status: 'pending', // Admin onayı gerekli
                accreditationStartDate,
                accreditationEndDate,
                accreditationDuration: isSpecial ? accreditationDuration : null,
            })
            .returning();

        return NextResponse.json({
            partnership: inserted,
            message: 'Partnership created, pending admin approval'
        }, { status: 201 });

    } catch (err: any) {
        console.error('POST /api/institution-partners error', err);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.'}, { status: 500 });
    }
}

// GET /api/institution-partners - Kurumun external partnerleri (süresi dolmuşları filtreleme seçenekli)
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { searchParams } = new URL(req.url);
        const includeExpired = searchParams.get('includeExpired') === 'true';

        const rows = await db
            .select({
                partnership: institutionPartners,
                partner: externalPartners,
            })
            .from(institutionPartners)
            .innerJoin(externalPartners, eq(institutionPartners.externalPartnerId, externalPartners.id))
            .where(eq(institutionPartners.institutionUserId, userId));

        const now = new Date();
        const threeMonthsFromNow = new Date(now);
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

        // Filter ve format
        const partnerships = rows
            .filter(row => {
                if (includeExpired) return true;

                // Special partner değilse veya accreditation yoksa göster
                const isSpecial = SPECIAL_PARTNER_IDS.includes(row.partner.publicId as any);
                if (!isSpecial || !row.partnership.accreditationEndDate) return true;

                // End date + 3 ay geçmişse gizle
                const endDate = new Date(row.partnership.accreditationEndDate);
                const expireDate = new Date(endDate);
                expireDate.setMonth(expireDate.getMonth() + 3);

                return expireDate > now;
            })
            .map(row => {
                const isSpecial = SPECIAL_PARTNER_IDS.includes(row.partner.publicId as any);
                const endDate = row.partnership.accreditationEndDate ? new Date(row.partnership.accreditationEndDate) : null;

                // Durum hesapla
                let accreditationStatus: 'active' | 'expiring_soon' | 'expired' | 'grace_period' | null = null;
                if (isSpecial && endDate) {
                    if (endDate > now) {
                        // 30 gün içinde bitecekse warning
                        const thirtyDaysFromNow = new Date(now);
                        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                        accreditationStatus = endDate <= thirtyDaysFromNow ? 'expiring_soon' : 'active';
                    } else {
                        // Süresi dolmuş - grace period kontrol
                        const graceEndDate = new Date(endDate);
                        graceEndDate.setMonth(graceEndDate.getMonth() + 3);
                        accreditationStatus = graceEndDate > now ? 'grace_period' : 'expired';
                    }
                }

                return {
                    id: row.partnership.id,
                    partnerId: row.partner.id,
                    partnerPublicId: row.partner.publicId,
                    partnerName: row.partner.name,
                    partnerLogo: row.partner.logo,
                    status: row.partnership.status,
                    isSpecialPartner: isSpecial,
                    accreditationStartDate: row.partnership.accreditationStartDate,
                    accreditationEndDate: row.partnership.accreditationEndDate,
                    accreditationDuration: row.partnership.accreditationDuration,
                    accreditationStatus,
                    createdAt: row.partnership.createdAt,
                };
            });

        return NextResponse.json({ partnerships }, { status: 200 });

    } catch (err: any) {
        console.error('GET /api/institution-partners error', err);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.'}, { status: 500 });
    }
}

// DELETE /api/institution-partners?id=UUID - Partnership sil
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const { searchParams } = new URL(req.url);
        const partnershipId = searchParams.get('id');

        if (!partnershipId) {
            return NextResponse.json({ error: 'Partnership ID required' }, { status: 400 });
        }

        const deleted = await db
            .delete(institutionPartners)
            .where(
                and(
                    eq(institutionPartners.id, partnershipId),
                    eq(institutionPartners.institutionUserId, userId)
                )
            )
            .returning();

        if (!deleted.length) {
            return NextResponse.json({ error: 'Partnership not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (err: any) {
        console.error('DELETE /api/institution-partners error', err);
        return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.'}, { status: 500 });
    }
}
