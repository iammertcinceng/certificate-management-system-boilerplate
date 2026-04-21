import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { trainings, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = (await getServerSession(authOptions)) as any;
  const role = session?.user?.role as string | undefined;
  if (role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

// GET /api/admin/approvals/trainings
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const rows = await db
      .select({
        id: trainings.id,
        publicId: trainings.publicId,
        name: trainings.name,
        level: trainings.level,
        language: trainings.language,
        status: trainings.status,
        institutionName: organizations.name,
        createdAt: trainings.createdAt,
      })
      .from(trainings)
      .leftJoin(organizations, eq(trainings.institutionUserId, organizations.userId));

    return NextResponse.json({ approvals: rows }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/approvals/trainings error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
