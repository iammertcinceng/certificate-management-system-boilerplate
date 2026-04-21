import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/db/client";
import { certificates, students, trainings, organizations, certificateStudents } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { sendEmail } from "@/lib/email/send";
import type { CertificateReadyEmailData } from "@/lib/email/types";

// POST /api/email/send-certificate-ready
// Sends "Certificate Ready" email to the student(s) of a certificate
// Body: { certificateId: string, studentId?: string }
// If studentId is provided, sends to that specific student
// If not provided, sends to all students with email addresses
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = (session.user as any).id;

        const body = await req.json();
        const { certificateId, studentId } = body || {};

        if (!certificateId) {
            return NextResponse.json({ error: 'certificateId required' }, { status: 400 });
        }

        // 1. Fetch certificate details
        const certRows = await db
            .select({
                id: certificates.id,
                publicId: certificates.publicId,
                trainingName: trainings.name,
                institutionName: organizations.name,
            })
            .from(certificates)
            .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
            .innerJoin(organizations, eq(certificates.institutionUserId, organizations.userId))
            .where(and(eq(certificates.id, certificateId), eq(certificates.institutionUserId, userId)))
            .limit(1);

        if (!certRows.length) {
            return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
        }

        const cert = certRows[0];

        // 2. Fetch students for this certificate (via junction table)
        // Build where condition based on whether studentId is provided
        const whereCondition = studentId
            ? and(eq(certificateStudents.certificateId, certificateId), eq(students.id, studentId))
            : eq(certificateStudents.certificateId, certificateId);

        const studentRows = await db
            .select({
                id: students.id,
                firstName: students.firstName,
                lastName: students.lastName,
                email: students.email,
                verifyBaseKey: students.verifyBaseKey,
            })
            .from(certificateStudents)
            .innerJoin(students, eq(certificateStudents.studentId, students.id))
            .where(whereCondition);

        if (!studentRows.length) {
            return NextResponse.json({ error: 'No students found for this certificate' }, { status: 400 });
        }

        // Filter students with email addresses
        const studentsWithEmail = studentRows.filter(s => s.email);

        if (!studentsWithEmail.length) {
            return NextResponse.json({
                error: 'No students with email addresses. Please add email to students first.',
                totalStudents: studentRows.length,
                studentsWithEmail: 0
            }, { status: 400 });
        }

        // 3. Send email to each student
        const baseUrl = process.env.NEXTAUTH_URL || 'https://mertcin.com';
        let sentCount = 0;
        let failedCount = 0;

        // Get sequence numbers for students in this certificate
        const studentSequences = await db
            .select({
                studentId: certificateStudents.studentId,
                sequenceNo: certificateStudents.sequenceNo,
            })
            .from(certificateStudents)
            .where(eq(certificateStudents.certificateId, certificateId));

        const sequenceMap = new Map(studentSequences.map(s => [s.studentId, s.sequenceNo]));

        for (const student of studentsWithEmail) {
            // Build verification code from verifyBaseKey + sequenceNo
            const sequenceNo = sequenceMap.get(student.id);
            const verificationCode = student.verifyBaseKey && sequenceNo
                ? `${student.verifyBaseKey}${sequenceNo}`
                : undefined;

            // Build correct verification URL: /verify/result/[certId]?studentId=[studentId]
            const verifyUrl = `${baseUrl}/verify/result/${cert.id}?studentId=${encodeURIComponent(student.id)}`;

            const emailData: CertificateReadyEmailData = {
                templateId: 'CERT_READY_MANUAL',
                recipientEmail: student.email!,
                recipientName: `${student.firstName} ${student.lastName}`,
                language: 'tr',
                certificatePublicId: cert.publicId,
                trainingName: cert.trainingName,
                studentName: `${student.firstName} ${student.lastName}`,
                verificationUrl: verifyUrl,
                institutionName: cert.institutionName,
                verificationCode: verificationCode,
            };

            const result = await sendEmail(emailData, userId);

            if (result.success) {
                sentCount++;
            } else {
                failedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Email sent to ${sentCount} student(s)`, //öeviri eklenecek. 
            sent: sentCount,
            failed: failedCount,
            totalWithEmail: studentsWithEmail.length
        }, { status: 200 });

    } catch (err: any) {
        console.error("POST /api/email/send-certificate-ready error", err);
        return NextResponse.json({ error: "İşlem sırasında bir hata oluştu." }, { status: 500 });
    }
}