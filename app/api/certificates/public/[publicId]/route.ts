import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { certificates, trainings, certificateStudents, certificatePartners, students, organizations, users } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/certificates/public/[publicId] - Get certificate by public ID (no auth required)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;

    if (!publicId) {
      return NextResponse.json({ error: "publicId required" }, { status: 400 });
    }

    // Get certificate with training info
    const [certificateData] = await db
      .select({
        certificate: certificates,
        training: trainings,
        institution: organizations,
      })
      .from(certificates)
      .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
      .leftJoin(organizations, eq(certificates.institutionUserId, organizations.userId))
      .where(eq(certificates.publicId, publicId))
      .limit(1);

    if (!certificateData) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Get students
    const studentsData = await db
      .select({
        id: students.id,
        publicId: students.publicId,
        firstName: students.firstName,
        lastName: students.lastName,
        tcNumber: students.tcNumber,
      })
      .from(certificateStudents)
      .leftJoin(students, eq(certificateStudents.studentId, students.id))
      .where(eq(certificateStudents.certificateId, certificateData.certificate.id));

    // Get partners
    const partnersData = await db
      .select({
        userId: certificatePartners.partnerUserId,
        name: organizations.name,
        publicId: organizations.publicId,
        logo: organizations.logo,
      })
      .from(certificatePartners)
      .leftJoin(users, eq(certificatePartners.partnerUserId, users.id))
      .leftJoin(organizations, eq(users.id, organizations.userId))
      .where(eq(certificatePartners.certificateId, certificateData.certificate.id));

    // Return certificate data
    return NextResponse.json({
      certificate: {
        publicId: certificateData.certificate.publicId,
        certificateNumber: certificateData.certificate.publicId, // Use publicId as certificate number
        dateIssued: certificateData.certificate.dateIssued,
        status: certificateData.certificate.status,
        templateKey: certificateData.certificate.templateKey,
        colorPrimary: certificateData.certificate.colorPrimary || '#1e40af',
        colorSecondary: certificateData.certificate.colorSecondary || '#7c3aed',

        // Training info
        trainingName: certificateData.training?.name || 'Unknown Training',
        trainingDescription: certificateData.training?.description,
        trainingHours: certificateData.training?.totalHours,
        trainingLevel: certificateData.training?.level,
        trainingLanguage: certificateData.training?.language,

        // Institution info
        institutionName: certificateData.institution?.name || 'Unknown Institution',
        institutionLogo: certificateData.institution?.logo,

        // Students
        students: studentsData.map(s => ({
          id: s.id,
          publicId: s.publicId,
          name: `${s.firstName} ${s.lastName}`,
          firstName: s.firstName,
          lastName: s.lastName,
          tcNumber: s.tcNumber,
        })),

        // Partners
        partners: partnersData.map(p => ({
          userId: p.userId,
          name: p.name || 'Unknown Partner',
          publicId: p.publicId,
          logo: p.logo,
        })),

        // Site info
        siteName: 'Mert CIN',
        siteLogo: '/mertcin-anonym-logo-org.jpg',
      }
    }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/certificates/public/[publicId] error", err);
    return NextResponse.json({
      error: 'u{0130}u{015F}lem su{0131}rasu{0131}nda bir hata oluu{015F}tu.'
    }, { status: 500 });
  }
}
