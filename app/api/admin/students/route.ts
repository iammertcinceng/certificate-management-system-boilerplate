import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { students, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = (await getServerSession(authOptions)) as any;
  const role = session?.user?.role as string | undefined;
  if (role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

// GET /api/admin/students
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const rows = await db
      .select({
        id: students.id,
        publicId: students.publicId,
        firstName: students.firstName,
        lastName: students.lastName,
        otherLastName: students.otherLastName,
        lastNameDisplay: students.lastNameDisplay,
        nationalId: students.nationalId,
        birthDate: students.birthDate,
        email: students.email,
        phone: students.phone,
        institutionUserId: students.institutionUserId,
        createdAt: students.createdAt,
        institutionName: organizations.name,
      })
      .from(students)
      .leftJoin(organizations, eq(students.institutionUserId, organizations.userId));

    return NextResponse.json({ students: rows }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/students error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
