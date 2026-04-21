import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db/client";
import { trainings } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generatePublicId } from "@/utils/id";

// GET /api/trainings - Fetch current user's trainings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const rows = await db
      .select()
      .from(trainings)
      .where(eq(trainings.institutionUserId, userId))
      .orderBy(trainings.createdAt);

    return NextResponse.json({ trainings: rows }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/trainings error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

// POST /api/trainings - Create new training
export async function POST(req: Request) {
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
    const { name, description, level, language, totalHours, languages, mode, country } = body;

    // Validation
    if (!name) {
      return NextResponse.json({
        error: "Missing required field: name"
      }, { status: 400 });
    }

    // Basic enum validations
    const validLevels = ['level_a', 'level_b', 'level_c', 'level_d']; //değişmeyecek. db de yapılabilir. 
    const validLanguages = ['tr', 'en', 'de', 'fr']; //dinamik olmalı ve admin panelden daha fazlası eklenebilmeli veya tüm diller seçicisi olsun. 
    if (!validLevels.includes(level)) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
    }
    if (!validLanguages.includes(language)) {
      return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
    }
    // Optional fields validation
    let languagesJson: string[] | null = null;
    if (Array.isArray(languages)) {
      const allValid = languages.every((l: any) => typeof l === 'string' && validLanguages.includes(l));
      if (!allValid) return NextResponse.json({ error: 'Invalid languages' }, { status: 400 });
      languagesJson = languages.length ? languages : null;
    }
    const validModes = ['hybrid', 'online', 'onsite'];
    const validCountries = ['tr', 'us', 'de', 'gb', 'fr'];
    const modeVal = typeof mode === 'string' && validModes.includes(mode) ? mode : null;
    const countryVal = typeof country === 'string' && validCountries.includes(country) ? country : null;
    const hoursNum = Number(totalHours);
    if (!Number.isFinite(hoursNum) || hoursNum <= 0) {
      return NextResponse.json({ error: 'totalHours must be a positive number' }, { status: 400 });
    }

    // Generate unique publicId using utils/generatePublicId
    const publicId = await generatePublicId('TRN', async () => {
      const rows = await db
        .select({ publicId: trainings.publicId })
        .from(trainings)
        .where(eq(trainings.institutionUserId, userId))
        .orderBy(sql`${trainings.publicId} DESC`)
        .limit(1);
      if (!rows.length) return 0;
      const match = rows[0].publicId.match(/TRN-(\d{6})$/);
      return match ? parseInt(match[1], 10) : 0;
    });

    // Insert training (status defaults to 'pending' for admin approval)
    const inserted = await db
      .insert(trainings)
      .values({
        publicId,
        institutionUserId: userId,
        name,
        description: description || null,
        level,
        language,
        totalHours: Math.trunc(hoursNum),
        languages: languagesJson as any,
        mode: modeVal as any,
        country: countryVal as any,
      })
      .returning();

    return NextResponse.json({ training: inserted[0] }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/trainings error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

// PUT /api/trainings - Update training
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
    const { id, name, description, level, language, totalHours, languages, mode, country } = body;

    if (!id) {
      return NextResponse.json({ error: "Training ID required" }, { status: 400 });
    }

    // Update only if belongs to current user
    // Optional validations if provided
    const updatePayload: any = {
      updatedAt: new Date(),
    };
    if (typeof name !== 'undefined') updatePayload.name = name;
    if (typeof description !== 'undefined') updatePayload.description = description;
    if (typeof level !== 'undefined') {
      const validLevels = ['level_a', 'level_b', 'level_c', 'level_d'];
      if (!validLevels.includes(level)) return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
      updatePayload.level = level;
    }
    if (typeof language !== 'undefined') {
      const validLanguages = ['tr', 'en', 'de', 'fr'];
      if (!validLanguages.includes(language)) return NextResponse.json({ error: 'Invalid language' }, { status: 400 });
      updatePayload.language = language;
    }
    if (typeof languages !== 'undefined') {
      const validLanguages = ['tr', 'en', 'de', 'fr'];
      if (languages === null) {
        updatePayload.languages = null;
      } else if (Array.isArray(languages)) {
        const allValid = languages.every((l: any) => typeof l === 'string' && validLanguages.includes(l));
        if (!allValid) return NextResponse.json({ error: 'Invalid languages' }, { status: 400 });
        updatePayload.languages = languages.length ? languages : null;
      } else {
        return NextResponse.json({ error: 'languages must be array or null' }, { status: 400 });
      }
    }
    if (typeof mode !== 'undefined') {
      const validModes = ['hybrid', 'online', 'onsite'];
      if (mode === null) updatePayload.mode = null; else if (validModes.includes(mode)) updatePayload.mode = mode; else return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
    }
    if (typeof country !== 'undefined') {
      const validCountries = ['tr', 'us', 'de', 'gb', 'fr'];
      if (country === null) updatePayload.country = null; else if (validCountries.includes(country)) updatePayload.country = country; else return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
    }
    if (typeof totalHours !== 'undefined') {
      const hoursNum = Number(totalHours);
      if (!Number.isFinite(hoursNum) || hoursNum <= 0) return NextResponse.json({ error: 'totalHours must be a positive number' }, { status: 400 });
      updatePayload.totalHours = Math.trunc(hoursNum);
    }
    // Note: startDate and endDate are in certificates table, not trainings

    const updated = await db
      .update(trainings)
      .set(updatePayload)
      .where(
        and(
          eq(trainings.id, id),
          eq(trainings.institutionUserId, userId)
        )
      )
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Training not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ training: updated[0] }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/trainings error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

// DELETE /api/trainings - Delete training
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: "User ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const trainingId = searchParams.get('id');

    if (!trainingId) {
      return NextResponse.json({ error: "Training ID required" }, { status: 400 });
    }

    // Delete only if belongs to current user
    const deleted = await db
      .delete(trainings)
      .where(
        and(
          eq(trainings.id, trainingId),
          eq(trainings.institutionUserId, userId)
        )
      )
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Training not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Training deleted successfully" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/trainings error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}
