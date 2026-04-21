import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { users, userRole, organizations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hash } from "bcryptjs";
import { slugify } from "@/utils/slug";
import { generatePublicId } from "@/utils/id";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const emailRaw = String(body?.email || "");
    const password = String(body?.password || "");
    const role = String(body?.role || "");
    const name = String(body?.name || "").trim();
    const taxNumber = String(body?.taxNumber || "").trim();
    const taxOffice = String(body?.taxOffice || "").trim();
    const address = String(body?.address || "").trim();

    const email = emailRaw.toLowerCase().trim();
    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!(["admin", "institution", "acreditor"] as const).includes(role as any)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // For institution/acreditor, name is required
    if ((role === "institution" || role === "acreditor") && !name) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    const exists = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (exists.length) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const passwordHash = await hash(password, 12);

    // Insert user
    const insertedUsers = await db.insert(users).values({ email, passwordHash, role: role as typeof userRole.enumValues[number] }).returning({ id: users.id, email: users.email, role: users.role });
    const user = insertedUsers[0];

    // Create organization profile for institution/acreditor
    if (role === "institution" || role === "acreditor") {
      // Determine prefix based on role
      const prefix = role === "institution" ? "INS" : "ACR";

      const publicId = await generatePublicId(prefix, async () => {
        // Get last publicId count for this prefix
        const lastOrg = await db.select({ publicId: organizations.publicId })
          .from(organizations)
          .where(sql`${organizations.publicId} LIKE ${prefix + '-%'}`)
          .orderBy(sql`${organizations.publicId} DESC`)
          .limit(1);

        return lastOrg.length > 0
          ? parseInt(lastOrg[0].publicId.split('-')[1] || '0', 10)
          : 0;
      });
      let slug = slugify(name);

      // Check slug uniqueness
      const slugExists = await db.select({ userId: organizations.userId })
        .from(organizations)
        .where(eq(organizations.slug, slug))
        .limit(1);

      if (slugExists.length) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const isPartner = role === "acreditor" ? true : false;

      await db.insert(organizations).values({
        userId: user.id,
        publicId,
        slug,
        name,
        isPartner,
        taxNumber: taxNumber || null,
        taxOffice: taxOffice || null,
        address: address || null,
        infoEmail: email,
      });
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    console.error("Register error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
