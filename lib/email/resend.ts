import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Check if Resend is configured
export const isResendConfigured = (): boolean => {
    return !!RESEND_API_KEY && RESEND_API_KEY.length > 10;
};

// Initialize Resend client (may be null if not configured)
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export default resend;

// Email sending configuration
export const EMAIL_CONFIG = {
    from: process.env.EMAIL_FROM || 'Mert CIN <mertcin0@outlook.com>',
    replyTo: process.env.EMAIL_REPLY_TO || 'mertcin0@outlook.com',
};

// Development mode check
export const isDevelopment = process.env.NODE_ENV === 'development';
