import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db/client";
import { collaborations, users, organizations } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/collaborations - Fetch current user's partners
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const side = searchParams.get('side');

    if (side === 'partner') {
      // Partner tarafında: bizi ekleyen kurumları döndür (kurum org bilgisini partnerOrg alanına map'liyoruz)
      const rows = await db
        .select({
          collaboration: collaborations,
          partnerUser: users, // burada institution user'ı
          partnerOrg: organizations, // burada institution organization'ı
        })
        .from(collaborations)
        .leftJoin(users, eq(collaborations.institutionUserId, users.id))
        .leftJoin(organizations, eq(collaborations.institutionUserId, organizations.userId))
        .where(eq(collaborations.partnerUserId, userId))
        .orderBy(collaborations.createdAt);

        return NextResponse.json({ collaborations: rows }, { status: 200 });
    }

    // Varsayılan: kurum tarafında kendi eklediği partnerler
    const rows = await db
      .select({
        collaboration: collaborations,
        partnerUser: users,
        partnerOrg: organizations,
      })
      .from(collaborations)
      .leftJoin(users, eq(collaborations.partnerUserId, users.id))
      .leftJoin(organizations, eq(collaborations.partnerUserId, organizations.userId))
      .where(eq(collaborations.institutionUserId, userId))
      .orderBy(collaborations.createdAt);

    return NextResponse.json({ collaborations: rows }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/collaborations error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

// POST /api/collaborations - Add partner by publicId
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const body = await req.json();
    const { partnerPublicId, notes } = body;

    // Validation
    if (!partnerPublicId) {
      return NextResponse.json({
        error: "Missing required field: partnerPublicId"
      }, { status: 400 });
    }

    // Find partner by publicId
    // Partner can be: organization with isPartner=true OR user with role=acreditor
    const partnerOrg = await db
      .select({
        userId: organizations.userId,
        isPartner: organizations.isPartner,
        role: users.role,
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.userId, users.id))
      .where(eq(organizations.publicId, partnerPublicId))
      .limit(1);

    if (!partnerOrg.length) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const partner = partnerOrg[0];

    // Check if partner is valid (isPartner=true OR role=acreditor)
    if (!partner.isPartner && partner.role !== 'acreditor') {
      return NextResponse.json({
        error: "Invalid partner: must be a partner organization or acreditor"
      }, { status: 400 });
    }

    // Check if collaboration already exists
    const existing = await db
      .select()
      .from(collaborations)
      .where(
        and(
          eq(collaborations.institutionUserId, userId),
          eq(collaborations.partnerUserId, partner.userId)
        )
      )
      .limit(1);

    if (existing.length) {
      return NextResponse.json({ error: "Collaboration already exists" }, { status: 409 });
    }

    // Insert collaboration
    const inserted = await db
      .insert(collaborations)
      .values({
        institutionUserId: userId,
        partnerUserId: partner.userId,
        sinceDate: new Date().toISOString().split('T')[0],
        notes: notes || null,
        // Status defaults to 'pending' (for acreditor approval if needed)
      })
      .returning();

    return NextResponse.json({ collaboration: inserted[0] }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/collaborations error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

// PATCH /api/collaborations - Partner approval actions
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const body = await req.json();
    const { id, action } = body as { id?: string; action?: 'approve' | 'reject' };
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }

    // Sadece ilgili partner güncelleyebilir
    const updated = await db
      .update(collaborations)
      .set({ status: action === 'approve' ? 'approved' : 'rejected', updatedAt: new Date() as any })
      .where(and(eq(collaborations.id, id), eq(collaborations.partnerUserId, userId)))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: 'Collaboration not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({ collaboration: updated[0] }, { status: 200 });
  } catch (err: any) {
    console.error('PATCH /api/collaborations error', err);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.'}, { status: 500 });
  }
}

// DELETE /api/collaborations - Remove partner
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const collaborationId = searchParams.get('id');

    if (!collaborationId) {
      return NextResponse.json({ error: "Collaboration ID required" }, { status: 400 });
    }

    // Hem kurum hem partner sonlandırabilsin
    const deleted = await db
      .delete(collaborations)
      .where(
        and(
          eq(collaborations.id, collaborationId),
          or(
            eq(collaborations.institutionUserId, userId),
            eq(collaborations.partnerUserId, userId)
          )
        )
      )
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Collaboration not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Collaboration deleted successfully" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/collaborations error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}
