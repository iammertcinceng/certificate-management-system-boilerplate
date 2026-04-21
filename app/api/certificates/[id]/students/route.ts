import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, certificateStudents, students } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/certificates/[id]/students - Get students for a certificate
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id: certificateId } = await params;

    if (!certificateId) {
      return NextResponse.json({ error: "Certificate ID required" }, { status: 400 });
    }

    // Verify ownership
    const [cert] = await db
      .select({ id: certificates.id })
      .from(certificates)
      .where(
        and(
          eq(certificates.id, certificateId),
          eq(certificates.institutionUserId, userId)
        )
      )
      .limit(1);

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found or access denied" }, { status: 404 });
    }

    // Get students with certificate-specific data
    const studentList = await db
      .select({
        id: students.id,
        publicId: students.publicId,
        nationalId: students.nationalId,
        firstName: students.firstName,
        lastName: students.lastName,
        email: students.email,
        phone: students.phone,
        birthDate: students.birthDate,
        verifyBaseKey: students.verifyBaseKey,
        sequenceNo: certificateStudents.sequenceNo,
      })
      .from(certificateStudents)
      .innerJoin(students, eq(certificateStudents.studentId, students.id))
      .where(eq(certificateStudents.certificateId, certificateId));

    return NextResponse.json({ 
      students: studentList,
      count: studentList.length,
    }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/certificates/[id]/students error", err);
    return NextResponse.json({
      error: 'u{0130}u{015F}lem su{0131}rasu{0131}nda bir hata oluu{015F}tu.'}, { status: 500 });
  }
}
