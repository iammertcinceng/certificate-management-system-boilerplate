import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { users, userRole } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { hash } from "bcryptjs";

async function requireAdmin() {
  const session = (await getServerSession(authOptions)) as any;
  const role = session?.user?.role as string | undefined;
  if (role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const { organizations } = await import("@/db/schema");
    
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        orgName: organizations.name,
        orgPublicId: organizations.publicId,
        logo: organizations.logo,
        infoEmail: organizations.infoEmail,
      })
      .from(users)
      .leftJoin(organizations, eq(users.id, organizations.userId));

    return NextResponse.json({ users: rows }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/users error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const body = await req.json();
    const email = String(body?.email || "").toLowerCase().trim();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (exists.length) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);
    const inserted = await db
      .insert(users)
      .values({ email, passwordHash, role: "admin" as typeof userRole.enumValues[number] })
      .returning({ id: users.id, email: users.email, role: users.role, createdAt: users.createdAt });

    return NextResponse.json({ admin: inserted[0] }, { status: 201 });
  } catch (err) {
    console.error("Create admin error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
