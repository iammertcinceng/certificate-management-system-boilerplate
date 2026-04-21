import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, trainings, organizations, users, students, certificatePartners, certificateStudents, approvalCodes } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

// GET /api/certificates/[id]/details
// Get full certificate details including students and UIA codes
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string | undefined;
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 400 });

    const { id: certificateId } = await params;

    // Get certificate with related data
    const certResult = await db
      .select({
        cert: certificates,
        training: trainings,
        org: organizations,
        instUser: users,
      })
      .from(certificates)
      .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
      .leftJoin(organizations, eq(certificates.institutionUserId, organizations.userId))
      .leftJoin(users, eq(certificates.institutionUserId, users.id))
      .where(eq(certificates.publicId, certificateId))
      .limit(1);

    if (!certResult.length) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const { cert, training, org, instUser } = certResult[0];
    const certificate = cert as any;

    // Verify user is a partner for this certificate
    const partnerRel = await db
      .select()
      .from(certificatePartners)
      .where(
        and(
          eq(certificatePartners.certificateId, certificate.id),
          eq(certificatePartners.partnerUserId, userId)
        )
      )
      .limit(1);

    if (!partnerRel.length) {
      return NextResponse.json({ error: "Not authorized to view this certificate" }, { status: 403 });
    }

    // Get all partners for this certificate
    const partners = await db
      .select({
        partner: certificatePartners,
        user: users,
      })
      .from(certificatePartners)
      .leftJoin(users, eq(certificatePartners.partnerUserId, users.id))
      .where(eq(certificatePartners.certificateId, certificate.id));

    const partnerIds = partners.map(p => (p.user as any)?.email || 'Unknown');

    // Get students via junction table
    const certStudentsJunction = await db
      .select({
        student: students,
        junction: certificateStudents,
      })
      .from(certificateStudents)
      .leftJoin(students, eq(certificateStudents.studentId, students.id))
      .where(eq(certificateStudents.certificateId, certificate.id));
    
    console.log('Students found via junction:', certStudentsJunction.length);

    // Get UIA codes for these students
    const approvalCodesResult = await db
      .select()
      .from(approvalCodes)
      .where(eq(approvalCodes.certificateId, certificate.id));
    
    console.log('UIA codes found:', approvalCodesResult.length);

    const approvalCodesMap = new Map(
      approvalCodesResult.map((c: any) => [c.studentId, c.approvalCode])
    );

    const studentsList = certStudentsJunction.map(({ student }) => {
      const s = student as any;
      return {
        id: s.id,
        publicId: s.publicId,
        nationalId: s.nationalId,
        firstName: s.firstName,
        lastName: s.lastName,
        birthDate: s.birthDate,
        email: s.email,
        phone: s.phone,
        approvalCode: approvalCodesMap.get(s.id) || null,
      };
    });

    const response = {
      certificate: {
        id: certificate.publicId,
        trainingName: (training as any)?.name || 'Eğitim',
        institution: (org as any)?.name || (instUser as any)?.email || 'Kurum',
        templateKey: certificate.templateKey || 'default',
        dateIssued: certificate.createdAt?.toISOString() || new Date().toISOString(),
        totalHours: (training as any)?.totalHours || null,
        partnerIds,
        students: studentsList,
        status: certificate.status || 'pending',
        hasExcel: !!certificate.excelPath,
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/certificates/[id]/details error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
