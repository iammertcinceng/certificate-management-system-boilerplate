import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db/client";
import { students, certificateStudents } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generatePublicId } from "@/utils/id";
import { buildVerifyBaseKey } from "@/utils/userVerifyKey";

// GET /api/students - Fetch current user's students
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
      .select({
        id: students.id,
        publicId: students.publicId,
        nationalId: students.nationalId,
        firstName: students.firstName,
        lastName: students.lastName,
        otherLastName: students.otherLastName,
        lastNameDisplay: students.lastNameDisplay,
        email: students.email,
        phone: students.phone,
        birthDate: students.birthDate,
        createdAt: students.createdAt,
        institutionUserId: students.institutionUserId,
        certificateCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${certificateStudents} 
          WHERE ${certificateStudents.studentId} = ${students.id}
        )`,
      })
      .from(students)
      .where(eq(students.institutionUserId, userId))
      .orderBy(students.createdAt);

    return NextResponse.json({ students: rows }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/students error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

// POST /api/students - Create new student
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
    const { nationalId, firstName, lastName, otherLastName, lastNameDisplay, birthDate, email, phone } = body;

    // Validation
    if (!nationalId || !firstName || !lastName || !birthDate) {
      return NextResponse.json({
        error: "Missing required fields: nationalId, firstName, lastName, birthDate"
      }, { status: 400 });
    }

    // Generate unique publicId within this institution
    const publicId = await generatePublicId('STD', async () => {
      const rows = await db
        .select({ publicId: students.publicId })
        .from(students)
        .where(eq(students.institutionUserId, userId))
        .orderBy(sql`${students.publicId} DESC`)
        .limit(1);
      if (!rows.length) return 0;
      const match = rows[0].publicId.match(/STD-(\d{6})$/);
      return match ? parseInt(match[1], 10) : 0;
    });

    // Calculate verifyBaseKey upfront (so it's available for email templates)
    const verifyBaseKey = buildVerifyBaseKey({
      firstName,
      lastName,
      nationalId,
      birthDate
    });

    // Insert student
    const inserted = await db
      .insert(students)
      .values({
        publicId: publicId,
        institutionUserId: userId,
        nationalId,
        firstName,
        lastName,
        otherLastName: otherLastName?.trim() || null,
        lastNameDisplay: lastNameDisplay || 'primary',
        birthDate,
        email: email || null,
        phone: phone || null,
        verifyBaseKey: verifyBaseKey || null,
      })
      .returning();

    return NextResponse.json({ student: inserted[0] }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/students error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

// PUT /api/students - Update an existing student
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
    const { id, firstName, lastName, otherLastName, lastNameDisplay, email, phone, nationalId, birthDate } = body || {};

    if (!id) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    // Prepare update payload with defined fields only
    const updatePayload: any = {};
    if (typeof firstName === 'string') updatePayload.firstName = firstName;
    if (typeof lastName === 'string') updatePayload.lastName = lastName;
    // otherLastName can be set to null explicitly to remove it
    if (otherLastName !== undefined) updatePayload.otherLastName = otherLastName?.trim() || null;
    if (lastNameDisplay && ['primary', 'secondary', 'both'].includes(lastNameDisplay)) {
      updatePayload.lastNameDisplay = lastNameDisplay;
    }
    if (typeof nationalId === 'string') updatePayload.nationalId = nationalId;
    if (typeof birthDate === 'string') updatePayload.birthDate = birthDate;
    if (typeof email === 'string') updatePayload.email = email.trim() || null;
    if (typeof phone === 'string') updatePayload.phone = phone.trim() || null;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    // If any of the core fields for verifyBaseKey changed, recalculate
    if (updatePayload.firstName || updatePayload.lastName || updatePayload.nationalId || updatePayload.birthDate) {
      // Fetch current student to merge with updates
      const [current] = await db.select().from(students).where(eq(students.id, id)).limit(1);
      if (current) {
        const newVerifyBaseKey = buildVerifyBaseKey({
          firstName: updatePayload.firstName || current.firstName,
          lastName: updatePayload.lastName || current.lastName,
          nationalId: updatePayload.nationalId || current.nationalId,
          birthDate: updatePayload.birthDate || current.birthDate
        });
        updatePayload.verifyBaseKey = newVerifyBaseKey || null;
      }
    }

    updatePayload.updatedAt = new Date();

    const updated = await db
      .update(students)
      .set(updatePayload)
      .where(
        and(
          eq(students.id, id),
          eq(students.institutionUserId, userId)
        )
      )
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Student not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ student: updated[0] }, { status: 200 });
  } catch (err: any) {
    console.error("PUT /api/students error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

// DELETE /api/students - Delete student
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
    const studentId = searchParams.get('id');

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    // Delete only if belongs to current user
    const deleted = await db
      .delete(students)
      .where(
        and(
          eq(students.id, studentId),
          eq(students.institutionUserId, userId)
        )
      )
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Student not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Student deleted successfully" }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/students error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}
