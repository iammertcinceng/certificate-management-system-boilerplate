import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db/client";
import { certificates, trainings, balances, balanceTransactions, siteSettings } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { CreditService } from "@/lib/services/credit.service";
import { sendEmail } from "@/lib/email/send";
import type { CreditDeductedEmailData, LowBalanceEmailData } from "@/lib/email/types";

// GET /api/certificates/approvals
// List certificates that need INSTITUTION approval for the current institution
// Query params:
//   ?history=true - Get approval history (approved + rejected certificates)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const showHistory = searchParams.get('history') === 'true';

    let whereCondition;
    if (showHistory) {
      // History: Show approved or rejected certificates
      whereCondition = and(
        eq(certificates.institutionUserId, userId),
        or(
          eq(certificates.status, 'approved'),
          eq(certificates.status, 'rejected')
        )
      );
    } else {
      // Pending: Show certificates that need institution approval
      whereCondition = and(
        eq(certificates.institutionUserId, userId),
        eq(certificates.institutionApproved, false),
        eq(certificates.status, 'pending')
      );
    }

    const rows = await db
      .select({
        certId: certificates.id,
        certPublicId: certificates.publicId,
        certTrainingId: certificates.trainingId,
        certDateIssued: certificates.dateIssued,
        certStatus: certificates.status,
        certUpperRequired: certificates.uiaRequired,
        certInstitutionApproved: certificates.institutionApproved,
        certStudentCount: certificates.studentCount,
        certCreatedAt: certificates.createdAt,
        certUpdatedAt: certificates.updatedAt,
        training: trainings,
      })
      .from(certificates)
      .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
      .where(whereCondition)
      .orderBy(certificates.createdAt);

    // Get credit per student from site settings
    const settingsRows = await db.select().from(siteSettings).limit(1);
    const creditPerStudent = settingsRows.length ? Number(settingsRows[0].creditPerStudent) : 1;

    const items = rows.map(r => ({
      id: r.certId,
      publicId: r.certPublicId,
      trainingName: r.training?.name || '-',
      dateIssued: r.certDateIssued,
      status: r.certStatus,
      uiaRequired: r.certUpperRequired,
      institutionApproved: r.certInstitutionApproved,
      studentCount: parseInt(r.certStudentCount || "1", 10),
      creditsPerStudent: creditPerStudent,
      createdAt: r.certCreatedAt,
      updatedAt: r.certUpdatedAt,
    }));

    return NextResponse.json({ approvals: items }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/certificates/approvals error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

// POST /api/certificates/approvals
// Body: { id: string, action: 'approve'|'reject' }
// On approve: Deducts 1 credit from institution balance
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const body = await req.json();
    const { id, action } = body || {};
    if (!id || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'id and valid action required' }, { status: 400 });
    }

    // Verify certificate exists and belongs to this institution
    const [cert] = await db
      .select({
        id: certificates.id,
        publicId: certificates.publicId,
        status: certificates.status,
        studentCount: certificates.studentCount
      })
      .from(certificates)
      .where(and(eq(certificates.id, id), eq(certificates.institutionUserId, userId)))
      .limit(1);

    if (!cert) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    // If approving, check and deduct credit (ATOMIC with certificate update)
    if (action === 'approve') {
      const studentCount = parseInt(cert.studentCount || "1", 10);

      const creditResult = await CreditService.deductCreditsForCertificate(
        userId,
        studentCount,
        cert.id,
        cert.publicId,
        // This callback runs WITHIN the same database transaction
        async (tx) => {
          await tx
            .update(certificates)
            .set({
              institutionApproved: true,
              status: 'pending',
              updatedAt: new Date()
            })
            .where(and(eq(certificates.id, id), eq(certificates.institutionUserId, userId)));
        }
      );

      if (!creditResult.success) {
        return NextResponse.json({
          error: creditResult.error,
          required: creditResult.required,
          balance: creditResult.balance,
          message: `Bu işlem için ${creditResult.required} kredi gerekiyor. Mevcut: ${creditResult.balance} kredi`
        }, { status: 402 });
      }

      const newBalance = creditResult.balance;
      const requiredCredits = creditResult.required;

      // --- EMAIL NOTIFICATIONS (outside transaction, non-blocking) ---
      try {
        const currentUser = session.user as any;
        const userEmail = currentUser.email;

        // 1. Credit Deducted Email
        const creditEmailData: CreditDeductedEmailData = {
          templateId: 'CREDIT_DEDUCTED',
          recipientEmail: userEmail,
          language: 'tr',
          certificatePublicId: cert.publicId,
          creditsUsed: requiredCredits,
          remainingCredits: newBalance,
        };
        sendEmail(creditEmailData, userId).catch(err => console.error('Credit deducted email error:', err));

        // 2. Low Balance Warning (if below threshold)
        const settingsRows = await db.select().from(siteSettings).limit(1);
        const threshold = settingsRows.length ? settingsRows[0].creditThreshold : 10;

        if (newBalance <= threshold && newBalance >= 0) {
          const lowBalanceEmailData: LowBalanceEmailData = {
            templateId: 'LOW_BALANCE',
            recipientEmail: userEmail,
            language: 'tr',
            currentBalance: newBalance,
            threshold: threshold,
            topUpUrl: `${process.env.NEXTAUTH_URL || 'https://mertcin.com'}/institution/credits`,
          };
          sendEmail(lowBalanceEmailData, userId).catch(err => console.error('Low balance email error:', err));
        }
      } catch (emailErr) {
        console.error('Email notification error:', emailErr);
      }

      return NextResponse.json({ success: true, creditsUsed: requiredCredits }, { status: 200 });
    }

    // If rejecting (no credit operation needed)
    const updated = await db
      .update(certificates)
      .set({
        institutionApproved: false,
        status: 'rejected',
        updatedAt: new Date()
      })
      .where(and(eq(certificates.id, id), eq(certificates.institutionUserId, userId)))
      .returning();

    if (!updated.length) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/certificates/approvals error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

// PUT /api/certificates/approvals
// Resubmit a rejected certificate for approval
// Body: { id: string }
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    const body = await req.json();
    const { id } = body || {};
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Verify certificate exists, belongs to this institution, and is rejected
    const [cert] = await db
      .select({ id: certificates.id, status: certificates.status })
      .from(certificates)
      .where(and(eq(certificates.id, id), eq(certificates.institutionUserId, userId)))
      .limit(1);

    if (!cert) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
    }

    if (cert.status !== 'rejected') {
      return NextResponse.json({ error: 'Only rejected certificates can be resubmitted' }, { status: 400 });
    }

    // Reset status to pending for re-approval
    const updated = await db
      .update(certificates)
      .set({
        status: 'pending',
        institutionApproved: false,
        updatedAt: new Date()
      })
      .where(and(eq(certificates.id, id), eq(certificates.institutionUserId, userId)))
      .returning();

    if (!updated.length) return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/certificates/approvals error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
