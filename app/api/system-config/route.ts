import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { eq } from "drizzle-orm";
import { siteSettings } from "@/db/schema";

// GET /api/system-config
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rows = await db.select().from(siteSettings).limit(1);
    if (!rows.length) {
      return NextResponse.json({
        creditThreshold: 10,
        creditPerStudent: 1,
        siteName: 'Mert CIN Certificates',
        siteUrl: '',
        supportEmail: 'mertcin0@outlook.com',
        seoTitle: '',
        seoDescription: '',
        seoKeywords: '',
      }, { status: 200 });
    }

    const config = rows[0];
    return NextResponse.json({
      creditThreshold: config.creditThreshold || 10,
      creditPerStudent: config.creditPerStudent || 1,
      siteName: config.siteName,
      siteUrl: config.siteUrl || '',
      supportEmail: config.supportEmail || 'mertcin0@outlook.com',
      seoTitle: config.seoTitle || '',
      seoDescription: config.seoDescription || '',
      seoKeywords: config.seoKeywords || '',
    }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/system-config error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

// PUT /api/system-config
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as any).role as string | undefined;
    if (role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const updates: any = {};

    if (body.creditThreshold !== undefined) {
      const val = Number(body.creditThreshold);
      if (!Number.isFinite(val) || val < 0) {
        return NextResponse.json({ error: 'Invalid creditThreshold' }, { status: 400 });
      }
      updates.creditThreshold = val;
    }

    if (body.creditPerStudent !== undefined) {
      const val = Number(body.creditPerStudent);
      if (!Number.isFinite(val) || val < 0) {
        return NextResponse.json({ error: 'Invalid creditPerStudent' }, { status: 400 });
      }
      updates.creditPerStudent = val;
    }

    if (body.siteName !== undefined) updates.siteName = String(body.siteName);
    if (body.siteUrl !== undefined) updates.siteUrl = String(body.siteUrl);
    if (body.supportEmail !== undefined) updates.supportEmail = String(body.supportEmail);
    if (body.seoTitle !== undefined) updates.seoTitle = String(body.seoTitle);
    if (body.seoDescription !== undefined) updates.seoDescription = String(body.seoDescription);
    if (body.seoKeywords !== undefined) updates.seoKeywords = String(body.seoKeywords);

    updates.updatedAt = new Date();

    const rows = await db.select().from(siteSettings).limit(1);
    if (rows.length) {
      await db.update(siteSettings).set(updates).where(eq(siteSettings.id, rows[0].id));
    } else {
      await db.insert(siteSettings).values(updates);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/system-config error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
