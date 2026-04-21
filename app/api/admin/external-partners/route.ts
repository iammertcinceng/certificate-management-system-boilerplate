import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { externalPartners } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateReferencePartnerId } from "@/utils/id";

async function requireAdmin() {
  const session = (await getServerSession(authOptions)) as any;
  const role = session?.user?.role as string | undefined;
  if (role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

// GET /api/admin/external-partners
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const rows = await db.select().from(externalPartners);
    return NextResponse.json({ partners: rows }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/external-partners error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

// POST /api/admin/external-partners
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const logo = body?.logo ? String(body.logo).trim() : null;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const publicId = await generateReferencePartnerId();
    const inserted = await db
      .insert(externalPartners)
      .values({ name, logo, publicId })
      .returning();

    return NextResponse.json({ partner: inserted[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/external-partners error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

// Special partners that cannot be deleted (required for system functionality)
const PROTECTED_PARTNER_IDS = ['RFR-000001', 'RFR-000002'];

// DELETE /api/admin/external-partners?id=UUID
export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // First, get the partner to check if it's protected
    const [partner] = await db
      .select({ publicId: externalPartners.publicId })
      .from(externalPartners)
      .where(eq(externalPartners.id, id))
      .limit(1);

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Check if this is a protected partner
    if (PROTECTED_PARTNER_IDS.includes(partner.publicId)) {
      return NextResponse.json({
        error: "Bu partner silinemez. ICF ve CPD partnerleri sistem için gereklidir.",
        isProtected: true
      }, { status: 403 });
    }

    // Delete the partner
    const deleted = await db
      .delete(externalPartners)
      .where(eq(externalPartners.id, id))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/admin/external-partners error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
