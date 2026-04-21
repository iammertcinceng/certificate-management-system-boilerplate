import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db/client";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/organization - Fetch current user's organization
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    console.log("GET /api/organization - Full session:", JSON.stringify(session, null, 2));

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    console.log("GET /api/organization - userId:", userId);

    if (!userId) {
      console.log("GET /api/organization - session.user:", JSON.stringify(session.user, null, 2));
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const rows = await db.select({
      userId: organizations.userId, publicId: organizations.publicId, slug: organizations.slug, name: organizations.name, isPartner: organizations.isPartner, taxNumber: organizations.taxNumber, taxOffice: organizations.taxOffice, infoEmail: organizations.infoEmail, phone: organizations.phone, website: organizations.website, address: organizations.address, about: organizations.about, mission: organizations.mission, vision: organizations.vision, socialLinkedin: organizations.socialLinkedin, socialTwitter: organizations.socialTwitter, socialFacebook: organizations.socialFacebook, socialInstagram: organizations.socialInstagram, logo: organizations.logo, signature: organizations.signature, signatureName: organizations.signatureName, signatureTitle: organizations.signatureTitle, advantages: organizations.advantages,
      primaryColor: organizations.primaryColor, secondaryColor: organizations.secondaryColor, defaultTemplate: organizations.defaultTemplate
    }).from(organizations).where(eq(organizations.userId, userId)).limit(1);
    if (!rows.length) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization: rows[0] }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/organization error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

// PUT /api/organization - Update current user's organization
export async function PUT(req: Request) {
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
    const {
      name,
      taxNumber,
      taxOffice,
      infoEmail,
      phone,
      website,
      address,
      about,
      mission,
      vision,
      socialLinkedin,
      socialTwitter,
      socialFacebook,
      socialInstagram,
      isPartner,
      advantages,
      logo,
      signature,
      signatureName,
      signatureTitle,
      primaryColor,
      secondaryColor,
      defaultTemplate,
    } = body;

    // Update organization
    const updated = await db
      .update(organizations)
      .set({
        name,
        taxNumber,
        taxOffice,
        infoEmail,
        phone,
        website,
        address,
        about,
        mission,
        vision,
        socialLinkedin,
        socialTwitter,
        socialFacebook,
        socialInstagram,
        isPartner,
        advantages: advantages || [],
        logo,
        signature,
        signatureName,
        signatureTitle,
        primaryColor,
        secondaryColor,
        defaultTemplate,
        updatedAt: new Date(),
      })
      .where(eq(organizations.userId, userId))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization: updated[0] }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/organization error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
