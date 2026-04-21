import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { siteSettings } from "@/db/schema";

// POST /api/certificates/cost - Calculate required credit amount for certificate creation
// Body: { studentCount: number } - Required: number of students in the certificate
// Returns total credits required based on studentCount * creditPerStudent
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const studentCount = Number(body.studentCount) || 1;

    const rows = await db.select().from(siteSettings).limit(1);
    const creditPerStudent = rows.length ? Number(rows[0].creditPerStudent) || 1 : 1;

    // Calculate total required credits: studentCount * creditPerStudent
    const requiredAmount = studentCount * creditPerStudent;

    return NextResponse.json({
      requiredAmount,
      creditPerStudent,
      studentCount
    }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/certificates/cost error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu."}, { status: 500 });
  }
}

