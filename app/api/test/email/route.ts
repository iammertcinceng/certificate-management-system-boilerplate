import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendEmail } from "@/lib/email/send";
import { isResendConfigured } from "@/lib/email/resend";
import type { WelcomeEmailData } from "@/lib/email/types";

/**
 * GET/POST /api/test/email
 * 
 * Test email sending functionality
 * ONLY available in development mode
 * 
 * GET: Returns email system status
 * POST: Sends a test email (Body: { email?: string })
 */

// GET - Check email system status
export async function GET() {
    // Block in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    const status = {
        resendConfigured: isResendConfigured(),
        resendApiKeySet: !!process.env.RESEND_API_KEY,
        emailFrom: process.env.EMAIL_FROM || 'Mert CIN <mertcin0@outlook.com>',
        nodeEnv: process.env.NODE_ENV,
        hint: isResendConfigured()
            ? "Email system ready. POST to this endpoint to send a test email."
            : "RESEND_API_KEY not configured. Add it to .env file.",
    };

    return NextResponse.json(status, { status: 200 });
}

// POST - Send test email
export async function POST(req: Request) {
    // Block in production
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: "Not available in production" }, { status: 403 });
    }

    try {
        // Auth check
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized - Please login first" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const testEmail = body.email || (session.user as any).email;

        if (!testEmail) {
            return NextResponse.json({ error: "Email address required" }, { status: 400 });
        }

        // Check if Resend API key is configured
        if (!isResendConfigured()) {
            return NextResponse.json({
                error: "RESEND_API_KEY not configured",
                hint: "Add RESEND_API_KEY to your .env file. Get one from https://resend.com",
                mockMode: true,
                wouldSendTo: testEmail
            }, { status: 503 });
        }

        // Send test welcome email
        const emailData: WelcomeEmailData = {
            templateId: 'WELCOME',
            recipientEmail: testEmail,
            recipientName: (session.user as any).name || 'Test User',
            language: 'tr',
            loginUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login`,
        };

        const result = await sendEmail(emailData, (session.user as any).id);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Test email sent to ${testEmail}`,
                template: 'WELCOME'
            }, { status: 200 });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
                hint: "Check your Resend API key and domain verification"
            }, { status: 500 });
        }

    } catch (err: any) {
        console.error("Test email error:", err);
        return NextResponse.json({
            error: err.message || "Failed to send test email"
        }, { status: 500 });
    }
}
