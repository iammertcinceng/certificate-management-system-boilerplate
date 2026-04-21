import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, trainings, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = (await getServerSession(authOptions)) as any;
  const role = session?.user?.role as string | undefined;
  if (role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

// GET /api/admin/certificates
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const rows = await db
      .select({
        id: certificates.id,
        publicId: certificates.publicId,
        trainingName: trainings.name,
        institutionName: organizations.name,
        templateKey: certificates.templateKey,
        status: certificates.status,
        dateIssued: certificates.dateIssued,
        createdAt: certificates.createdAt,
      })
      .from(certificates)
      .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
      .leftJoin(organizations, eq(certificates.institutionUserId, organizations.userId));

    return NextResponse.json({ certificates: rows }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/certificates error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
