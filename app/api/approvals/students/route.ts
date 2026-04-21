import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/db/client";
import { certificateStudents, students, certificates } from "@/db/schema";
import { and, eq } from "drizzle-orm";

// GET /api/approvals/students?certificateId=<uuid or publicId>
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const certificateId = searchParams.get("certificateId");
    const certificatePublicId = searchParams.get("certificatePublicId");

    if (!certificateId && !certificatePublicId) {
      return NextResponse.json({ error: "certificateId or certificatePublicId required" }, { status: 400 });
    }

    // Resolve certificate id by publicId if needed
    let certIdToQuery = certificateId as string | null;
    if (!certIdToQuery && certificatePublicId) {
      const cert = await db.select().from(certificates).where(eq(certificates.publicId, certificatePublicId)).limit(1);
      if (!cert.length) {
        return NextResponse.json({ students: [] }, { status: 200 });
      }
      certIdToQuery = cert[0].id as string;
    }

    const rows = await db
      .select({
        cs: certificateStudents,
        st: students,
      })
      .from(certificateStudents)
      .leftJoin(students, eq(certificateStudents.studentId, students.id))
      .where(eq(certificateStudents.certificateId, certIdToQuery!));

    const list = rows
      .filter(r => !!r.st)
      .map(r => ({
        id: r.st!.id,
        publicId: r.st!.publicId,
        nationalId: r.st!.nationalId,
        firstName: r.st!.firstName,
        lastName: r.st!.lastName,
        birthDate: r.st!.birthDate as any,
        email: r.st!.email,
        phone: r.st!.phone,
        addedAt: r.cs.addedAt,
      }));

    return NextResponse.json({ students: list }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/approvals/students error", err);
    return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
  }
}
