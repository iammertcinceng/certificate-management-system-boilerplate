import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificates, students, certificatePartners, certificateStudents, approvalCodes } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import * as XLSX from 'xlsx';

// GET /api/certificates/[id]/export-excel
// Export certificate data with students to Excel for UIA code filling
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

    // Get students via junction table
    const certStudentsJunction = await db
      .select({
        student: students,
      })
      .from(certificateStudents)
      .leftJoin(students, eq(certificateStudents.studentId, students.id))
      .where(eq(certificateStudents.certificateId, certificate.id));
    
    if (certStudentsJunction.length === 0) {
      return NextResponse.json({ error: "No students found" }, { status: 404 });
    }

    const studentsResult = certStudentsJunction.map(({ student }) => student);

    // Get existing UIA codes
    const approvalCodesResult = await db
      .select()
      .from(approvalCodes)
      .where(eq(approvalCodes.certificateId, certificate.id));

    const approvalCodesMap = new Map(
      approvalCodesResult.map((c: any) => [c.studentId, c.approvalCode])
    );

    // Prepare Excel data
    const excelData = studentsResult.map((s: any) => ({
      STUDENT_ID: s.id,
      TC_NUMBER: s.nationalId,
      FIRST_NAME: s.firstName,
      LAST_NAME: s.lastName,
      BIRTH_DATE: s.birthDate,
      EMAIL: s.email || '',
      PHONE: s.phone || '',
      UIA_CODE: approvalCodesMap.get(s.id) || '',
    }));

    // Create workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'UIA Codes');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${certificateId}_approval_codes.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error('GET /api/certificates/[id]/export-excel error', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
