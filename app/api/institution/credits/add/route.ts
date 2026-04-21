import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db/client';
import { balances, balanceTransactions, creditPackages } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * POST /api/institution/credits/add
 * Test modu: Kurum kendi hesabına kredi yükler (Stripe entegrasyonu olmadan)
 * Gerçek üretimde bu API Stripe webhook'u tarafından tetiklenmeli!
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as { id?: string; role?: string } | undefined;

        if (!user?.id) {
            return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
        }

        if (user.role !== 'institution' && user.role !== 'admin') {
            return NextResponse.json({ error: 'Bu işlem için yetkiniz yok' }, { status: 403 });
        }

        const body = await req.json();
        const { credits, packageId } = body;

        if (!credits || typeof credits !== 'number' || credits <= 0) {
            return NextResponse.json({ error: 'Geçersiz kredi miktarı' }, { status: 400 });
        }

        // Verify package exists (optional but recommended)
        let packageInfo = null;
        if (packageId) {
            const pkg = await db.select().from(creditPackages).where(eq(creditPackages.id, packageId)).limit(1);
            if (pkg.length > 0) {
                packageInfo = pkg[0];
            }
        }

        // Get or create balance record for institution
        const existingBalance = await db.select().from(balances).where(eq(balances.institutionUserId, user.id)).limit(1);

        if (existingBalance.length === 0) {
            // Create new balance record
            await db.insert(balances).values({
                id: randomUUID(),
                institutionUserId: user.id,
                balance: credits.toString(),
            });
        } else {
            // Update existing balance
            await db.update(balances)
                .set({
                    balance: sql`${balances.balance} + ${credits}`,
                    updatedAt: new Date(),
                })
                .where(eq(balances.institutionUserId, user.id));
        }

        // Create transaction record
        const description = packageInfo
            ? `Kredi yüklendi: ${credits} kredi ($${packageInfo.priceUsd})`
            : `Kredi yüklendi: ${credits} kredi`;

        await db.insert(balanceTransactions).values({
            institutionUserId: user.id,
            type: 'credit',
            amount: credits.toString(),
            description,
            metadata: {
                key: 'credit_purchase',
                params: {
                    credits,
                    ...(packageId && { packageId }),
                    ...(packageInfo?.priceUsd && { priceUsd: Number(packageInfo.priceUsd) }),
                    testMode: 1, // Indicates this is test mode without real payment (1=true, 0=false)
                },
            },
        });

        // Get updated balance
        const updatedBalance = await db.select().from(balances).where(eq(balances.institutionUserId, user.id)).limit(1);
        const newBalance = updatedBalance.length > 0 ? Number(updatedBalance[0].balance) : credits;

        return NextResponse.json({
            success: true,
            credits,
            newBalance,
            message: `${credits} kredi başarıyla yüklendi.`,
        });
    } catch (error) {
        console.error('Credit add error:', error);
        return NextResponse.json({ error: 'Kredi yüklenirken bir hata oluştu' }, { status: 500 });
    }
}
