import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, approvalCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/approvals/uia-codes
// Save UIA codes for students
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string | undefined;
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 400 });

    const body = await req.json();
    const { certificateId, codes } = body as { 
      certificateId: string; 
      codes: Array<{ studentId: string; approvalCode: string }> 
    };

    if (!certificateId || !codes || !Array.isArray(codes)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Verify certificate exists and user is UIA responsible
    const cert = await db
      .select()
      .from(certificates)
      .where(eq(certificates.publicId, certificateId))
      .limit(1);

    if (!cert.length) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const certificate = cert[0] as any;
    if (certificate.uiaResponsibleId !== userId) {
      return NextResponse.json({ error: "Not authorized for this certificate" }, { status: 403 });
    }

    // Upsert UIA codes
    for (const { studentId, approvalCode } of codes) {
      if (!approvalCode || !approvalCode.trim()) continue;

      // Check if code already exists
      const existing = await db
        .select()
        .from(approvalCodes)
        .where(
          and(
            eq(approvalCodes.certificateId, certificate.id),
            eq(approvalCodes.studentId, studentId)
          )
        )
        .limit(1);

      if (existing.length) {
        // Update
        await db
          .update(approvalCodes)
          .set({ 
            approvalCode: approvalCode.trim(),
            updatedAt: new Date()
          })
          .where(eq(approvalCodes.id, existing[0].id));
      } else {
        // Insert
        await db.insert(approvalCodes).values({
          certificateId: certificate.id,
          studentId,
          approvalCode: approvalCode.trim(),
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('POST /api/approvals/uia-codes error', err);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
