'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CertificateRenderer } from '@/components/certificates/CertificateRenderer';
import { CertificateData } from '@/types/certificate';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/ui/Loader';

// This page has NO header/footer - clean certificate view
export default function PublicCertificatePage() {
  const { t } = useLanguage();
  const params = useParams();
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/certificates/public/${params.publicId}`);

        if (!response.ok) {
          throw new Error('Certificate not found');
        }

        const data = await response.json();
        const cert = data.certificate;

        // Transform API data to CertificateData format
        const certificateData: CertificateData = {
          certificateNumber: cert.certificateNumber || cert.publicId,
          publicId: cert.publicId,
          dateIssued: cert.dateIssued,
          studentName: cert.students?.[0]?.name || 'Ad Soyad',
          trainingName: cert.trainingName,
          trainingDescription: cert.trainingDescription,
          trainingHours: cert.trainingHours,
          institutionName: cert.institutionName,
          institutionLogo: cert.institutionLogo,
          partners: cert.partners || [],
          siteName: cert.siteName || 'Mert CIN',
          siteLogo: cert.siteLogo || '/mertcin-anonym-logo-org.jpg',
          primaryColor: cert.colorPrimary || '#1e40af',
          secondaryColor: cert.colorSecondary || '#7c3aed',
          templateKey: cert.templateKey || 'classic',
        };

        setCertificateData(certificateData);
      } catch (err) {
        setError(t('certificate.notFound'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (params.publicId) {
      fetchCertificate();
    }
  }, [params.publicId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error || !certificateData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('certificate.notFoundTitle')}</h2>
          <p className="text-gray-600">{error || t('certificate.invalidNumber')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8">
        <CertificateRenderer data={certificateData} scale={0.7} />
      </div>
    </div>
  );
}
