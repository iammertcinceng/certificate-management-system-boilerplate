import { NextResponse } from "next/server";
import { db } from "@/db/client";
import { students, certificateStudents, certificates, trainings, organizations } from "@/db/schema";
import { and, eq, like, sql, desc, asc } from "drizzle-orm";
import { parseUserVerifyInput, matchesBaseKey, turkishToAscii, buildVerifyBaseKey } from "@/utils/userVerifyKey";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const fullName = (searchParams.get("fullName") || "").trim();

    const parsed = parseUserVerifyInput(q);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid verify key" }, { status: 400 });
    }

    const { baseKey, index } = parsed;
    const tcPrefix = baseKey.slice(2, 6);
    const dd = baseKey.slice(6, 8);
    const mm = baseKey.slice(8, 10);

    // Filter by TC prefix, day and month via SQL; then refine in-memory by exact key match
    const candidateRows = await db
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        otherLastName: students.otherLastName,
        nationalId: students.nationalId,
        birthDate: students.birthDate,
      })
      .from(students)
      .where(
        and(
          like(students.nationalId, `${tcPrefix}%`),
          sql`EXTRACT(DAY FROM ${students.birthDate}) = ${Number(dd)}`,
          sql`EXTRACT(MONTH FROM ${students.birthDate}) = ${Number(mm)}`,
        )
      );

    const matched = candidateRows.filter(s => matchesBaseKey({ ...s, firstName: (s as any).firstName }, baseKey));

    if (matched.length === 0) {
      return NextResponse.json({ error: "No match" }, { status: 404 });
    }

    // If collisions, optionally resolve by fullName
    let selected = matched;
    if (matched.length > 1) {
      if (fullName) {
        const norm = (v: string) => turkishToAscii(v).toUpperCase().replace(/\s+/g, " ").trim();
        const target = norm(fullName);
        const filtered = matched.filter(s => norm(`${s.firstName} ${s.lastName}`) === target);
        if (filtered.length === 0) {
          return NextResponse.json({
            status: 'collision',
            students: matched.map(s => ({ id: s.id, name: s.otherLastName ? `${s.firstName} ${s.lastName} ${s.otherLastName}` : `${s.firstName} ${s.lastName}` })),
            error: 'Name not matched',
          }, { status: 409 });
        }
        selected = filtered;
      } else {
        return NextResponse.json({
          status: 'collision',
          students: matched.map(s => ({ id: s.id, name: s.otherLastName ? `${s.firstName} ${s.lastName} ${s.otherLastName}` : `${s.firstName} ${s.lastName}` })),
        }, { status: 200 });
      }
    }

    // At this point, selected contains 1+ students; if still >1 after name filtering, just take deterministic first
    const targetStudent = selected[0];
    // Ensure student's verify_base_key is stored; lazily backfill if missing
    const existingStudent = await db
      .select({ id: students.id, verifyBaseKey: students.verifyBaseKey, firstName: students.firstName, lastName: students.lastName, nationalId: students.nationalId, birthDate: students.birthDate })
      .from(students)
      .where(eq(students.id, targetStudent.id));
    const srow = existingStudent[0];
    if (srow && !srow.verifyBaseKey) {
      const computed = buildVerifyBaseKey({ firstName: srow.firstName, lastName: srow.lastName, nationalId: srow.nationalId, birthDate: srow.birthDate });
      if (computed) {
        await db.update(students).set({ verifyBaseKey: computed }).where(eq(students.id, targetStudent.id));
      }
    }

    // Fetch student's certificates with related info
    const certRows = await db
      .select({
        csId: certificateStudents.id,
        csSequence: certificateStudents.sequenceNo,
        certId: certificates.id,
        certPublicId: certificates.publicId,
        dateIssued: certificates.dateIssued,
        trainingName: trainings.name,
        institutionName: organizations.name,
      })
      .from(certificateStudents)
      .leftJoin(certificates, eq(certificateStudents.certificateId, certificates.id))
      .leftJoin(trainings, eq(certificates.trainingId, trainings.id))
      .leftJoin(organizations, eq(certificates.institutionUserId, organizations.userId))
      .where(eq(certificateStudents.studentId, targetStudent.id));

    // Sort by sequenceNo DESC (newest first)
    const sorted = certRows
      .filter(r => r.certId)
      .sort((a, b) => {
        // Sort by sequenceNo DESC
        return (b.csSequence || 0) - (a.csSequence || 0);
      });

    // Lazily assign sequence numbers if missing, based on sorted order
    const toAssign = sorted.filter(r => !r.csSequence);
    if (toAssign.length) {
      // Find current max sequence for this student
      const maxExisting = Math.max(0, ...sorted.map(r => r.csSequence || 0));
      let next = maxExisting > 0 ? maxExisting + 1 : 1;
      for (const row of sorted) {
        if (!row.csSequence) {
          await db.update(certificateStudents).set({ sequenceNo: next }).where(eq(certificateStudents.id, row.csId));
          row.csSequence = next;
          next += 1;
        }
      }
    }

    if (!sorted.length) {
      return NextResponse.json({ error: 'No certificates for student' }, { status: 404 });
    }

    // If index provided, map to 1-based index
    if (typeof index === 'number') {
      // Pick by stored sequence number
      const picked = sorted.find(r => r.csSequence === index);
      if (!picked) {
        return NextResponse.json({
          status: 'list',
          student: { id: targetStudent.id, name: (targetStudent as any).otherLastName ? `${targetStudent.firstName} ${targetStudent.lastName} ${(targetStudent as any).otherLastName}` : `${targetStudent.firstName} ${targetStudent.lastName}` },
          certificates: sorted.map((c) => ({
            n: c.csSequence!,
            id: c.certId,
            publicId: c.certPublicId,
            certificateNumber: `${baseKey}${c.csSequence}`,
            trainingName: c.trainingName,
            dateIssued: c.dateIssued,
            institutionName: c.institutionName,
          })),
          error: 'Index out of range',
        }, { status: 416 });
      }
      return NextResponse.json({
        status: 'detail',
        student: { id: targetStudent.id, name: (targetStudent as any).otherLastName ? `${targetStudent.firstName} ${targetStudent.lastName} ${(targetStudent as any).otherLastName}` : `${targetStudent.firstName} ${targetStudent.lastName}` },
        certificate: {
          id: picked.certId,
          publicId: picked.certPublicId,
          dateIssued: picked.dateIssued,
          trainingName: picked.trainingName,
          institutionName: picked.institutionName,
        }
      }, { status: 200 });
    }

    // Otherwise, list
    return NextResponse.json({
      status: 'list',
      student: { id: targetStudent.id, name: (targetStudent as any).otherLastName ? `${targetStudent.firstName} ${targetStudent.lastName} ${(targetStudent as any).otherLastName}` : `${targetStudent.firstName} ${targetStudent.lastName}` },
      certificates: sorted.map((c) => ({
        n: c.csSequence!,
        id: c.certId,
        publicId: c.certPublicId,
        certificateNumber: `${baseKey}${c.csSequence}`,
        trainingName: c.trainingName,
        dateIssued: c.dateIssued,
        institutionName: c.institutionName,
      })),
    }, { status: 200 });
  } catch (err: any) {
    console.error('GET /api/verify error', err);
    return NextResponse.json({ error: 'İşlem sırasında bir hata oluştu.' }, { status: 500 });
  }
}
