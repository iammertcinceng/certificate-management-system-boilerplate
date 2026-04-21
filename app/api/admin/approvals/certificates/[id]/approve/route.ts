import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db/client';
import { certificates } from '@/db/schema';
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

    // Update certificate admin approval
    await db
      .update(certificates)
      .set({
        adminApproved: true,
        status: 'approved',
        updatedAt: new Date(),
      })
      .where(eq(certificates.id, id));

    const updated = await db.select().from(certificates).where(eq(certificates.id, id)).limit(1);

    return NextResponse.json({
      success: true,
      certificate: updated[0],
      message: 'Sertifika başarıyla onaylandı'
    });
  } catch (error) {
    console.error('Certificate approval error:', error);
    return NextResponse.json(
      { error: 'Sertifika onaylanırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
