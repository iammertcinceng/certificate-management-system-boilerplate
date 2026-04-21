import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/partners/[id] - Get partner organization by user ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Partner ID required" }, { status: 400 });
    }

    // Fetch organization by userId (partner is an organization)
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.userId, id))
      .limit(1);

    if (!org) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Return partner organization data
    return NextResponse.json({
      id: org.userId,
      publicId: org.publicId,
      name: org.name,
      logo: org.logo,
      isPartner: org.isPartner,
      about: org.about,
      website: org.website,
      infoEmail: org.infoEmail,
    }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/partners/[id] error", err);
    return NextResponse.json({
      error: 'u{0130}u{015F}lem su{0131}rasu{0131}nda bir hata oluu{015F}tu.'}, { status: 500 });
  }
}
