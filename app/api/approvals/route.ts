import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, trainings, organizations, certificatePartners, certificateStudents, users, approvalCodes } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// GET /api/approvals
// Lists certificates relevant to current partner (as partner via certificate_partners)
// If uiaRequired: show and mark if current partner is responsible (uiaResponsibleId)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string | undefined;
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 400 });

    // certificates where current user is a partner
    const rows = await db
      .select({
        cert: certificates,
        tr: trainings,
        org: organizations,
        instUser: users,
      })
      .from(certificates)
      .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
      .leftJoin(organizations, eq(certificates.institutionUserId, organizations.userId))
      .leftJoin(users, eq(certificates.institutionUserId, users.id))
      .leftJoin(certificatePartners, eq(certificates.id, certificatePartners.certificateId))
      .where(eq(certificatePartners.partnerUserId, userId));

    // Get student counts and UIA code counts for each certificate
    const itemsWithCounts = await Promise.all(rows.map(async r => {
      const cert = r.cert as any;
      const tr = r.tr as any;
      const org = r.org as any;
      const inst = r.instUser as any;
      
      // Count total students from junction table
      const studentCount = await db
        .select()
        .from(certificateStudents)
        .where(eq(certificateStudents.certificateId, cert.id));
      const totalStudents = studentCount.length;
      
      // Count completed UIA codes
      let completedUiaCodes = 0;
      if (cert.uiaRequired && cert.id) {
        const approvalCodesResult = await db
          .select()
          .from(approvalCodes)
          .where(eq(approvalCodes.certificateId, cert.id));
        completedUiaCodes = approvalCodesResult.filter((c: any) => c.approvalCode && c.approvalCode.trim()).length;
      }
      
      return {
        id: cert.publicId as string,
        trainingName: (tr?.name as string) || 'Eğitim',
        institution: (org?.name as string) || (inst?.email as string) || 'Kurum',
        date: (cert.createdAt as Date)?.toISOString?.() || new Date().toISOString(),
        uiaRequired: !!cert.uiaRequired,
        uiaResponsible: !!cert.uiaRequired && cert.uiaResponsibleId === userId,
        hasExcel: !!cert.excelPath,
        status: (cert.status as string) || 'pending',
        totalStudents,
        completedUiaCodes,
      };
    }));

    return NextResponse.json({ items: itemsWithCounts }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/approvals error', err);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
