
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CertificateViewer } from '@/components/certificates/CertificateViewer';
import { CertificateData } from '@/types/certificate';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/ui/Loader';

export default function CertificateViewPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const studentId = search.get('studentId');
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);

        // 1) Get certificate list and find this cert
        const certRes = await fetch('/api/certificates');
        if (!certRes.ok) throw new Error('Failed to load certificates');
        const certData = await certRes.json();
        const cert = (certData.certificates || []).find((c: any) => c.id === params.id);
        if (!cert) throw new Error('Certificate not found');

        // 2) Get training details
        const trnRes = await fetch('/api/trainings');
        const trnData = trnRes.ok ? await trnRes.json() : { trainings: [] };
        const training = (trnData.trainings || []).find((t: any) => t.id === cert.trainingId);

        // 2.5) Get certificate data with partners
        let certificateWithPartners = cert;
        try {
          const certDetailRes = await fetch(`/api/certificates/${cert.id}`);
          if (certDetailRes.ok) {
            const certDetailData = await certDetailRes.json();
            certificateWithPartners = { ...cert, ...certDetailData };
          }
        } catch (err) {
          console.error('Failed to fetch certificate details:', err);
        }

        // 3) Get institution profile
        const orgRes = await fetch('/api/organization');
        const orgData = orgRes.ok ? await orgRes.json() : {};
        const institutionName = orgData.organization?.name || 'Kurumunuz';
        const institutionLogo = orgData.organization?.logo || undefined;

        // 4) Resolve student with certificate code data
        let student: any = null;
        let certificateCode: string | undefined = undefined;
        let verificationUrl: string | undefined = undefined;
        try {
          const stdRes = await fetch(`/api/certificates/${cert.id}/students`);
          if (stdRes.ok) {
            const stdData = await stdRes.json();
            const list = stdData.students || [];
            student = studentId ? list.find((s: any) => s.id === studentId) : list[0];

            // Generate certificate code from verifyBaseKey (+ sequenceNo if available)
            if (student?.verifyBaseKey) {
              certificateCode = student.sequenceNo
                ? `${student.verifyBaseKey}${student.sequenceNo}`
                : student.verifyBaseKey;

              // Generate verification URL
              const baseUrl = window.location.origin;
              verificationUrl = `${baseUrl}/verify/result/${certificateCode}`;
            }
          }
        } catch { }

        // 5) Build CertificateData using real data
        const data: CertificateData = {
          certificateNumber: cert.publicId,
          certificateCode: certificateCode,
          verificationUrl: verificationUrl,
          publicId: cert.publicId,
          dateIssued: cert.dateIssued,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Öğrenci',
          studentTc: student?.nationalId || '',
          trainingName: cert.trainingName,
          trainingDescription: training?.description || undefined,
          trainingHours: training?.totalHours || undefined,
          trainingLevel: training?.level || undefined,
          trainingLanguage: training?.language || undefined,
          institutionName,
          institutionLogo,
          partners: certificateWithPartners.partners || [],
          siteLogo: undefined,
          siteName: 'Mert CIN Certificates',
          primaryColor: cert.colorPrimary || '#1e40af',
          secondaryColor: cert.colorSecondary || '#7c3aed',
          templateKey: cert.templateKey || 'classic',
        };

        setCertificateData(data);
      } catch (err) {
        setError(t('certificate.loadError'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [params.id, studentId]);

  if (loading) {
    return (
      <Loader />
    );
  }

  if (error || !certificateData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('common.error')}</h2>
          <p className="text-gray-600 mb-6">{error || t('certificate.notFound')}</p>
          <button
            onClick={() => router.push('/institution/certificates')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {t('institution.certificates.backToCertificates')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/institution/certificates')}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M15 19l-7-7 7-7" />
            </svg>
            Sertifikalara Dön
          </button>

          <a
            href={`/api/certificates/${params.id}/download${studentId ? `?studentId=${studentId}` : ''}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('verify.downloadPdf')}
          </a>
        </div>

        {/* Certificate Viewer */}
        <div className="rounded-xl border bg-white shadow-sm p-3 md:p-4 overflow-x-hidden">
          <CertificateViewer data={certificateData} scale={0.9} showControls={true} />
        </div>
      </div>
    </div>
  );
}
