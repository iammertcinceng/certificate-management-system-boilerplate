import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db/client";
import { certificates, trainings, organizations, certificatePartners } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/certificates/partner-approvals
// List certificates that need PARTNER approval where current user is a partner
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    // Check if user is a partner
    const orgRows = await db.select().from(organizations).where(eq(organizations.userId, userId)).limit(1);
    if (!orgRows.length || !orgRows[0].isPartner) {
      return NextResponse.json({ approvals: [] }, { status: 200 });
    }

    // Find certificates where this user is listed as a partner and needs partner approval
    const partnerCerts = await db
      .select({ certificateId: certificatePartners.certificateId })
      .from(certificatePartners)
      .where(eq(certificatePartners.partnerUserId, userId));

    if (partnerCerts.length === 0) {
      return NextResponse.json({ approvals: [] }, { status: 200 });
    }

    const certIds = partnerCerts.map(pc => pc.certificateId);

    const rows = await db
      .select({ 
        cert: certificates, 
        training: trainings,
        institution: organizations
      })
      .from(certificates)
      .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
      .leftJoin(organizations, eq(certificates.institutionUserId, organizations.userId))
      .where(
        and(
          inArray(certificates.id, certIds),
          eq(certificates.institutionApproved, true), // Institution already approved
          eq(certificates.partnerApproved, false), // Partner not yet approved
          eq(certificates.status, 'pending') // Only show pending certificates
        )
      )
      .orderBy(certificates.createdAt);

    const items = rows.map(r => ({
      id: r.cert.id,
      publicId: r.cert.publicId,
      trainingName: r.training?.name || '-',
      institutionName: r.institution?.name || '-',
      dateIssued: r.cert.dateIssued,
      status: r.cert.status,
      uiaRequired: r.cert.uiaRequired,
      createdAt: r.cert.createdAt,
    }));

    return NextResponse.json({ approvals: items }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/certificates/partner-approvals error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

// POST /api/certificates/partner-approvals
// Body: { id: string, action: 'approve'|'reject' }
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    // Check if user is a partner
    const orgRows = await db.select().from(organizations).where(eq(organizations.userId, userId)).limit(1);
    if (!orgRows.length || !orgRows[0].isPartner) {
      return NextResponse.json({ error: "Not authorized as partner" }, { status: 403 });
    }

    const body = await req.json();
    const { id, action } = body || {};
    if (!id || !['approve','reject'].includes(action)) {
      return NextResponse.json({ error: 'id and valid action required' }, { status: 400 });
    }

    // Verify this user is a partner for this certificate
    const partnerCheck = await db
      .select()
      .from(certificatePartners)
      .where(
        and(
          eq(certificatePartners.certificateId, id),
          eq(certificatePartners.partnerUserId, userId)
        )
      )
      .limit(1);

    if (!partnerCheck.length) {
      return NextResponse.json({ error: 'Not authorized for this certificate' }, { status: 403 });
    }

    const updated = await db
      .update(certificates)
      .set({ 
        partnerApproved: action === 'approve',
        status: action === 'reject' ? 'rejected' : 'pending'
      })
      .where(eq(certificates.id, id))
      .returning();

    if (!updated.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/certificates/partner-approvals error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}
