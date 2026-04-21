// Email template IDs
export type EmailTemplateId =
    // Certificate lifecycle
    | 'CERT_APPROVED'
    | 'CERT_REJECTED'
    | 'CERT_PENDING_PARTNER'
    | 'CERT_CREATED'
    | 'CERT_READY_MANUAL'
    // Balance
    | 'LOW_BALANCE'
    | 'BALANCE_LOADED'
    | 'CREDIT_DEDUCTED'
    // Account
    | 'PASSWORD_RESET'
    | 'WELCOME'
    // Partner
    | 'PARTNER_REQUEST'
    | 'ACCRED_REMINDER'
    | 'ACCRED_EXPIRED';

// Email status
export type EmailStatus = 'sent' | 'failed' | 'pending';

// Base email data interface
export interface BaseEmailData {
    recipientEmail: string;
    recipientName?: string;
    language?: 'tr' | 'en';
}

// Certificate approved email data
export interface CertificateApprovedEmailData extends BaseEmailData {
    templateId: 'CERT_APPROVED';
    certificatePublicId: string;
    trainingName: string;
    issueDate: string;
    verificationUrl: string;
}

// Certificate rejected email data
export interface CertificateRejectedEmailData extends BaseEmailData {
    templateId: 'CERT_REJECTED';
    certificatePublicId: string;
    trainingName: string;
    rejectionReason?: string;
}

// Certificate ready (manual) email data
export interface CertificateReadyEmailData extends BaseEmailData {
    templateId: 'CERT_READY_MANUAL';
    certificatePublicId: string;
    trainingName: string;
    studentName: string;
    verificationUrl: string;
    institutionName: string;
    verificationCode?: string; // Student's verify code (verifyBaseKey + sequence)
}

// Partner approval request email data
export interface PartnerApprovalRequestEmailData extends BaseEmailData {
    templateId: 'CERT_PENDING_PARTNER';
    certificatePublicId: string;
    trainingName: string;
    institutionName: string;
    approvalUrl: string;
}

// Certificate created email data
export interface CertificateCreatedEmailData extends BaseEmailData {
    templateId: 'CERT_CREATED';
    certificatePublicId: string;
    trainingName: string;
    studentCount: number;
    approvalUrl: string;
}

// Low balance warning email data
export interface LowBalanceEmailData extends BaseEmailData {
    templateId: 'LOW_BALANCE';
    currentBalance: number;
    threshold: number;
    topUpUrl: string;
}

// Balance loaded email data
export interface BalanceLoadedEmailData extends BaseEmailData {
    templateId: 'BALANCE_LOADED';
    amount: number;
    newBalance: number;
}

// Credit deducted email data
export interface CreditDeductedEmailData extends BaseEmailData {
    templateId: 'CREDIT_DEDUCTED';
    certificatePublicId: string;
    creditsUsed: number;
    remainingCredits: number;
}

// Password reset email data
export interface PasswordResetEmailData extends BaseEmailData {
    templateId: 'PASSWORD_RESET';
    resetUrl: string;
    expiresIn: string;
}

// Welcome email data
export interface WelcomeEmailData extends BaseEmailData {
    templateId: 'WELCOME';
    organizationName?: string;
    loginUrl: string;
}

// Partner request email data
export interface PartnerRequestEmailData extends BaseEmailData {
    templateId: 'PARTNER_REQUEST';
    requesterName: string;
    requesterOrganization: string;
    acceptUrl: string;
}

// Accreditation reminder email data
export interface AccreditationReminderEmailData extends BaseEmailData {
    templateId: 'ACCRED_REMINDER';
    partnerName: string;
    daysRemaining: number;
    expirationDate: string;
    renewUrl: string;
}

// Accreditation expired email data
export interface AccreditationExpiredEmailData extends BaseEmailData {
    templateId: 'ACCRED_EXPIRED';
    partnerName: string;
    daysSinceExpiry: number;
    expirationDate: string;
    renewUrl: string;
    isUrgent: boolean;
}

// Union type for all email data
export type EmailData =
    | CertificateApprovedEmailData
    | CertificateRejectedEmailData
    | CertificateReadyEmailData
    | PartnerApprovalRequestEmailData
    | CertificateCreatedEmailData
    | LowBalanceEmailData
    | BalanceLoadedEmailData
    | CreditDeductedEmailData
    | PasswordResetEmailData
    | WelcomeEmailData
    | PartnerRequestEmailData
    | AccreditationReminderEmailData
    | AccreditationExpiredEmailData;

// Email log entry
export interface EmailLogEntry {
    templateId: EmailTemplateId;
    recipientEmail: string;
    recipientUserId?: string;
    subject: string;
    status: EmailStatus;
    metadata?: Record<string, unknown>;
    errorMessage?: string;
    sentAt?: Date;
}

// Accreditation reminder days configuration
export const ACCREDITATION_REMINDER_DAYS = {
    beforeExpiry: [-60, -30, -14, -7, -3, -1],
    afterExpiry: [30, 60, 83, 87, 89, 90],
} as const;
