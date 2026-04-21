/**
 * Download All Certificates as ZIP
 * 
 * @react-pdf/renderer kullanarak tüm öğrenciler için PDF üretir ve ZIP olarak indirir.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, certificateStudents, students, trainings, organizations, certificatePartners, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import JSZip from "jszip";
import { generateCertificatePdfBuffer } from "@/lib/react-pdf";
import { getStudentDisplayName } from "@/utils/studentName";
import { generateQRCode } from "@/utils/qrCode";
import { CertificateData } from "@/types/certificate";
import { getPartnerLogo } from "@/utils/specialPartners";

export const runtime = 'nodejs';

// POST /api/certificates/[id]/download-all - Download all certificates as ZIP
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    // Environment check
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (!baseUrl) {
      console.warn('[download-all] NEXT_PUBLIC_BASE_URL not set, using fallback: https://mertcin.com');
    }

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('[download-all] Unauthorized request');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { id } = await params;

    console.log(`[download-all] Starting bulk download for certificate ${id} by user ${userId}`);

    if (!id) {
      return NextResponse.json({ error: "Certificate ID required" }, { status: 400 });
    }

    // Get certificate data with training and institution info
    const [certificateData] = await db
      .select({
        certificate: certificates,
        training: trainings,
        institution: organizations,
      })
      .from(certificates)
      .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
      .leftJoin(organizations, eq(certificates.institutionUserId, organizations.userId))
      .where(
        and(
          eq(certificates.id, id),
          eq(certificates.institutionUserId, userId)
        )
      )
      .limit(1);

    if (!certificateData) {
      return NextResponse.json({ error: "Certificate not found or access denied" }, { status: 404 });
    }

    // Get all students for this certificate with certificate-specific data
    const studentList = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        otherLastName: students.otherLastName,
        lastNameDisplay: students.lastNameDisplay,
        nationalId: students.nationalId,
        verifyBaseKey: students.verifyBaseKey,
        sequenceNo: certificateStudents.sequenceNo,
      })
      .from(certificateStudents)
      .innerJoin(students, eq(certificateStudents.studentId, students.id))
      .where(eq(certificateStudents.certificateId, id));

    if (studentList.length === 0) {
      return NextResponse.json({ error: "No students found for this certificate" }, { status: 404 });
    }

    // Create ZIP file
    const zip = new JSZip();

    // Get partners data with signature info
    const regularPartners = await db
      .select({
        publicId: organizations.publicId,
        name: organizations.name,
        logo: organizations.logo,
        signature: organizations.signature,
        signatureName: organizations.signatureName,
        signatureTitle: organizations.signatureTitle,
      })
      .from(certificatePartners)
      .leftJoin(users, eq(certificatePartners.partnerUserId, users.id))
      .leftJoin(organizations, eq(users.id, organizations.userId))
      .where(eq(certificatePartners.certificateId, id));

    // Combine regular partners with external partners (RFR partners)
    const externalPartners = certificateData.certificate.externalPartners || [];
    const allPartners = [
      ...regularPartners.map(p => ({
        publicId: p.publicId,
        name: p.name || 'Unknown Partner',
        logo: p.logo,
        signature: p.signature,
        signatureName: p.signatureName,
        signatureTitle: p.signatureTitle,
      })),
      ...externalPartners.map(p => ({
        publicId: p.publicId,
        name: p.name,
        logo: p.logo,
        signature: null,
        signatureName: null,
        signatureTitle: null,
      })),
    ];

    // Site logo URL - use baseUrl from environment check above
    const effectiveBaseUrl = baseUrl || 'https://mertcin.com';
    const siteLogo = `${effectiveBaseUrl}/mertcin-anonym-logo.png`;

    // Generate PDF for each student and add to ZIP
    for (const student of studentList) {
      // Generate certificate code and verification URL
      let certificateCode: string | undefined = undefined;
      let verificationUrl: string | undefined = undefined;
      let qrCodeDataUrl: string | undefined = undefined;

      if (student.verifyBaseKey && student.sequenceNo) {
        certificateCode = `${student.verifyBaseKey}${student.sequenceNo}`;
        verificationUrl = `${effectiveBaseUrl}/verify/result/${certificateCode}`;

        try {
          qrCodeDataUrl = await generateQRCode(verificationUrl, 150);
        } catch (error) {
          console.error('[download-all] QR code generation failed:', error);
        }
      }

      const pdfData: CertificateData = {
        id: certificateData.certificate.id,
        publicId: certificateData.certificate.publicId,
        certificateNumber: certificateData.certificate.publicId,
        certificateCode: certificateCode,
        verificationUrl: verificationUrl,
        dateIssued: certificateData.certificate.dateIssued,
        studentName: getStudentDisplayName({
          firstName: student.firstName || '',
          lastName: student.lastName || '',
          otherLastName: student.otherLastName,
          lastNameDisplay: student.lastNameDisplay,
        }),
        studentTc: student.nationalId || undefined,
        trainingName: certificateData.training?.name || 'Eğitim',
        trainingDescription: certificateData.training?.description || undefined,
        trainingHours: certificateData.training?.totalHours || undefined,
        trainingLevel: certificateData.training?.level || undefined,
        trainingLanguage: certificateData.training?.language || undefined,
        institutionName: certificateData.institution?.name || 'Kurum',
        institutionLogo: certificateData.institution?.logo || undefined,
        institutionSignature: certificateData.institution?.signature || undefined,
        institutionSignatureName: certificateData.institution?.signatureName || undefined,
        institutionSignatureTitle: certificateData.institution?.signatureTitle || undefined,
        partners: allPartners.map(p => {
          // Use special partner logo logic for RFR-1 and RFR-2
          const specialLogo = getPartnerLogo(p.publicId || '', certificateData.training?.level, p.logo);
          return {
            name: p.name || 'Partner',
            logo: specialLogo || undefined,
            signature: p.signature || undefined,
            signatureName: p.signatureName || undefined,
            signatureTitle: p.signatureTitle || undefined,
          };
        }),
        siteName: 'Mert CIN Certificates',
        siteLogo: siteLogo,
        primaryColor: sanitizeColor(certificateData.certificate.colorPrimary) || '#1e40af',
        secondaryColor: sanitizeColor(certificateData.certificate.colorSecondary) || '#7c3aed',
        templateKey: (certificateData.certificate.templateKey || 'classic') as CertificateData['templateKey'],
        qrCode: qrCodeDataUrl,
      };

      const pdfBuffer = await generateCertificatePdfBuffer(pdfData);

      // Türkçe karakterleri temizle dosya adı için
      const cleanFirstName = (student.firstName || '').replace(/[ğüşıöçĞÜŞİÖÇ]/g, c =>
        ({ 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c', 'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'İ': 'I', 'Ö': 'O', 'Ç': 'C' }[c] || c)
      );
      const cleanLastName = (student.lastName || '').replace(/[ğüşıöçĞÜŞİÖÇ]/g, c =>
        ({ 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c', 'Ğ': 'G', 'Ü': 'U', 'Ş': 'S', 'İ': 'I', 'Ö': 'O', 'Ç': 'C' }[c] || c)
      );

      // Dosya adı: sertifika-CRT-000004-Ali-Yilmaz.pdf formatında
      const fileName = `sertifika-${certificateData.certificate.publicId}-${cleanFirstName}-${cleanLastName}.pdf`;
      zip.file(fileName, pdfBuffer);
    }

    // Generate ZIP buffer and convert to Uint8Array for NextResponse compatibility
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const uint8Array = new Uint8Array(zipBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': String(uint8Array.byteLength),
        'Content-Disposition': `attachment; filename="${certificateData.certificate.publicId}-certificates.zip"`,
      },
    });
  } catch (err: any) {
    console.error("POST /api/certificates/[id]/download-all error", err);
    return NextResponse.json({
      error: 'u{0130}u{015F}lem su{0131}rasu{0131}nda bir hata oluu{015F}tu.'
    }, { status: 500 });
  }
}

// Helper function to sanitize colors - only accept hex format
function sanitizeColor(color: string | null | undefined): string | undefined {
  if (!color) return undefined;

  // Check if it's a valid hex color
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(color)) {
    return color;
  }

  // If it contains unsupported color functions like lab(), oklch(), etc., return undefined
  if (color.includes('(')) {
    console.warn('[download-all] Unsupported color format detected:', color);
    return undefined;
  }

  // Try to add # if it looks like a hex without it
  if (/^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return '#' + color;
  }

  return undefined;
}

