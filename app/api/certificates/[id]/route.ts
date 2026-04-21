import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { certificates, trainings, certificateStudents, certificatePartners, students, organizations, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { buildVerifyBaseKey } from "@/utils/userVerifyKey";
import { generateQRCode } from "@/utils/qrCode";
import { getPartnerLogo } from "@/utils/specialPartners";

type CertificateRouteParams = { id: string } | Promise<{ id: string }>;

// GET /api/certificates/[id] - Get certificate by ID (no auth required for verification)
export async function GET(
  req: Request,
  context: { params: CertificateRouteParams }
) {
  try {
    const params = await context.params;
    const { id } = params;

    // Get studentId from query params (optional - for multi-student certificates)
    const url = new URL(req.url);
    const studentIdParam = url.searchParams.get('studentId');

    if (!id) {
      return NextResponse.json({ error: "Certificate ID required" }, { status: 400 });
    }
    // Basic UUID v4 format validation to avoid DB errors when id is not a UUID
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid certificate ID format" }, { status: 400 });
    }

    // Get certificate with training info
    const [certificateData] = await db
      .select({
        certificate: {
          id: certificates.id,
          publicId: certificates.publicId,
          dateIssued: certificates.dateIssued,
          status: certificates.status,
          templateKey: certificates.templateKey,
          colorPrimary: certificates.colorPrimary,
          colorSecondary: certificates.colorSecondary,
          institutionUserId: certificates.institutionUserId,
          trainingId: certificates.trainingId,
          startDate: certificates.startDate,
          endDate: certificates.endDate,
          uiaRequired: certificates.uiaRequired,
          uiaResponsibleId: certificates.uiaResponsibleId,
          externalPartners: certificates.externalPartners,
        },
        training: {
          id: trainings.id,
          name: trainings.name,
          description: trainings.description,
          totalHours: trainings.totalHours,
          level: trainings.level,
          language: trainings.language,
        },
        institution: {
          userId: organizations.userId,
          name: organizations.name,
          logo: organizations.logo,
        },
      })
      .from(certificates)
      .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
      .leftJoin(organizations, eq(certificates.institutionUserId, organizations.userId))
      .where(eq(certificates.id, id))
      .limit(1);

    if (!certificateData) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Note: Guest verification now returns certificate data regardless of status
    // TODO: Re-enable approved-only visibility before production. Only show certificates with status === 'approved'.

    // Get all students for this certificate
    const csRows = await db
      .select({
        csId: certificateStudents.id,
        csSequence: certificateStudents.sequenceNo,
        studentId: students.id,
        publicId: students.publicId,
        firstName: students.firstName,
        lastName: students.lastName,
        otherLastName: students.otherLastName,
        nationalId: students.nationalId,
        birthDate: students.birthDate,
        verifyBaseKey: students.verifyBaseKey,
      })
      .from(certificateStudents)
      .leftJoin(students, eq(certificateStudents.studentId, students.id))
      .where(eq(certificateStudents.certificateId, certificateData.certificate.id));

    // Pick the correct student based on studentId param, or default to first
    let primary = csRows[0];
    if (studentIdParam) {
      const matched = csRows.find(row => row.studentId === studentIdParam);
      if (matched) {
        primary = matched;
      }
    }

    if (!primary || !primary.studentId) {
      return NextResponse.json({ error: "Certificate student not found" }, { status: 404 });
    }
    let verifyBaseKey = primary.verifyBaseKey || null;
    let sequenceNo = primary.csSequence || null;

    // Backfill verify base key if missing
    if (!verifyBaseKey) {
      const computed = buildVerifyBaseKey({
        firstName: String(primary.firstName),
        lastName: String(primary.lastName),
        nationalId: String(primary.nationalId),
        birthDate: primary.birthDate as any,
      });
      if (computed) {
        await db.update(students).set({ verifyBaseKey: computed }).where(eq(students.id, primary.studentId));
        verifyBaseKey = computed;
      }
    }

    // Backfill sequence number for this certificate-student pair if missing
    if (!sequenceNo) {
      const existing = await db
        .select({ seq: certificateStudents.sequenceNo })
        .from(certificateStudents)
        .where(eq(certificateStudents.studentId, primary.studentId));
      const maxSeq = Math.max(0, ...existing.map(r => r.seq || 0));
      const next = maxSeq + 1;
      await db.update(certificateStudents).set({ sequenceNo: next }).where(eq(certificateStudents.id, primary.csId));
      sequenceNo = next;
    }

    // Get regular partners (with user accounts)
    const regularPartners = await db
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

    // Combine regular partners with external partners (RFR partners)
    const externalPartners = certificateData.certificate.externalPartners || [];
    console.log('[API] External partners:', externalPartners);
    console.log('[API] Training level:', certificateData.training?.level);

    const allPartners = [
      ...regularPartners.map(p => ({
        id: p.userId,
        publicId: p.publicId,
        name: p.name || 'Unknown Partner',
        logo: p.logo,
      })),
      ...externalPartners.map(p => ({
        id: null,
        publicId: p.publicId,
        name: p.name,
        logo: p.logo,
      })),
    ];

    // Return formatted certificate data compatible with CertificateData interface
    const certificateNumber = verifyBaseKey && sequenceNo ? `${verifyBaseKey}${sequenceNo}` : certificateData.certificate.publicId;
    const certificateCode = certificateNumber; // Same as certificateNumber (baseKey + sequenceNo)
    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://mertcin.com'}/verify/result/${certificateData.certificate.id}`;

    // Generate QR code
    let qrCode: string | undefined;
    try {
      qrCode = await generateQRCode(verificationUrl, 200);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      // Continue without QR code
    }

    return NextResponse.json({
      id: certificateData.certificate.id,
      certificateNumber,
      certificateCode,
      verificationUrl,
      publicId: certificateData.certificate.publicId,
      dateIssued: certificateData.certificate.dateIssued,

      // Raw fields for editing
      trainingId: certificateData.certificate.trainingId,
      startDate: certificateData.certificate.startDate,
      endDate: certificateData.certificate.endDate,
      uiaRequired: certificateData.certificate.uiaRequired,
      uiaResponsibleId: certificateData.certificate.uiaResponsibleId,
      externalPartners: certificateData.certificate.externalPartners || [],

      // Student info (using first student if multiple)
      studentName: primary
        ? (primary.otherLastName
          ? `${primary.firstName} ${primary.lastName} ${primary.otherLastName}`
          : `${primary.firstName} ${primary.lastName}`)
        : 'Unknown Student',

      // Training info
      trainingName: certificateData.training?.name || 'Unknown Training',
      trainingDescription: certificateData.training?.description,
      trainingHours: certificateData.training?.totalHours,
      trainingLevel: certificateData.training?.level,
      trainingLanguage: certificateData.training?.language,

      // Institution info
      institutionName: certificateData.institution?.name || 'Unknown Institution',
      institutionLogo: certificateData.institution?.logo,

      // Partners
      partners: allPartners.map(p => {
        // Use special partner logo logic for RFR-1 and RFR-2
        const specialLogo = getPartnerLogo(p.publicId || '', certificateData.training?.level, p.logo);
        console.log(`[API] Partner ${p.name} (${p.publicId}): logo=${specialLogo}`);
        return {
          id: p.id,
          publicId: p.publicId,
          name: p.name || 'Unknown Partner',
          logo: specialLogo,
        };
      }),

      // Site info
      siteName: 'Mert CIN',
      siteLogo: '/mertcin-anonym-logo.png',

      // Theme colors
      primaryColor: certificateData.certificate.colorPrimary || '#1e40af',
      secondaryColor: certificateData.certificate.colorSecondary || '#7c3aed',

      // Template
      templateKey: certificateData.certificate.templateKey || 'modern',

      // QR Code
      qrCode,
    }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/certificates/[id] error", err);
    return NextResponse.json({
      error: 'u{0130}u{015F}lem su{0131}rasu{0131}nda bir hata oluu{015F}tu.'
    }, { status: 500 });
  }
}

// PUT /api/certificates/[id] - Update a rejected certificate
export async function PUT(
  req: Request,
  context: { params: CertificateRouteParams }
) {
  try {
    // 1. Auth check
    const { getServerSession } = await import("next-auth");
    const { authOptions } = await import("@/app/api/auth/[...nextauth]/route");
    const { CreditService } = await import("@/lib/services/credit.service");
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = (session.user as any).id;

    // 2. Validate Params
    const params = await context.params;
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Certificate ID required" }, { status: 400 });
    }

    const body = await req.json();
    const {
      trainingId,
      studentIds,
      dateIssued,
      startDate,
      endDate,
      partnerUserIds,
      templateKey,
      colorPrimary,
      colorSecondary,
      upperInstitutionRequired,
      upperInstitutionPartnerUserId
    } = body;

    // 3. Find certificate and check ownership & status
    const [cert] = await db
      .select()
      .from(certificates)
      .where(and(eq(certificates.id, id), eq(certificates.institutionUserId, userId)))
      .limit(1);

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found or access denied" }, { status: 404 });
    }

    if (cert.status !== 'rejected') {
      return NextResponse.json({ error: "Only rejected certificates can be edited" }, { status: 400 });
    }

    // 4. Calculate student count for credit deduction
    const studentCount = studentIds?.length || 1;

    // 5. CRITICAL: Deduct credits ATOMICALLY with certificate update
    // This prevents race conditions and ensures credits are always deducted when approving
    const creditResult = await CreditService.deductCreditsForCertificate(
      userId,
      studentCount,
      id,
      cert.publicId,
      // All updates happen WITHIN the same transaction
      async (tx) => {
        // Update certificate info
        await tx.update(certificates).set({
          trainingId,
          dateIssued: dateIssued || endDate,
          startDate: startDate || null,
          endDate: endDate || null,
          templateKey: templateKey || 'classic',
          colorPrimary: colorPrimary || null,
          colorSecondary: colorSecondary || null,
          uiaRequired: !!upperInstitutionRequired,
          uiaResponsibleId: upperInstitutionPartnerUserId || null,
          status: 'pending',
          institutionApproved: true,
          partnerApproved: false,
          adminApproved: true, // Admin onayı otomatik (gizlendi)
          studentCount: studentCount.toString(),
          updatedAt: new Date(),
        }).where(eq(certificates.id, id));

        // Update Students (full replacement)
        await tx.delete(certificateStudents).where(eq(certificateStudents.certificateId, id));

        if (studentIds && studentIds.length > 0) {
          let seq = 1;
          for (const studentId of studentIds) {
            await tx.insert(certificateStudents).values({
              certificateId: id,
              studentId: studentId,
              sequenceNo: seq++,
            });
          }
        }

        // Update Partners (full replacement)
        await tx.delete(certificatePartners).where(eq(certificatePartners.certificateId, id));

        if (partnerUserIds && partnerUserIds.length > 0) {
          for (const partnerId of partnerUserIds) {
            await tx.insert(certificatePartners).values({
              certificateId: id,
              partnerUserId: partnerId,
            });
          }
        }
      }
    );

    // 6. Handle insufficient credits
    if (!creditResult.success) {
      return NextResponse.json({
        error: creditResult.error,
        required: creditResult.required,
        balance: creditResult.balance,
        message: `Bu işlem için ${creditResult.required} kredi gerekiyor. Mevcut: ${creditResult.balance} kredi`
      }, { status: 402 });
    }

    return NextResponse.json({ success: true, id }, { status: 200 });

  } catch (err: any) {
    console.error("PUT /api/certificates/[id] error", err);
    return NextResponse.json({
      error: 'u{0130}u{015F}lem su{0131}rasu{0131}nda bir hata oluu{015F}tu.'
    }, { status: 500 });
  }
}

