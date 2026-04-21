import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { institutionPartners, externalPartners, organizations, users, accreditationRemindersSent } from "@/db/schema";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import type { AccreditationReminderEmailData, AccreditationExpiredEmailData } from "@/lib/email/types";
import { isSpecialPartner } from "@/utils/specialPartners";

// Configurations
const REMINDER_DAYS_BEFORE = [60, 30, 14, 7, 3, 1]; // Days before expiry
const REMINDER_DAYS_AFTER = [30, 60, 83, 87, 89, 90]; // Days after expiry

// Security header name for cron authorization
const CRON_SECRET_HEADER = 'x-cron-secret';

// Helper to calculate days difference
const getDaysDifference = (from: Date, to: Date): number => {
    const diffTime = to.getTime() - from.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// GET /api/cron/accreditation-reminders
// This endpoint should be called daily by a scheduler (PM2, Linux cron, etc.)
// Optional security: Add x-cron-secret header with CRON_SECRET env value
export async function GET(req: Request) {
    try {
        // Optional: Verify cron secret
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret) {
            const headerSecret = req.headers.get(CRON_SECRET_HEADER);
            if (headerSecret !== cronSecret) {
                console.warn('Unauthorized cron request attempt');
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Fetch all institution-partner relationships with accreditation dates
        // Only for special partners (RFR-000001, RFR-000002) that have accreditation
        const partnerships = await db
            .select({
                id: institutionPartners.id,
                institutionUserId: institutionPartners.institutionUserId,
                accreditationEndDate: institutionPartners.accreditationEndDate,
                partnerPublicId: externalPartners.publicId,
                partnerName: externalPartners.name,
                institutionEmail: users.email,
                institutionName: organizations.name,
            })
            .from(institutionPartners)
            .innerJoin(externalPartners, eq(institutionPartners.externalPartnerId, externalPartners.id))
            .innerJoin(users, eq(institutionPartners.institutionUserId, users.id))
            .innerJoin(organizations, eq(institutionPartners.institutionUserId, organizations.userId))
            .where(and(
                eq(institutionPartners.status, 'approved'),
                isNotNull(institutionPartners.accreditationEndDate)
            ));

        let sentCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        for (const p of partnerships) {
            // Only process special partners (RFR-000001, RFR-000002)
            if (!isSpecialPartner(p.partnerPublicId)) {
                continue;
            }

            if (!p.accreditationEndDate) continue;

            const expiryDate = new Date(p.accreditationEndDate);
            expiryDate.setHours(0, 0, 0, 0);
            const daysDiff = getDaysDifference(today, expiryDate);

            // Positive means days remaining (before expiry)
            // Negative means days since expiry (after expiry)
            const daysRemaining = daysDiff;
            const daysSinceExpiry = -daysDiff;

            let shouldSend = false;
            let template: 'ACCRED_REMINDER' | 'ACCRED_EXPIRED' | null = null;
            let reminderDayKey = 0;

            // Check if we need to send a reminder (before expiry)
            if (daysRemaining > 0 && REMINDER_DAYS_BEFORE.includes(daysRemaining)) {
                shouldSend = true;
                template = 'ACCRED_REMINDER';
                reminderDayKey = -daysRemaining; // Negative for "before expiry" tracking, e.g. -60
            }
            // Check if we need to send an expired warning (after expiry)
            else if (daysSinceExpiry > 0 && REMINDER_DAYS_AFTER.includes(daysSinceExpiry)) {
                shouldSend = true;
                template = 'ACCRED_EXPIRED';
                reminderDayKey = daysSinceExpiry; // Positive for "after expiry" tracking, e.g. 30
            }

            if (shouldSend && template) {
                // Check if already sent for this partnership and day
                const alreadySent = await db
                    .select({ id: accreditationRemindersSent.id })
                    .from(accreditationRemindersSent)
                    .where(and(
                        eq(accreditationRemindersSent.partnershipId, p.id),
                        eq(accreditationRemindersSent.reminderDay, reminderDayKey)
                    ))
                    .limit(1);

                if (alreadySent.length > 0) {
                    skippedCount++;
                    continue; // Already sent, skip
                }

                // Send the email
                const renewUrl = `${process.env.NEXTAUTH_URL || 'https://mertcin.com'}/institution/partners`;

                try {
                    if (template === 'ACCRED_REMINDER') {
                        const emailData: AccreditationReminderEmailData = {
                            templateId: 'ACCRED_REMINDER',
                            recipientEmail: p.institutionEmail,
                            language: 'tr',
                            partnerName: p.partnerName,
                            daysRemaining: daysRemaining,
                            expirationDate: expiryDate.toLocaleDateString('tr-TR'),
                            renewUrl
                        };
                        await sendEmail(emailData, p.institutionUserId);
                    } else {
                        const emailData: AccreditationExpiredEmailData = {
                            templateId: 'ACCRED_EXPIRED',
                            recipientEmail: p.institutionEmail,
                            language: 'tr',
                            partnerName: p.partnerName,
                            daysSinceExpiry: daysSinceExpiry,
                            expirationDate: expiryDate.toLocaleDateString('tr-TR'),
                            renewUrl,
                            isUrgent: daysSinceExpiry >= 60
                        };
                        await sendEmail(emailData, p.institutionUserId);
                    }

                    // Record that we sent this reminder
                    await db.insert(accreditationRemindersSent).values({
                        partnershipId: p.id,
                        reminderDay: reminderDayKey
                    });

                    sentCount++;
                    console.log(`Sent ${template} email to ${p.institutionEmail} for ${p.partnerName} (day: ${reminderDayKey})`);

                } catch (emailErr: any) {
                    errors.push(`Failed to send to ${p.institutionEmail}: ${emailErr.message}`);
                    console.error(`Email send error for ${p.institutionEmail}:`, emailErr);
                }
            }
        }

        return NextResponse.json({
            success: true,
            processed: partnerships.length,
            sent: sentCount,
            skipped: skippedCount,
            errors: errors.length > 0 ? errors : undefined,
            timestamp: new Date().toISOString()
        }, { status: 200 });

    } catch (err: any) {
        console.error("Cron accreditation-reminders error:", err);
        return NextResponse.json({
            error: "İşlem sırasında bir hata oluştu.",
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}