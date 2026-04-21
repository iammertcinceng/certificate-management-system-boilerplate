import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, approvalCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import * as XLSX from 'xlsx';

// POST /api/approvals/uia-codes/upload
// Upload Excel file with UIA codes
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as any).id as string | undefined;
    if (!userId) return NextResponse.json({ error: "User not found" }, { status: 400 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const certificateId = formData.get('certificateId') as string;

    if (!file || !certificateId) {
      return NextResponse.json({ error: "File and certificate ID required" }, { status: 400 });
    }

    // Get certificate
    const certResult = await db
      .select()
      .from(certificates)
      .where(eq(certificates.publicId, certificateId))
      .limit(1);

    if (!certResult.length) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const certificate = certResult[0] as any;

    // Verify user is UIA responsible
    if (certificate.uiaResponsibleId !== userId) {
      return NextResponse.json({ error: "Not authorized - not UIA responsible" }, { status: 403 });
    }

    // Read Excel file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    if (!data.length) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 });
    }

    // Process and save UIA codes
    let savedCount = 0;
    for (const row of data) {
      const studentId = row.STUDENT_ID;
      const approvalCode = row.UIA_CODE;

      if (!studentId || !approvalCode || typeof approvalCode !== 'string' || !approvalCode.trim()) {
        continue;
      }

      // Check if code already exists
      const existing = await db
        .select()
        .from(approvalCodes)
        .where(
          and(
            eq(approvalCodes.certificateId, certificate.id),
            eq(approvalCodes.studentId, studentId)
          )
        )
        .limit(1);

      if (existing.length) {
        // Update
        await db
          .update(approvalCodes)
          .set({ 
            approvalCode: approvalCode.trim(),
            updatedAt: new Date()
          })
          .where(eq(approvalCodes.id, existing[0].id));
      } else {
        // Insert
        await db.insert(approvalCodes).values({
          certificateId: certificate.id,
          studentId,
          approvalCode: approvalCode.trim(),
        });
      }
      savedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      savedCount,
      message: `${savedCount} UIA kodu başarıyla kaydedildi.`
    }, { status: 200 });
  } catch (err: any) {
    console.error('POST /api/approvals/uia-codes/upload error', err);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
