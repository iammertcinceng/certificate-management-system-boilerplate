import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db/client";
import { certificates, trainings, certificateStudents, certificatePartners, students, organizations, users, balances, balanceTransactions, externalPartners } from "@/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generatePublicId } from "@/utils/id";

// GET /api/certificates - List all certificates for current institution
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Get certificates with training info, student count, and partners
    const result = await db
      .select({
        certId: certificates.id,
        certPublicId: certificates.publicId,
        certTrainingId: certificates.trainingId,
        certInstitutionUserId: certificates.institutionUserId,
        certDateIssued: certificates.dateIssued,
        certStartDate: certificates.startDate,
        certEndDate: certificates.endDate,
        certStatus: certificates.status,
        certTemplateKey: certificates.templateKey,
        certColorPrimary: certificates.colorPrimary,
        certColorSecondary: certificates.colorSecondary,
        certUiaRequired: certificates.uiaRequired,
        certUiaResponsibleId: certificates.uiaResponsibleId,
        certInstitutionApproved: certificates.institutionApproved,
        certPartnerApproved: certificates.partnerApproved,
        certAdminApproved: certificates.adminApproved,
        certCreatedAt: certificates.createdAt,
        training: trainings,
        studentCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${certificateStudents} 
          WHERE ${certificateStudents.certificateId} = ${certificates.id}
        )`,
      })
      .from(certificates)
      .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
      .where(eq(certificates.institutionUserId, userId))
      .orderBy(certificates.createdAt);

    // For each certificate, get partners
    const certificatesWithDetails = await Promise.all(
      result.map(async (row) => {
        // Fetch institution organization info (name/logo) from profile
        const instOrg = await db
          .select({ name: organizations.name, logo: organizations.logo })
          .from(organizations)
          .where(eq(organizations.userId, row.certInstitutionUserId))
          .limit(1);
        const partners = await db
          .select({
            userId: certificatePartners.partnerUserId,
            name: organizations.name,
            publicId: organizations.publicId,
            logo: organizations.logo,
          })
          .from(certificatePartners)
          .leftJoin(users, eq(certificatePartners.partnerUserId, users.id))
          .leftJoin(organizations, eq(users.id, organizations.userId))
          .where(eq(certificatePartners.certificateId, row.certId));

        return {
          id: row.certId,
          publicId: row.certPublicId,
          trainingName: row.training?.name || 'Unknown',
          trainingId: row.certTrainingId,
          dateIssued: row.certDateIssued,
          startDate: row.certStartDate,
          endDate: row.certEndDate,
          status: row.certStatus,
          studentCount: row.studentCount || 0,
          templateKey: row.certTemplateKey,
          colorPrimary: row.certColorPrimary,
          colorSecondary: row.certColorSecondary,
          uiaRequired: row.certUiaRequired,
          uiaResponsibleId: row.certUiaResponsibleId,
          institutionApproved: row.certInstitutionApproved,
          partnerApproved: row.certPartnerApproved,
          adminApproved: row.certAdminApproved,
          partners: [
            ...partners.map(p => ({ userId: p.userId, name: p.name, publicId: p.publicId, logo: p.logo })),
          ],
          institutionName: instOrg[0]?.name || null,
          institutionLogo: instOrg[0]?.logo || null,
          createdAt: row.certCreatedAt,
        };
      })
    );

    return NextResponse.json({ certificates: certificatesWithDetails }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/certificates error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

// POST /api/certificates - Create new certificate
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const {
      trainingId,
      dateIssued,
      startDate, // Optional certificate start date
      endDate, // Optional certificate end date (if not provided, uses dateIssued)
      studentIds = [],
      partnerUserIds = [],
      referencePartnerPublicIds = [],
      templateKey = 'classic',
      colorPrimary,
      colorSecondary,
      uiaRequired = false,
      uiaResponsibleId,
    } = body;

    // Use endDate if provided, otherwise fall back to dateIssued
    const effectiveEndDate = endDate || dateIssued;

    if (!trainingId || !effectiveEndDate) {
      const missing = [];
      if (!trainingId) missing.push('trainingId');
      if (!effectiveEndDate) missing.push('dateIssued/endDate');
      return NextResponse.json({
        error: `Missing required fields: ${missing.join(', ')}`,
        received: { trainingId: !!trainingId, dateIssued: !!dateIssued, endDate: !!endDate }
      }, { status: 400 });
    }

    // Generate unique publicId using utils/generatePublicId (global uniqueness)
    const publicId = await generatePublicId('CRT', async () => {
      const rows = await db
        .select({ publicId: certificates.publicId })
        .from(certificates)
        .orderBy(sql`${certificates.publicId} DESC`)
        .limit(1);
      if (!rows.length) return 0;
      const match = rows[0].publicId.match(/CRT-(\d{6})$/);
      return match ? parseInt(match[1], 10) : 0;
    });

    // NOTE: Credit is NOT deducted here. Credit will be deducted when institution approves the certificate.
    // This allows users to create certificates without having credits, and approve them later after loading credits.

    let externalPartnerSnapshots: Array<{ publicId: string; name: string; logo?: string | null }> = [];
    if (Array.isArray(referencePartnerPublicIds) && referencePartnerPublicIds.length > 0) {
      const rows = await db.select().from(externalPartners).where(inArray(externalPartners.publicId, referencePartnerPublicIds));
      externalPartnerSnapshots = rows.map((r: any) => ({ publicId: r.publicId, name: r.name, logo: r.logo || null }));
    }

    // Create certificate
    const [newCertificate] = await db
      .insert(certificates)
      .values({
        publicId,
        trainingId,
        institutionUserId: userId,
        dateIssued: effectiveEndDate, // Use effective end date as dateIssued for compatibility
        startDate: startDate || null,
        endDate: effectiveEndDate,
        status: 'pending',
        templateKey,
        colorPrimary,
        colorSecondary,
        uiaRequired,
        uiaResponsibleId,
        studentCount: studentIds.length.toString(),
        externalPartners: externalPartnerSnapshots.length ? externalPartnerSnapshots as any : null,
      })
      .returning();

    // Add students
    if (studentIds.length > 0) {
      await db.insert(certificateStudents).values(
        studentIds.map((studentId: string) => ({
          certificateId: newCertificate.id,
          studentId,
        }))
      );
    }

    // Add partners
    if (partnerUserIds.length > 0) {
      await db.insert(certificatePartners).values(
        partnerUserIds.map((partnerUserId: string) => ({
          certificateId: newCertificate.id,
          partnerUserId,
        }))
      );
    }

    return NextResponse.json({ certificate: newCertificate }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/certificates error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

// DELETE /api/certificates?id=xxx - Delete certificate
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(req.url);
    const certificateId = searchParams.get('id');

    if (!certificateId) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Check ownership
    const existing = await db
      .select()
      .from(certificates)
      .where(
        and(
          eq(certificates.id, certificateId),
          eq(certificates.institutionUserId, userId)
        )
      )
      .limit(1);

    if (!existing.length) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    // Delete (cascade will handle junction tables)
    await db.delete(certificates).where(eq(certificates.id, certificateId));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/certificates error", err);
    return NextResponse.json({
      error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}
