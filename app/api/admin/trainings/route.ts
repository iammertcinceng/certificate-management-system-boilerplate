import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { trainings, trainingLevel, trainingLanguage, trainingStatus, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";

async function requireAdmin() {
  const session = (await getServerSession(authOptions)) as any;
  const role = session?.user?.role as string | undefined;
  if (role !== "admin") {
    return { ok: false as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const };
}

// GET /api/admin/trainings
export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const rows = await db
      .select({
        id: trainings.id,
        publicId: trainings.publicId,
        name: trainings.name,
        description: trainings.description,
        level: trainings.level,
        language: trainings.language,
        languages: trainings.languages,
        totalHours: trainings.totalHours,
        mode: trainings.mode,
        country: trainings.country,
        status: trainings.status,
        institutionUserId: trainings.institutionUserId,
        createdAt: trainings.createdAt,
        updatedAt: trainings.updatedAt,
        institutionName: organizations.name,
      })
      .from(trainings)
      .leftJoin(organizations, eq(trainings.institutionUserId, organizations.userId));

    return NextResponse.json({ trainings: rows }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/trainings error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

// POST /api/admin/trainings
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const body = await req.json();
    const { name, description, level, language, totalHours, institutionUserId } = body;

    if (!name || !level || !language || !totalHours || !institutionUserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate publicId
    const publicId = `TRN-${Date.now().toString().slice(-6)}`;

    const inserted = await db
      .insert(trainings)
      .values({
        publicId,
        name,
        description: description || null,
        level: level as typeof trainingLevel.enumValues[number],
        language: language as typeof trainingLanguage.enumValues[number],
        totalHours: parseInt(totalHours),
        institutionUserId,
        status: 'pending' as typeof trainingStatus.enumValues[number],
      })
      .returning();

    return NextResponse.json({ training: inserted[0] }, { status: 201 });
  } catch (err) {
    console.error("POST /api/admin/trainings error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

// PUT /api/admin/trainings
export async function PUT(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const body = await req.json();
    const { id, name, description, level, language, totalHours, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Training ID is required" }, { status: 400 });
    }

    const updated = await db
      .update(trainings)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(level && { level: level as typeof trainingLevel.enumValues[number] }),
        ...(language && { language: language as typeof trainingLanguage.enumValues[number] }),
        ...(totalHours && { totalHours: parseInt(totalHours) }),
        ...(status && { status: status as typeof trainingStatus.enumValues[number] }),
        updatedAt: new Date(),
      })
      .where(eq(trainings.id, id))
      .returning();

    return NextResponse.json({ training: updated[0] }, { status: 200 });
  } catch (err) {
    console.error("PUT /api/admin/trainings error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}

// DELETE /api/admin/trainings
export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.res;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "Training ID is required" }, { status: 400 });
    }

    await db.delete(trainings).where(eq(trainings.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE /api/admin/trainings error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
