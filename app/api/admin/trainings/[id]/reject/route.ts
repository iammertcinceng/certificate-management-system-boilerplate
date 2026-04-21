import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db/client';
import { trainings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role as string | undefined;
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const userId = (session.user as any).id;

    // Update training status to rejected
    await db
      .update(trainings)
      .set({
        status: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(trainings.id, id));

    const updated = await db.select().from(trainings).where(eq(trainings.id, id)).limit(1);

    return NextResponse.json({
      success: true,
      training: updated[0],
      message: 'Eğitim reddedildi'
    });
  } catch (error) {
    console.error('Training rejection error:', error);
    return NextResponse.json(
      { error: 'Eğitim reddedilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
