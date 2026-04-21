import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db/client";
import { organizations, users, collaborations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/organizations/search?publicId=XXX - Search for partner by publicId
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get('publicId');

    if (!publicId) {
      return NextResponse.json({ error: "publicId required" }, { status: 400 });
    }

    // Find organization by publicId where isPartner=true OR user role=acreditor
    const result = await db
      .select({
        userId: organizations.userId,
        publicId: organizations.publicId,
        name: organizations.name,
        isPartner: organizations.isPartner,
        role: users.role,
      })
      .from(organizations)
      .leftJoin(users, eq(organizations.userId, users.id))
      .where(eq(organizations.publicId, publicId.toUpperCase()))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ organization: null }, { status: 200 });
    }

    const org = result[0];

    // Check if it's the current user (kendimiz)
    if (org.userId === currentUserId) {
      return NextResponse.json({ organization: null, isSelf: true }, { status: 200 });
    }

    // Check if valid partner (isPartner=true OR role=acreditor)
    if (!org.isPartner && org.role !== 'acreditor') {
      return NextResponse.json({ organization: null }, { status: 200 });
    }

    // Check if already added as partner
    const existingCollaboration = await db
      .select()
      .from(collaborations)
      .where(
        and(
          eq(collaborations.institutionUserId, currentUserId),
          eq(collaborations.partnerUserId, org.userId)
        )
      )
      .limit(1);

    const alreadyAdded = existingCollaboration.length > 0;

    return NextResponse.json({ 
      organization: {
        publicId: org.publicId,
        name: org.name,
        role: org.role,
        alreadyAdded,
      }
    }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/organizations/search error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}
