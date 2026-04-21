import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { organizations } from '@/db/schema';
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
      return NextResponse.json({ error: 'Organization IDs must be a non-empty array' }, { status: 400 });
    }

    const foundOrgs = await db
      .select({ publicId: organizations.publicId })
      .from(organizations)
      .where(inArray(organizations.publicId, ids));

    const foundIds = new Set(foundOrgs.map(o => o.publicId));

    const validationResults = ids.map(id => ({
      id,
      isValid: foundIds.has(id),
    }));

    return NextResponse.json({ results: validationResults });
  } catch (error) {
    console.error('Failed to validate organization IDs:', error);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
