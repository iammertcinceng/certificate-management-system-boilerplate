import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, certificateStudents, trainings } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/students/[id]/certificates - Get certificates for a student
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
    const { id: studentId } = await params;

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    // Get certificates for this student
    const certList = await db
      .select({
        id: certificates.id,
        publicId: certificates.publicId,
        trainingName: trainings.name,
        dateIssued: certificates.dateIssued,
        status: certificates.status,
      })
      .from(certificateStudents)
      .innerJoin(certificates, eq(certificateStudents.certificateId, certificates.id))
      .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
      .where(
        and(
          eq(certificateStudents.studentId, studentId),
          eq(certificates.institutionUserId, userId)
        )
      );

    return NextResponse.json({ 
      certificates: certList,
      count: certList.length,
    }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/students/[id]/certificates error", err);
    return NextResponse.json({
      error: 'u{0130}u{015F}lem su{0131}rasu{0131}nda bir hata oluu{015F}tu.'}, { status: 500 });
  }
}
