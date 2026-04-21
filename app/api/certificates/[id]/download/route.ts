/**
 * PDF Download API - @react-pdf/renderer
 * 
 * Sertifika PDF'i indirir.
 * 
 * Endpoint: GET /api/certificates/[id]/download?studentId=xxx
 */

export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { certificates, trainings, certificateStudents, certificatePartners, students, organizations, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CertificateData } from "@/types/certificate";
import { getStudentDisplayName } from "@/utils/studentName";
import { generateQRCode } from "@/utils/qrCode";
import { generateCertificatePdfBuffer, generatePdfFilename } from "@/lib/react-pdf";
import { getPartnerLogo } from "@/utils/specialPartners";

// In-memory cache for generated PDFs
const pdfCache = new Map<string, { buffer: Buffer; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

// Clear cache for testing
pdfCache.clear();
console.log('[download] Cache cleared for testing');

// Force disable cache for testing
let cacheDisabled = true;

async function getFullCertificateData(certificateId: string, studentId: string | null): Promise<{ data: CertificateData, student: any } | null> {
  // 1. Get certificate with training and institution info
  const [certDetails] = await db
    .select({ certificate: certificates, training: trainings, institution: organizations })
    .from(certificates)
    .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
    .leftJoin(organizations, eq(certificates.institutionUserId, organizations.userId))
    .where(eq(certificates.id, certificateId))
    .limit(1);

  if (!certDetails) return null;

  console.log('[download] Starting PDF generation for certificate:', certificateId);
  console.log('[download] Student ID:', studentId);

  // 2. Get all students for the certificate with certificate-specific data
  const allStudents = await db
    .select({
      id: students.id,
      firstName: students.firstName,
      lastName: students.lastName,
      otherLastName: students.otherLastName,
      lastNameDisplay: students.lastNameDisplay,
      nationalId: students.nationalId,
      verifyBaseKey: students.verifyBaseKey,
      sequenceNo: certificateStudents.sequenceNo
    })
    .from(certificateStudents)
    .leftJoin(students, eq(certificateStudents.studentId, students.id))
    .where(eq(certificateStudents.certificateId, certDetails.certificate.id));

  console.log('[download] All students data:', allStudents.map(s => ({
    id: s.id,
    name: `${s.firstName} ${s.lastName}`,
    hasVerifyBaseKey: !!s.verifyBaseKey,
    hasSequenceNo: !!s.sequenceNo,
    verifyBaseKey: s.verifyBaseKey,
    sequenceNo: s.sequenceNo
  })));

  const targetStudent = studentId ? allStudents.find(s => s.id === studentId) : allStudents[0];
  console.log('[download] Target student:', targetStudent ? {
    id: targetStudent.id,
    name: `${targetStudent.firstName} ${targetStudent.lastName}`,
    hasVerifyBaseKey: !!targetStudent.verifyBaseKey,
    hasSequenceNo: !!targetStudent.sequenceNo
  } : 'NOT FOUND');

  if (!targetStudent) return null;

  // 3. Get partners with signature info
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
    .where(eq(certificatePartners.certificateId, certDetails.certificate.id));

  // Combine regular partners with external partners (RFR partners)
  const externalPartners = certDetails.certificate.externalPartners || [];
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

  // 4. Generate certificate code and verification URL
  let certificateCode: string | undefined = undefined;
  let verificationUrl: string | undefined = undefined;
  let qrCodeDataUrl: string | undefined = undefined;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://mertcin.com';

  // QR kod için verifyBaseKey yeterli, sequenceNo olmadan da çalışabilir
  if (targetStudent.verifyBaseKey) {
    // Eğer sequenceNo varsa kullan, yoksa null olarak bırak
    certificateCode = targetStudent.sequenceNo
      ? `${targetStudent.verifyBaseKey}${targetStudent.sequenceNo}`
      : targetStudent.verifyBaseKey;

    verificationUrl = `${baseUrl}/verify/result/${certificateCode}`;

    try {
      qrCodeDataUrl = await generateQRCode(verificationUrl, 150);
      console.log('[download] QR Code generated:', qrCodeDataUrl ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.error('[download] QR code generation failed:', error);
    }
  } else {
    console.log('[download] No verifyBaseKey found for QR code');
  }

  // 5. Site logo
  const siteLogo = `${baseUrl}/mertcin-anonym-logo.png`;

  // 6. Assemble the final data object
  const data: CertificateData = {
    id: certDetails.certificate.id,
    publicId: certDetails.certificate.publicId,
    certificateNumber: certDetails.certificate.publicId,
    certificateCode: certificateCode,
    verificationUrl: verificationUrl,
    dateIssued: certDetails.certificate.dateIssued,
    studentName: getStudentDisplayName({
      firstName: targetStudent.firstName || '',
      lastName: targetStudent.lastName || '',
      otherLastName: targetStudent.otherLastName,
      lastNameDisplay: targetStudent.lastNameDisplay,
    }),
    studentTc: targetStudent.nationalId || undefined,
    trainingName: certDetails.training?.name || 'Bilinmeyen Eğitim',
    trainingDescription: certDetails.training?.description || undefined,
    trainingHours: certDetails.training?.totalHours || undefined,
    trainingLevel: certDetails.training?.level || undefined,
    trainingLanguage: certDetails.training?.language || undefined,
    institutionName: certDetails.institution?.name || 'Bilinmeyen Kurum',
    institutionLogo: certDetails.institution?.logo || undefined,
    institutionSignature: certDetails.institution?.signature || undefined,
    institutionSignatureName: certDetails.institution?.signatureName || undefined,
    institutionSignatureTitle: certDetails.institution?.signatureTitle || undefined,
    partners: allPartners.map(p => {
      // Use special partner logo logic for RFR-1 and RFR-2
      const specialLogo = getPartnerLogo(p.publicId || '', certDetails.training?.level, p.logo);
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
    primaryColor: sanitizeColor(certDetails.certificate.colorPrimary) || '#1e40af',
    secondaryColor: sanitizeColor(certDetails.certificate.colorSecondary) || '#7c3aed',
    templateKey: (certDetails.certificate.templateKey || 'classic') as CertificateData['templateKey'],
    qrCode: qrCodeDataUrl,
  };

  return { data, student: targetStudent };
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
    console.warn('[download] Unsupported color format detected:', color);
    return undefined;
  }

  // Try to add # if it looks like a hex without it
  if (/^([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
    return '#' + color;
  }

  return undefined;
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const cacheKey = `${id}_${studentId || 'first'}`;

    console.log(`[download] Request: certificateId=${id}, studentId=${studentId}`);

    // Check cache first
    const cached = pdfCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log(`[download] Cache hit for ${cacheKey}`);
      const uint8Array = new Uint8Array(cached.buffer);
      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Length': String(uint8Array.byteLength),
          'Content-Disposition': `attachment; filename="sertifika-${cacheKey}.pdf"`,
          'X-Cache': 'HIT',
        },
      });
    }

    const certificateInfo = await getFullCertificateData(id, studentId);
    if (!certificateInfo) {
      return NextResponse.json({ error: "Certificate or student not found" }, { status: 404 });
    }

    const { data, student } = certificateInfo;

    // Generate PDF with @react-pdf/renderer
    console.log(`[download] Generating PDF for template: ${data.templateKey}`);
    const pdfBuffer = await generateCertificatePdfBuffer(data);

    // Save to cache
    pdfCache.set(cacheKey, { buffer: pdfBuffer, timestamp: Date.now() });

    // Clean up old cache entries periodically
    if (pdfCache.size > 100) {
      for (const [key, value] of pdfCache.entries()) {
        if (Date.now() - value.timestamp > CACHE_DURATION) {
          pdfCache.delete(key);
        }
      }
    }

    const filename = generatePdfFilename(data, student.firstName, student.lastName);
    const generationTime = Date.now() - startTime;

    console.log(`[download] PDF generated successfully in ${generationTime}ms`);

    const uint8Array = new Uint8Array(pdfBuffer);
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(uint8Array.byteLength),
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Cache': 'MISS',
        'X-Generation-Time': `${generationTime}ms`,
      },
    });

  } catch (err: any) {
    const generationTime = Date.now() - startTime;
    console.error(`[download] Error after ${generationTime}ms:`, err);
    return NextResponse.json({
      error: "PDF oluşturulamadı",
      generationTime: `${generationTime}ms`,
    }, { status: 500 });
  }
}
