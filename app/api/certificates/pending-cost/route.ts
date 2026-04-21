import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, siteSettings, certificateStudents } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";

// GET /api/certificates/pending-cost
// Returns pendingAmount (credits): sum of (studentCount * creditPerStudent) for all pending certificates
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id;

    // Get pending certificates with their student counts
    const rows = await db
      .select({
        id: certificates.id,
        studentCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${certificateStudents} 
          WHERE ${certificateStudents.certificateId} = ${certificates.id}
        )`
      })
      .from(certificates)
      .where(and(eq(certificates.institutionUserId, userId), eq(certificates.status, 'pending')));

    // Get credit per student from config
    const configRows = await db.select().from(siteSettings).limit(1);
    const creditPerStudent = configRows.length ? Number(configRows[0].creditPerStudent) || 1 : 1;

    // Calculate total pending amount: sum of (studentCount * creditPerStudent) for each certificate
    const pendingAmount = rows.reduce((sum, cert) => sum + ((cert.studentCount || 0) * creditPerStudent), 0);

    return NextResponse.json({
      pendingAmount,
      creditPerStudent,
      pendingCertificateCount: rows.length
    }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/certificates/pending-cost error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

