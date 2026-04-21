'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CertificateRenderer } from '@/components/certificates/CertificateRenderer';
import { AchievementBadge } from '@/components/certificates/AchievementBadge';
import { CertificateData } from '@/types/certificate';
import Link from 'next/link';
import Loading from '@/components/Loading';
import { useLanguage } from '@/contexts/LanguageContext';
import Loader from '@/components/ui/Loader';

export default function VerifyResultPage() {
  const { t } = useLanguage();
  const params = useParams();
  const id = params?.id as string;

  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCode, setDisplayCode] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Get studentId from URL query params (for multi-student certificates)
    const urlParams = new URLSearchParams(window.location.search);
    const studentIdParam = urlParams.get('studentId');

    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
        if (uuidRegex.test(id)) {
          // Build API URL with studentId if available
          const apiUrl = studentIdParam
            ? `/api/certificates/${id}?studentId=${encodeURIComponent(studentIdParam)}`
            : `/api/certificates/${id}`;
          const response = await fetch(apiUrl);
          if (!response.ok) {
            const payload = await response.json().catch(() => ({} as any));
            throw new Error(payload?.error || 'Sertifika bulunamadı');
          }
          const data = await response.json();
          setCertificate(data);
          // Try to restore display code from previous key redirect
          try {
            const saved = sessionStorage.getItem(`verifyDisplayCode:${id}`);
            if (saved) setDisplayCode(saved);
          } catch { }
        } else {
          // Treat id as verify key (+ optional index): resolve and redirect to UUID
          const q = id.toUpperCase();
          const res = await fetch(`/api/verify?q=${encodeURIComponent(q)}`);
          if (!res.ok) {
            const payload = await res.json().catch(() => ({} as any));
            throw new Error(payload?.error || 'Sertifika bulunamadı');
          }
          const data = await res.json();
          if (data.status !== 'detail') {
            throw new Error('Sertifika seçilemedi');
          }
          const certId = data.certificate.id as string;
          const studentId = data.student?.id as string;
          // Persist display code for the redirect target and navigate
          try {
            sessionStorage.setItem(`verifyDisplayCode:${certId}`, q);
          } catch { }
          // Include studentId in redirect URL for multi-student certificates
          const redirectUrl = studentId
            ? `/verify/result/${certId}?studentId=${encodeURIComponent(studentId)}`
            : `/verify/result/${certId}`;
          window.location.replace(redirectUrl);
          return; // stop further execution; page will reload
        }
      } catch (err: any) {
        setError(err.message || 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [id]);

  const handleDownload = async () => {
    if (!certificate) return;

    try {
      setIsDownloading(true);
      // Get studentId from URL for correct student in multi-student certificates
      const urlParams = new URLSearchParams(window.location.search);
      const studentIdParam = urlParams.get('studentId');
      const downloadUrl = studentIdParam
        ? `/api/certificates/${certificate.id}/download?studentId=${encodeURIComponent(studentIdParam)}`
        : `/api/certificates/${certificate.id}/download`;
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const code = certificate.certificateNumber || displayCode || certificate.id?.slice(0, 10) || 'certificate';
      a.download = `certificate-${code}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Silent fail for download
    }
    finally {
      setIsDownloading(false);
    }
  };


  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = certificate
    ? `${certificate.studentName} - ${certificate.trainingName} sertifikasını başarıyla tamamladı!`
    : '';


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Loader />
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-red-50 p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-900 mb-2">{t('verifyResult.detail.notFound')}</h1>
            <p className="text-red-700 mb-6">{error || t('verifyResult.detail.notFoundDesc')}</p>
            <Link href="/verify" className="btn-primary">
              {t('verifyResult.detail.newVerification')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-text pb-1">{t('verifyResult.detail.verified')}</h1>
                  {(certificate?.certificateNumber || displayCode) && (
                    <p className="text-sm text-gray-600 mt-1">
                      {t('verifyResult.detail.certificateNo')} <span className="font-mono font-semibold text-gray-900">{certificate?.certificateNumber || displayCode}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <Link href="/verify" className="btn-secondary">
              {t('verifyResult.detail.newVerificationShort')}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Certificate Display - Left Side (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Certificate Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm overflow-auto">
              <div className="flex justify-center">
                <CertificateRenderer data={certificate} scale={0.7} />
              </div>
            </div>

            {/* Social Share Card */}
            {/* TODO: İNSTAGRAM EKLENMESİ + DİREKT ROZET PAYLŞIMI OLABİLMESİ */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('verifyResult.share.title')}</h3>
              <div className="flex flex-wrap items-center gap-3">
                {/* <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-[#25D366] hover:opacity-90"
                  aria-label="WhatsApp'ta paylaş"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.52 3.48A11.86 11.86 0 0012.06 0C5.5 0 .18 5.32.18 11.88c0 2.09.55 4.11 1.6 5.9L0 24l6.4-1.66a11.84 11.84 0 005.7 1.47h.01c6.55 0 11.88-5.32 11.88-11.88a11.86 11.86 0 00-3.45-8.45zM12.1 21.4h-.01a9.5 9.5 0 01-4.84-1.33l-.35-.2-3.8 1 1.02-3.7-.23-.38a9.5 9.5 0 1118.12-4.17 9.49 9.49 0 01-9.91 9.78z"/><path d="M17.34 14.2c-.3-.15-1.77-.87-2.04-.96-.27-.1-.47-.15-.67.15-.2.3-.77.95-.95 1.15-.18.2-.35.22-.65.08-.3-.15-1.25-.46-2.38-1.47-.88-.77-1.47-1.7-1.65-1.98-.18-.3 0-.45.14-.6.14-.14.3-.35.46-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.38-.27.3-1.05 1.03-1.05 2.5 0 1.46 1.08 2.88 1.23 3.08.15.2 2.13 3.25 5.15 4.56.72.31 1.28.5 1.72.64.72.23 1.37.2 1.88.12.58-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.08-.12-.3-.2-.6-.35z"/></svg>
                  WhatsApp
                </a> */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white bg-[#24A1DE] hover:bg-[#1d8bc4] transition-colors shadow-sm"
                  aria-label={t('verifyResult.share.telegramAria')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.036 15.803l-.398 5.607c.57 0 .816-.245 1.11-.539l2.665-2.56 5.52 4.04c1.012.558 1.73.264 2.005-.936l3.631-16.983h.001c.323-1.515-.547-2.105-1.533-1.74L1.39 9.38c-1.477.575-1.456 1.404-.252 1.78l5.563 1.736L19.4 6.154c.644-.42 1.23-.187.747.234L9.036 15.803z" /></svg>
                  Telegram
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white bg-black hover:bg-gray-800 transition-colors shadow-sm"
                  aria-label={t('verifyResult.share.xAria')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2H21.5l-7.5 8.568L22.5 22h-6.344l-4.957-6.063L5.5 22H2.244l8.063-9.2L2.5 2h6.344l4.53 5.72L18.244 2zm-1.113 18h1.845L8.99 4h-1.9l10.04 16z" /></svg>
                  X
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white bg-[#0A66C2] hover:bg-[#084d8f] transition-colors shadow-sm"
                  aria-label={t('verifyResult.share.linkedinAria')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.5 8h4V23h-4V8zm7.5 0h3.8v2.1h.1c.5-1 1.8-2.1 3.7-2.1 4 0 4.8 2.6 4.8 6v9h-4v-8c0-1.9 0-4.4-2.7-4.4s-3.1 2.1-3.1 4.2V23h-4V8z" /></svg>
                  LinkedIn
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white bg-[#1877F2] hover:bg-[#1564d6] transition-colors shadow-sm"
                  aria-label={t('verifyResult.share.facebookAria')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.07C22 6.48 17.52 2 11.93 2S2 6.48 2 12.07c0 4.99 3.66 9.13 8.44 9.93v-7.02H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.8 8.44-4.94 8.44-9.93Z" /></svg>
                  Facebook
                </a>
                <button
                  onClick={() => {
                    try { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 cursor-pointer transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? t('verifyResult.share.copied') : t('verifyResult.share.copy')}
                </button>
                <a
                  href={`mailto:?subject=${encodeURIComponent(t('verifyResult.share.emailSubject'))}&body=${encodeURIComponent(shareText + '\n' + shareUrl)}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t('verifyResult.share.email')}
                </a>
              </div>
            </div>
          </div>

          {/* Actions Sidebar - Right Side (1/3) */}
          <div className="space-y-6 flex flex-col">
            {/* Verification Badge */}
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-emerald-900">{t('verifyResult.certificates.verified')}</h4>
                  <p className="text-sm text-emerald-700">{t('verifyResult.detail.validCertificate')}</p>
                </div>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {t('verifyResult.certificates.verifiedInfo')}
              </p>
            </div>

            {/* Quick Info Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('verifyResult.sidebar.quickInfo')}
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-gray-500 text-xs">{t('verifyResult.sidebar.student')}</span>
                    <p className="font-semibold text-gray-900">{certificate.studentName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-gray-500 text-xs">{t('verifyResult.sidebar.training')}</span>
                    <p className="font-semibold text-gray-900">{certificate.trainingName}</p>
                  </div>
                </div>
                {certificate.trainingHours && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <span className="text-gray-500 text-xs">{t('verifyResult.sidebar.duration')}</span>
                      <p className="font-semibold text-gray-900">{certificate.trainingHours} {t('verifyResult.sidebar.hours')}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-gray-500 text-xs">{t('verifyResult.sidebar.date')}</span>
                    <p className="font-semibold text-gray-900">
                      {new Date(certificate.dateIssued).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="flex-1">
                    <span className="text-gray-500 text-xs">{t('verifyResult.sidebar.institution')}</span>
                    <p className="font-semibold text-gray-900">{certificate.institutionName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download buttons */}
            <div className="grid grid-cols-1 gap-3 flex-shrink-0">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {isDownloading ? t('verifyResult.sidebar.download.downloading') : t('verifyResult.sidebar.download.button')}
              </button>
              <button
                onClick={() => setShowBadgeModal(true)}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                {t('verifyResult.sidebar.badge.show')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Badge Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">{t('verifyResult.sidebar.badge.title')}</h3>
              <button
                onClick={() => setShowBadgeModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-6 text-center">
                {t('verifyResult.sidebar.badge.desc')}
              </p>

              <AchievementBadge
                studentName={certificate.studentName}
                trainingName={certificate.trainingName}
                dateIssued={certificate.dateIssued}
                onDownload={() => {
                  setTimeout(() => setShowBadgeModal(false), 1000);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
