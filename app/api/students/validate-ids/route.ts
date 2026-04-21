import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { students } from '@/db/schema';
import { inArray } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Student IDs must be a non-empty array' }, { status: 400 });
    }

    // Veritabanında hem publicId hem de nationalId kolonlarında ara
    const foundStudents = await db
      .select({ publicId: students.publicId, nationalId: students.nationalId })
      .from(students)
      .where(
        ids.some(id => id.startsWith('STD-'))
          ? inArray(students.publicId, ids)
          : inArray(students.nationalId, ids)
      );

    // Hem Public ID hem de TC Number'ları bir set'e topla
    const foundIds = new Set([
      ...foundStudents.map(s => s.publicId),
      ...foundStudents.map(s => s.nationalId)
    ]);

    const validationResults = ids.map(id => ({
      id,
      isValid: foundIds.has(id),
    }));

    return NextResponse.json({ results: validationResults });
  } catch (error) {
    console.error('Failed to validate student IDs:', error);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
