import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { institutionPartners, externalPartners, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = (await getServerSession(authOptions)) as any;
  const role = session?.user?.role as string | undefined;
  if (role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

// GET /api/admin/approvals/references - Partnership onaylarını listele (sadece pending)
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const rows = await db
      .select({
        id: institutionPartners.id,
        institutionUserId: institutionPartners.institutionUserId,
        institutionName: organizations.name,
        partnerPublicId: externalPartners.publicId,
        partnerName: externalPartners.name,
        partnerLogo: externalPartners.logo,
        status: institutionPartners.status,
        createdAt: institutionPartners.createdAt,
      })
      .from(institutionPartners)
      .innerJoin(externalPartners, eq(institutionPartners.externalPartnerId, externalPartners.id))
      .innerJoin(organizations, eq(institutionPartners.institutionUserId, organizations.userId))
      .where(eq(institutionPartners.status, 'pending'));

    return NextResponse.json({ partnerships: rows }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/approvals/references error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
