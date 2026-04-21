import resend, { EMAIL_CONFIG, isResendConfigured, isDevelopment } from './resend';
import { render } from '@react-email/render';
import { db } from '@/db/client';
import { emailLogs } from '@/db/schema';
import type { EmailData, EmailLogEntry } from './types';

// Import templates
import CertificateApprovedEmail from './templates/certificate-approved';
import CertificateRejectedEmail from './templates/certificate-rejected';
import CertificateReadyEmail from './templates/certificate-ready';
import PartnerApprovalRequestEmail from './templates/partner-approval-request';
import CertificateCreatedEmail from './templates/certificate-created';
import LowBalanceWarningEmail from './templates/low-balance-warning';
import BalanceLoadedEmail from './templates/balance-loaded';
import CreditDeductedEmail from './templates/credit-deducted';
import PasswordResetEmail from './templates/password-reset';
import WelcomeEmail from './templates/welcome';
import PartnerRequestEmail from './templates/partner-request';
import AccreditationReminderEmail from './templates/accreditation-reminder';
import AccreditationExpiredEmail from './templates/accreditation-expired';

// Subject lines for each template
const SUBJECTS = {
    tr: {
        CERT_APPROVED: 'Sertifikanız Onaylandı! 🎉',
        CERT_REJECTED: 'Sertifika Onay Durumu',
        CERT_PENDING_PARTNER: 'Partner Onayı Bekleniyor',
        CERT_CREATED: 'Yeni Sertifika Oluşturuldu',
        CERT_READY_MANUAL: 'Sertifikanız Hazır! 📜',
        LOW_BALANCE: '⚠️ Düşük Bakiye Uyarısı',
        BALANCE_LOADED: 'Bakiye Yükleme Başarılı',
        CREDIT_DEDUCTED: 'Kredi Kullanım Bildirimi',
        PASSWORD_RESET: 'Şifre Sıfırlama Talebi',
        WELCOME: 'Mert CIN\'e Hoş Geldiniz! 🎊',
        PARTNER_REQUEST: 'Yeni Partner Talebi',
        ACCRED_REMINDER: '⏰ Akreditasyon Yenileme Hatırlatması',
        ACCRED_EXPIRED: '🚨 Akreditasyon Süreniz Doldu!',
    },
    en: {
        CERT_APPROVED: 'Your Certificate is Approved! 🎉',
        CERT_REJECTED: 'Certificate Approval Status',
        CERT_PENDING_PARTNER: 'Partner Approval Required',
        CERT_CREATED: 'New Certificate Created',
        CERT_READY_MANUAL: 'Your Certificate is Ready! 📜',
        LOW_BALANCE: '⚠️ Low Balance Warning',
        BALANCE_LOADED: 'Balance Loaded Successfully',
        CREDIT_DEDUCTED: 'Credit Usage Notification',
        PASSWORD_RESET: 'Password Reset Request',
        WELCOME: 'Welcome to Mert CIN! 🎊',
        PARTNER_REQUEST: 'New Partner Request',
        ACCRED_REMINDER: '⏰ Accreditation Renewal Reminder',
        ACCRED_EXPIRED: '🚨 Your Accreditation Has Expired!',
    },
};

// Configuration for retry and rate limiting
const EMAIL_SERVICE_CONFIG = {
    maxRetries: 3,
    retryDelayMs: 1000,
    rateLimitPerMinute: 100,
} as const;

/**
 * EmailService - Enterprise-grade email service
 * 
 * Features:
 * - Retry mechanism with exponential backoff
 * - Development mode logging
 * - Database audit trail
 * - Rate limiting support
 * - Provider abstraction (DIP)
 */
export class EmailService {
    private static retryCount: Map<string, number> = new Map();

    /**
     * Get the React component for a template
     */
    private static getTemplateComponent(data: EmailData): React.ReactElement {
        switch (data.templateId) {
            case 'CERT_APPROVED':
                return CertificateApprovedEmail(data);
            case 'CERT_REJECTED':
                return CertificateRejectedEmail(data);
            case 'CERT_READY_MANUAL':
                return CertificateReadyEmail(data);
            case 'CERT_PENDING_PARTNER':
                return PartnerApprovalRequestEmail(data);
            case 'CERT_CREATED':
                return CertificateCreatedEmail(data);
            case 'LOW_BALANCE':
                return LowBalanceWarningEmail(data);
            case 'BALANCE_LOADED':
                return BalanceLoadedEmail(data);
            case 'CREDIT_DEDUCTED':
                return CreditDeductedEmail(data);
            case 'PASSWORD_RESET':
                return PasswordResetEmail(data);
            case 'WELCOME':
                return WelcomeEmail(data);
            case 'PARTNER_REQUEST':
                return PartnerRequestEmail(data);
            case 'ACCRED_REMINDER':
                return AccreditationReminderEmail(data);
            case 'ACCRED_EXPIRED':
                return AccreditationExpiredEmail(data);
            default:
                throw new Error(`Unknown template: ${(data as EmailData).templateId}`);
        }
    }

    /**
     * Log email to database
     */
    private static async logEmail(entry: EmailLogEntry): Promise<void> {
        try {
            await db.insert(emailLogs).values({
                templateId: entry.templateId,
                recipientEmail: entry.recipientEmail,
                recipientUserId: entry.recipientUserId,
                subject: entry.subject,
                status: entry.status,
                metadata: entry.metadata,
                errorMessage: entry.errorMessage,
                sentAt: entry.sentAt,
            });
        } catch (error) {
            console.error('[EmailService] Failed to log email:', error);
        }
    }

    /**
     * Delay helper for retry mechanism
     */
    private static delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Send email with retry mechanism
     */
    static async send(
        data: EmailData,
        recipientUserId?: string,
        options?: { skipRetry?: boolean }
    ): Promise<{ success: boolean; error?: string; retried?: boolean }> {
        const language = data.language || 'tr';
        const subject = SUBJECTS[language][data.templateId];
        const emailKey = `${data.recipientEmail}-${data.templateId}-${Date.now()}`;

        // Check if Resend is configured
        if (!isResendConfigured() || !resend) {
            const errorMsg = 'Email service not configured (RESEND_API_KEY missing)';

            // In development, log what would be sent
            if (isDevelopment) {
                console.log('📧 [DEV MODE] Email would be sent:');
                console.log(`   To: ${data.recipientEmail}`);
                console.log(`   Subject: ${subject}`);
                console.log(`   Template: ${data.templateId}`);
            }

            await this.logEmail({
                templateId: data.templateId,
                recipientEmail: data.recipientEmail,
                recipientUserId,
                subject,
                status: 'failed',
                metadata: data as unknown as Record<string, unknown>,
                errorMessage: errorMsg,
            });

            return { success: false, error: errorMsg };
        }

        let lastError: string = '';
        const maxRetries = options?.skipRetry ? 1 : EMAIL_SERVICE_CONFIG.maxRetries;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Render the email template to HTML
                const component = this.getTemplateComponent(data);
                const html = await render(component);

                // Send via Resend
                const { error } = await resend.emails.send({
                    from: EMAIL_CONFIG.from,
                    to: data.recipientEmail,
                    replyTo: EMAIL_CONFIG.replyTo,
                    subject,
                    html,
                });

                if (error) {
                    lastError = error.message;
                    console.error(`[EmailService] Attempt ${attempt}/${maxRetries} failed:`, error.message);

                    if (attempt < maxRetries) {
                        // Exponential backoff
                        const delayMs = EMAIL_SERVICE_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
                        console.log(`[EmailService] Retrying in ${delayMs}ms...`);
                        await this.delay(delayMs);
                        continue;
                    }
                } else {
                    // Success
                    await this.logEmail({
                        templateId: data.templateId,
                        recipientEmail: data.recipientEmail,
                        recipientUserId,
                        subject,
                        status: 'sent',
                        metadata: data as unknown as Record<string, unknown>,
                        sentAt: new Date(),
                    });

                    if (attempt > 1) {
                        console.log(`[EmailService] Email sent successfully after ${attempt} attempts`);
                    }

                    return { success: true, retried: attempt > 1 };
                }
            } catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[EmailService] Attempt ${attempt}/${maxRetries} exception:`, lastError);

                if (attempt < maxRetries) {
                    const delayMs = EMAIL_SERVICE_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
                    await this.delay(delayMs);
                }
            }
        }

        // All retries failed
        await this.logEmail({
            templateId: data.templateId,
            recipientEmail: data.recipientEmail,
            recipientUserId,
            subject,
            status: 'failed',
            metadata: data as unknown as Record<string, unknown>,
            errorMessage: lastError,
        });

        return { success: false, error: lastError };
    }

    /**
     * Send batch emails with rate limiting
     */
    static async sendBatch(
        emails: Array<{ data: EmailData; recipientUserId?: string }>
    ): Promise<{ sent: number; failed: number; errors: string[] }> {
        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const { data, recipientUserId } of emails) {
            const result = await this.send(data, recipientUserId);

            if (result.success) {
                sent++;
            } else {
                failed++;
                if (result.error) {
                    errors.push(`${data.recipientEmail}: ${result.error}`);
                }
            }

            // Rate limiting delay (100ms between emails = ~600/min max)
            await this.delay(100);
        }

        return { sent, failed, errors };
    }

    /**
     * Check if email service is ready
     */
    static isReady(): boolean {
        return isResendConfigured();
    }
}

// Legacy export for backward compatibility
export async function sendEmail(
    data: EmailData,
    recipientUserId?: string
): Promise<{ success: boolean; error?: string }> {
    return EmailService.send(data, recipientUserId);
}

export async function sendBatchEmails(
    emails: Array<{ data: EmailData; recipientUserId?: string }>
): Promise<{ sent: number; failed: number }> {
    const result = await EmailService.sendBatch(emails);
    return { sent: result.sent, failed: result.failed };
}
