import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { externalPartners } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'External Partner IDs must be a non-empty array' }, { status: 400 });
    }

    // Fetch all matching external partners
    const partners = await db
      .select({ publicId: externalPartners.publicId })
      .from(externalPartners)
      .where(inArray(externalPartners.publicId, ids));

    const validIds = new Set(partners.map(p => p.publicId));

    // Build results array
    const results = ids.map(id => ({
      id,
      isValid: validIds.has(id),
    }));

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('External partner validation error:', error);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.'}, { status: 500 });
  }
}
