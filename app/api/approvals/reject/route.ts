import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, certificatePartners } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/approvals/reject
// Reject a certificate as a partner
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string | undefined;
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 400 });

    const body = await req.json();
    const { certificateId } = body as { certificateId: string };

    if (!certificateId) {
      return NextResponse.json({ error: "Certificate ID required" }, { status: 400 });
    }

    // Get certificate
    const cert = await db
      .select()
      .from(certificates)
      .where(eq(certificates.publicId, certificateId))
      .limit(1);

    if (!cert.length) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const certificate = cert[0] as any;

    // Verify user is a partner for this certificate
    const partnerRel = await db
      .select()
      .from(certificatePartners)
      .where(
        and(
          eq(certificatePartners.certificateId, certificate.id),
          eq(certificatePartners.partnerUserId, userId)
        )
      )
      .limit(1);

    if (!partnerRel.length) {
      return NextResponse.json({ error: "Not a partner for this certificate" }, { status: 403 });
    }

    // Update certificate status to rejected
    await db
      .update(certificates)
      .set({ 
        status: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(certificates.id, certificate.id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error('POST /api/approvals/reject error', err);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
