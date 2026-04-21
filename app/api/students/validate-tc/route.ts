import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/db/client';
import { students } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { nationalIds, emails, phones } = await req.json();

    const result: {
      existingTCs: string[];
      existingEmails: string[];
      existingPhones: string[];
    } = {
      existingTCs: [],
      existingEmails: [],
      existingPhones: [],
    };

    // Check TC numbers
    if (Array.isArray(nationalIds) && nationalIds.length > 0) {
      const existingStudents = await db
        .select({ nationalId: students.nationalId })
        .from(students)
        .where(
          and(
            eq(students.institutionUserId, userId),
            inArray(students.nationalId, nationalIds)
          )
        );
      result.existingTCs = existingStudents.map((s: { nationalId: string }) => s.nationalId);
    }

    // Check emails (only non-null emails)
    if (Array.isArray(emails) && emails.length > 0) {
      const validEmails = emails.filter(e => e && e.trim() !== '');
      if (validEmails.length > 0) {
        const existingStudents = await db
          .select({ email: students.email })
          .from(students)
          .where(
            and(
              eq(students.institutionUserId, userId),
              inArray(students.email, validEmails)
            )
          );
        result.existingEmails = existingStudents
          .map((s: { email: string | null }) => s.email)
          .filter((e): e is string => !!e);
      }
    }

    // Check phones (only non-null phones)
    if (Array.isArray(phones) && phones.length > 0) {
      const validPhones = phones.filter(p => p && p.trim() !== '');
      if (validPhones.length > 0) {
        const existingStudents = await db
          .select({ phone: students.phone })
          .from(students)
          .where(
            and(
              eq(students.institutionUserId, userId),
              inArray(students.phone, validPhones)
            )
          );
        result.existingPhones = existingStudents
          .map((s: { phone: string | null }) => s.phone)
          .filter((p): p is string => !!p);
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('POST /api/students/validate-tc error', err);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.'}, { status: 500 });
  }
}
