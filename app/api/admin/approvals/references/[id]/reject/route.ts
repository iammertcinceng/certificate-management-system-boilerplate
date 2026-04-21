import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db/client';
import { institutionPartners } from '@/db/schema';
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

    // Update partnership status to rejected
    await db
      .update(institutionPartners)
      .set({
        status: 'rejected',
        updatedAt: new Date(),
      })
      .where(eq(institutionPartners.id, id));

    const updated = await db.select().from(institutionPartners).where(eq(institutionPartners.id, id)).limit(1);

    return NextResponse.json({
      success: true,
      partnership: updated[0],
      message: 'Partnership reddedildi'
    });
  } catch (error) {
    console.error('Partnership rejection error:', error);
    return NextResponse.json(
      { error: 'Partnership reddedilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
