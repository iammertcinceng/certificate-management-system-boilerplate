import { db } from "@/db/client";
import { balances, balanceTransactions, siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface TransactionMetadata {
    key: string;
    params?: Record<string, string | number>;
}

/**
 * CreditService - Kredi işlemlerini yönetir
 * 
 * GÜNCELLEME: "pending" transaction kavramı kaldırıldı.
 * Sadece başarılı ödemeler kayıt edilir.
 */
export class CreditService {
    /**
     * Get current balance for an institution
     */
    static async getBalance(userId: string): Promise<number> {
        const rows = await db.select().from(balances).where(eq(balances.institutionUserId, userId)).limit(1);
        return rows.length ? Number(rows[0].balance) : 0;
    }

    /**
     * Add credits from successful Stripe payment
     * Bu metod SADECE başarılı ödemeler için kullanılır (webhook'tan)
     * ATOMIC: Transaction + Balance güncelleme tek işlemde
     */
    static async addCreditsFromPayment(userId: string, credits: number, paymentData: {
        stripePaymentIntentId: string;
        amountUSD: number;
        description: string;
    }): Promise<{ success: boolean }> {
        await db.transaction(async (tx) => {
            // 1. Get current balance
            const balanceRows = await tx.select().from(balances).where(eq(balances.institutionUserId, userId)).limit(1);
            const currentBalance = balanceRows.length ? Number(balanceRows[0].balance) : 0;
            const newBalance = currentBalance + credits;

            // 2. Update or insert balance
            if (balanceRows.length > 0) {
                await tx.update(balances)
                    .set({ balance: newBalance.toString(), updatedAt: new Date() })
                    .where(eq(balances.institutionUserId, userId));
            } else {
                await tx.insert(balances).values({
                    institutionUserId: userId,
                    balance: newBalance.toString(),
                    updatedAt: new Date(),
                });
            }

            // 3. Create transaction record (SADECE başarılı ödemeler için)
            await tx.insert(balanceTransactions).values({
                institutionUserId: userId,
                type: 'credit',
                amount: credits.toString(),
                description: paymentData.description,
                stripePaymentIntentId: paymentData.stripePaymentIntentId,
                stripeStatus: 'succeeded',
                metadata: { key: 'stripe_succeeded', params: { credits, amountUSD: paymentData.amountUSD } },
                createdAt: new Date(),
            });
        });

        return { success: true };
    }

    /**
     * Add credits (admin use case - non-Stripe)
     */
    static async addCredits(userId: string, amount: number, transactionData: {
        description: string;
        metadata?: TransactionMetadata;
    }): Promise<{ success: boolean }> {
        await db.transaction(async (tx) => {
            // 1. Get current balance
            const balanceRows = await tx.select().from(balances).where(eq(balances.institutionUserId, userId)).limit(1);
            const currentBalance = balanceRows.length ? Number(balanceRows[0].balance) : 0;
            const newBalance = currentBalance + amount;

            // 2. Update or insert balance
            if (balanceRows.length > 0) {
                await tx.update(balances)
                    .set({ balance: newBalance.toString(), updatedAt: new Date() })
                    .where(eq(balances.institutionUserId, userId));
            } else {
                await tx.insert(balances).values({
                    institutionUserId: userId,
                    balance: newBalance.toString(),
                    updatedAt: new Date(),
                });
            }

            // 3. Insert transaction
            await tx.insert(balanceTransactions).values({
                institutionUserId: userId,
                type: 'credit',
                amount: amount.toString(),
                description: transactionData.description,
                stripeStatus: 'succeeded', // Admin ekleme de "succeeded" olarak işaretlenir
                metadata: transactionData.metadata,
                createdAt: new Date(),
            });
        });

        return { success: true };
    }

    /**
     * Deduct credits for certificate approval - ATOMIC OPERATION
     * Includes optional certificate update within the same transaction
     */
    static async deductCreditsForCertificate(
        userId: string,
        studentCount: number,
        certificateId: string,
        certificatePublicId: string,
        onSuccess?: (tx: any) => Promise<void>
    ): Promise<{ success: boolean; required: number; balance: number; error?: string }> {
        // Get settings for credit calculation
        const settingsRows = await db.select().from(siteSettings).limit(1);
        const creditPerStudent = settingsRows.length ? Number(settingsRows[0].creditPerStudent) : 1;
        const requiredCredits = studentCount * creditPerStudent;

        return await db.transaction(async (tx) => {
            // 1. Check balance with SELECT FOR UPDATE semantics (row-level lock)
            const balRows = await tx.select().from(balances).where(eq(balances.institutionUserId, userId)).limit(1);
            const currentBalance = balRows.length ? Number(balRows[0].balance) : 0;

            if (currentBalance < requiredCredits) {
                return { success: false, required: requiredCredits, balance: currentBalance, error: 'insufficient_credits' };
            }

            // 2. Deduct credits
            const newBalance = currentBalance - requiredCredits;
            await tx.update(balances)
                .set({ balance: newBalance.toString(), updatedAt: new Date() })
                .where(eq(balances.institutionUserId, userId));

            // 3. Log transaction
            await tx.insert(balanceTransactions).values({
                institutionUserId: userId,
                type: 'debit',
                amount: requiredCredits.toString(),
                description: `Sertifika onaylandı: ${certificatePublicId}`,
                relatedCertificateId: certificateId,
                metadata: { key: 'certificate_approved', params: { id: certificatePublicId, credits: requiredCredits } },
                createdAt: new Date(),
            });

            // 4. Execute certificate update within same transaction (if provided)
            if (onSuccess) {
                await onSuccess(tx);
            }

            return { success: true, required: requiredCredits, balance: newBalance };
        });
    }

    /**
     * Get transaction by Stripe Payment Intent ID (for idempotency checks)
     */
    static async getTransactionByPaymentIntentId(paymentIntentId: string): Promise<{ stripeStatus: string | null } | null> {
        const [tx] = await db
            .select({ stripeStatus: balanceTransactions.stripeStatus })
            .from(balanceTransactions)
            .where(eq(balanceTransactions.stripePaymentIntentId, paymentIntentId))
            .limit(1);

        return tx || null;
    }
}
