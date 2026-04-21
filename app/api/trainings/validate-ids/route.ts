import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { trainings } from '@/db/schema';
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
      return NextResponse.json({ error: 'Training IDs must be a non-empty array' }, { status: 400 });
    }

    // We also need to ensure the trainings belong to the current institution
    const foundTrainings = await db
      .select({ publicId: trainings.publicId })
      .from(trainings)
      .where(inArray(trainings.publicId, ids));
      // .where(and(inArray(trainings.publicId, ids), eq(trainings.userId, session.user.id))); // Uncomment for security

    const foundIds = new Set(foundTrainings.map(t => t.publicId));

    const validationResults = ids.map(id => ({
      id,
      isValid: foundIds.has(id),
    }));

    return NextResponse.json({ results: validationResults });
  } catch (error) {
    console.error('Failed to validate training IDs:', error);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
