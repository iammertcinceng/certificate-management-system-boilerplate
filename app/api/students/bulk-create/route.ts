import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db/client';
import { students } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { buildVerifyBaseKey } from '@/utils/userVerifyKey';

interface StudentInput {
  nationalId: string;
  firstName: string;
  lastName: string;
  secondaryLastName?: string | null;
  birthDate: string;
  email: string | null;
  phone: string | null;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { students: studentInputs } = await req.json();

    if (!Array.isArray(studentInputs) || studentInputs.length === 0) {
      return NextResponse.json({ error: 'No students provided' }, { status: 400 });
    }

    // Generate public IDs for students - only query THIS institution's students
    const existingStudents = await db
      .select({ publicId: students.publicId })
      .from(students)
      .where(eq(students.institutionUserId, userId));
    const existingPublicIds = new Set(existingStudents.map((s: { publicId: string }) => s.publicId));

    let counter = existingPublicIds.size + 1;
    const getNextPublicId = () => {
      let publicId = `STD-${String(counter).padStart(6, '0')}`;
      while (existingPublicIds.has(publicId)) {
        counter++;
        publicId = `STD-${String(counter).padStart(6, '0')}`;
      }
      existingPublicIds.add(publicId);
      counter++;
      return publicId;
    };

    // Prepare student records with verifyBaseKey pre-calculated
    const studentRecords = studentInputs.map((input: StudentInput) => {
      const firstName = input.firstName.trim();
      const lastName = input.lastName.trim();
      const nationalId = input.nationalId.trim();
      const birthDate = input.birthDate.trim();

      // Calculate verifyBaseKey upfront
      const verifyBaseKey = buildVerifyBaseKey({
        firstName,
        lastName,
        nationalId,
        birthDate
      });

      return {
        publicId: getNextPublicId(),
        institutionUserId: userId,
        nationalId,
        firstName,
        lastName,
        otherLastName: input.secondaryLastName?.trim() || null,
        birthDate,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        verifyBaseKey: verifyBaseKey || null,
      };
    });

    // Insert all students
    const result = await db.insert(students).values(studentRecords).returning();

    return NextResponse.json(
      {
        success: true,
        created: result.length,
        message: `${result.length} öğrenci başarıyla oluşturuldu.`
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('POST /api/students/bulk-create error', err);
    return NextResponse.json(
      { error: 'İşlem sırasında bir hata oluştu.'},
      { status: 500 }
    );
  }
}
