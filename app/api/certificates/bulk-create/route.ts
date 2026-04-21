import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { certificates, certificateStudents, certificatePartners, students, trainings, organizations, balances, balanceTransactions } from '@/db/schema';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generatePublicId } from '@/utils/id';
import { inArray, eq, sql } from 'drizzle-orm';
import { verifyRecaptcha, RECAPTCHA_THRESHOLDS } from '@/lib/recaptcha-server';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // %100 hemfikir olduğum nihai hedefimiz şu:
  // Sadece Excel: Sistem sadece .xlsx ve .xls dosyalarıyla çalışacak. CSV formatı tamamen devre dışı bırakılacak.
  // Standart Şablon: İndirilen şablon, STUDENT_ID, TRAINING_ID gibi UPPER_SNAKE_CASE başlıklarını içerecek.
  // Akıllı Gruplama: Yüklenen dosyadaki satırlar, "sertifika" bazında (öğrenci ID'si hariç diğer tüm alanlar aynı olanlar) gruplanacak ve onaya bu gruplar gönderilecek.
  // ID Formatları: TRN-000111 (6 haneli) ve ACR prefix'li partner ID'leri gibi formatlar, sunucu tarafındaki doğrulama mekanizmamız tarafından zaten desteklenmektedir. Bu konuda endişeniz olmasın, mevcut doğrulama mantığımız bu ID'leri veritabanında bularak doğru şekilde işleyecektir.
  try {
    const { groups, recaptchaToken } = await req.json();

    // reCAPTCHA v3 doğrulaması
    const { success, score } = await verifyRecaptcha(recaptchaToken, 'bulk_certificate_create');
    if (!success || score < RECAPTCHA_THRESHOLDS.BULK_CREATE) {
      console.warn(`[BulkCreate] reCAPTCHA failed — score: ${score}, success: ${success}`);
      return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 403 });
    }

    if (!Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json({ error: 'Groups data is required' }, { status: 400 });
    }

    const results: { certificateId: string; studentCount: number; error?: string }[] = [];
    const institutionUserId = session.user.id;

    // Collect all public IDs from payload to resolve to internal UUIDs in a few queries
    // OLD: Student ID (STD-XXXXXX) based extraction
    // const allStudentPublicIds = Array.from(new Set(groups.flatMap((g: any) => g.students?.map((s: any) => s.id).filter(Boolean) || [])));

    // NEW: TC Identity Number based extraction
    const allStudentTcNumbers = Array.from(new Set(groups.flatMap((g: any) => g.students?.map((s: any) => s.id).filter(Boolean) || [])));

    const allTrainingPublicIds = Array.from(new Set(groups.map((g: any) => g.trainingId).filter(Boolean)));
    const allOrgPublicIds = Array.from(new Set(groups.flatMap((g: any) => {
      const parts = (g.partnerIds?.split(',') || []).map((p: string) => p && p.trim()).filter(Boolean);
      const sup = g.supervisorId ? [g.supervisorId] : [];
      return [...parts, ...sup];
    }))).filter(Boolean);

    // Preload mappings from publicId/nationalId to internal UUIDs
    const [studentRows, trainingRows, orgRows] = await Promise.all([
      /* OLD: Student mapping by publicId
      allStudentPublicIds.length > 0
        ? db.select({ id: students.id, publicId: students.publicId }).from(students).where(inArray(students.publicId, allStudentPublicIds))
        : Promise.resolve([]),
      */
      // NEW: Student mapping by nationalId
      allStudentTcNumbers.length > 0
        ? db.select({ id: students.id, nationalId: students.nationalId }).from(students).where(inArray(students.nationalId, allStudentTcNumbers))
        : Promise.resolve([]),

      allTrainingPublicIds.length > 0
        ? db.select({ id: trainings.id, publicId: trainings.publicId }).from(trainings).where(inArray(trainings.publicId, allTrainingPublicIds))
        : Promise.resolve([]),
      allOrgPublicIds.length > 0
        ? db.select({ userId: organizations.userId, publicId: organizations.publicId }).from(organizations).where(inArray(organizations.publicId, allOrgPublicIds))
        : Promise.resolve([]),
    ]);

    // const studentIdMap = new Map<string, string>(studentRows.map(r => [r.publicId, r.id])); // OLD
    const studentIdMap = new Map<string, string>(studentRows.map(r => [r.nationalId, r.id])); // NEW (uses nationalId as key)
    const trainingIdMap = new Map<string, string>(trainingRows.map(r => [r.publicId, r.id]));
    const orgUserIdMap = new Map<string, string>(orgRows.map(r => [r.publicId, r.userId]));

    // NOTE: Credit is NOT deducted here. Credit will be deducted when institution approves each certificate.
    // This allows users to create certificates without having credits, and approve them later after loading credits.

    await db.transaction(async (tx) => {
      for (const group of groups) {
        const validStudents = (group.students || []).filter((s: any) => s._status !== 'invalid');

        // Resolve training publicId to internal UUID
        const trainingUuid = group.trainingId ? trainingIdMap.get(group.trainingId) : undefined;

        // Server-side validation: Skip group if essential data is missing
        if (!trainingUuid || !group.templateKey || validStudents.length === 0) {
          results.push({ certificateId: 'SKIPPED', studentCount: 0, error: 'Missing trainingId, templateKey, or valid students.' });
          continue; // Skip this group
        }

        // Handle dates - startDate is optional, endDate defaults to today if not provided
        const effectiveEndDate = group.endDate
          ? new Date(group.endDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        const startDateToInsert = group.startDate
          ? new Date(group.startDate).toISOString().split('T')[0]
          : null;

        // Map student public IDs to internal UUIDs; drop those not found just in case
        const studentLinksSource = validStudents
          .map((student: any) => ({ publicId: student.id, uuid: studentIdMap.get(student.id) }))
          .filter((s: any) => !!s.uuid);

        if (studentLinksSource.length === 0) {
          results.push({ certificateId: 'SKIPPED', studentCount: 0, error: 'No valid students resolved.' });
          continue;
        }

        // Map partner org public IDs to partner user UUIDs
        const partnerPublicIds = (group.partnerIds?.split(',').map((p: string) => p && p.trim()).filter(Boolean)) || [];
        const partnerUserIds = partnerPublicIds
          .map((pid: string) => orgUserIdMap.get(pid))
          .filter((id: string | undefined): id is string => !!id);

        // Smart UIA (Upper Institution Approval) logic:
        // 1. Eğer partner yok ve UIA gerekli ise → hata (atla)
        // 2. Eğer tek ACR partner var ve UIA gerekli ise → UIA sorumlusu otomatik o partner
        // 3. Eğer birden fazla ACR partner var ve UIA gerekli ise → UIA_RESPONSIBLE_ID gerekli
        // NOT: RFR prefix'li partnerlar kabul edilir ama UIA sorumlusu olamazlar
        let uiaResponsibleUserId: string | null = null;

        if (group.uiaRequired == 1) {
          // UIA Responsible ID kontrolü - sadece ACR prefix kabul
          if (group.uiaResponsibleId && !group.uiaResponsibleId.startsWith('ACR-')) {
            results.push({ certificateId: 'ATLANDI', studentCount: 0, error: `UIA sorumlusu (${group.uiaResponsibleId}) sadece ACR- prefix'li bir partner olabilir.` });
            continue;
          }

          // ACR prefix'li partnerları filtrele (sadece bunlar UIA sorumlusu olabilir)
          const acrPartnerIds = partnerPublicIds.filter((pid: string) => pid.startsWith('ACR-'));
          const acrPartnerUserIds = acrPartnerIds
            .map((pid: string) => orgUserIdMap.get(pid))
            .filter((id: string | undefined): id is string => !!id);

          if (acrPartnerUserIds.length === 0) {
            // ACR partner yok ama UIA gerekli → hata
            results.push({ certificateId: 'ATLANDI', studentCount: 0, error: 'Üst Kurum Onayı (UIA) için geçerli bir akreditör (ACR) partner gereklidir.' });
            continue;
          } else if (acrPartnerUserIds.length === 1) {
            // Tek ACR partner → otomatik UIA sorumlusu
            uiaResponsibleUserId = acrPartnerUserIds[0];
          } else {
            // Birden fazla ACR partner → UIA_RESPONSIBLE_ID gerekli
            if (!group.uiaResponsibleId) {
              results.push({ certificateId: 'ATLANDI', studentCount: 0, error: 'Birden fazla akreditör partner var. Lütfen Üst Kurum Sorumlusu (UIA_RESPONSIBLE_ID) belirtiniz.' });
              continue;
            }
            uiaResponsibleUserId = orgUserIdMap.get(group.uiaResponsibleId) || null;
            if (!uiaResponsibleUserId) {
              results.push({ certificateId: 'ATLANDI', studentCount: 0, error: `Belirtilen Üst Kurum Sorumlusu (${group.uiaResponsibleId}) listenizde bulunamadı.` });
              continue;
            }
          }
        }

        // Generate sequential publicId (same as certificates/route.ts)
        const publicId = await generatePublicId('CRT', async () => {
          const rows = await tx
            .select({ publicId: certificates.publicId })
            .from(certificates)
            .orderBy(sql`${certificates.publicId} DESC`)
            .limit(1);
          if (!rows.length) return 0;
          const match = rows[0].publicId.match(/CRT-(\d{6})$/);
          return match ? parseInt(match[1], 10) : 0;
        });

        const [newCertificate] = await tx.insert(certificates).values({
          institutionUserId: institutionUserId,
          trainingId: trainingUuid,
          publicId: publicId,
          templateKey: group.templateKey,
          dateIssued: effectiveEndDate, // Use effectiveEndDate as dateIssued for compatibility
          startDate: startDateToInsert, // Optional start date
          endDate: effectiveEndDate, // Required end date
          uiaRequired: group.uiaRequired == 1, // UIA (Upper Institution Approval) gerekli mi?
          uiaResponsibleId: uiaResponsibleUserId, // UIA sorumlusu (partner userId)
          status: 'pending',
          studentCount: String(validStudents.length), // Schema requires studentCount as text
          // Ensure all other not-null fields have a value
          institutionApproved: false,
          partnerApproved: false,
          adminApproved: true, // Admin onayı otomatik (gizlendi)
        }).returning();

        // Link students to this certificate
        const studentLinks = studentLinksSource.map((s: any) => ({
          certificateId: newCertificate.id,
          studentId: s.uuid,
        }));
        await tx.insert(certificateStudents).values(studentLinks);

        // Link partners to this certificate
        if (partnerUserIds.length > 0) {
          const partnerLinks = partnerUserIds.map((partnerUserId: string) => ({
            certificateId: newCertificate.id,
            partnerUserId,
          }));
          await tx.insert(certificatePartners).values(partnerLinks);
        }

        results.push({ certificateId: newCertificate.publicId, studentCount: validStudents.length });
      }
    });

    return NextResponse.json({
      message: 'Bulk certificate creation successful',
      created: results
    });

  } catch (error: any) {
    console.error('Failed to bulk create certificates:', error);
    return NextResponse.json({ error: 'Sertifika oluşturulurken beklenmedik bir hata oluştu.' }, { status: 500 });
  }
}
