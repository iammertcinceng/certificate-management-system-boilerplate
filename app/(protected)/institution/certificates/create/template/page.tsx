"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useDraft } from '../state';
import { CERTIFICATE_TEMPLATES } from '@/types/certificate';
import { CertificateRenderer } from '@/components/certificates/CertificateRenderer';
import { CertificateData, CertificateTemplateType } from '@/types/certificate';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useInstitutionColors } from '@/hooks/useInstitutionColors';

// Sample preview data with real institution info
// Note: certificateCode is NOT included as it doesn't exist in preview (only after actual certificate creation)
const getSamplePreviewData = (
  templateKey: CertificateTemplateType,
  primaryColor: string,
  secondaryColor: string,
  institutionName: string,
  institutionLogo?: string,
  institutionSignature?: string,
  institutionSignatureName?: string,
  institutionSignatureTitle?: string
): CertificateData => ({
  certificateNumber: '', // Empty - only filled when certificate is created
  // certificateCode intentionally omitted - templates should handle undefined gracefully
  publicId: 'PREVIEW',
  dateIssued: new Date().toISOString(),
  studentName: 'Örnek Öğrenci',
  studentTc: '12345678910',
  trainingName: 'Örnek Eğitim Programı',
  trainingDescription: `${institutionName} tarafından düzenlenen bu eğitim programı, uluslararası standartlara uygun olarak hazırlanmıştır.`,
  trainingHours: 40,
  institutionName: institutionName || 'Kurumunuz',
  institutionLogo,
  institutionSignature,
  institutionSignatureName,
  institutionSignatureTitle,
  partners: [
    { name: 'Partner Kuruluş', logo: undefined, signature: undefined },
  ],
  siteName: 'Mert CIN Certificates',
  primaryColor,
  secondaryColor,
  templateKey,
});

export default function TemplateStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { draft, setDraft, reset } = useDraft();
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<CertificateTemplateType>('classic');
  const [scale, setScale] = useState(0.3);
  const { primaryColor, secondaryColor, loading: colorsLoading } = useInstitutionColors();
  const { t } = useLanguage();

  // Institution data for preview
  const [institutionName, setInstitutionName] = useState<string>('Kurumunuz');
  const [institutionLogo, setInstitutionLogo] = useState<string | undefined>();
  const [institutionSignature, setInstitutionSignature] = useState<string | undefined>();
  const [institutionSignatureName, setInstitutionSignatureName] = useState<string | undefined>();
  const [institutionSignatureTitle, setInstitutionSignatureTitle] = useState<string | undefined>();

  // Clear edit mode if not coming from edit flow
  // This prevents stale editingCertificateId from affecting new certificate creation
  useEffect(() => {
    const isEditMode = searchParams.get('mode') === 'edit';
    if (!isEditMode && draft.editingCertificateId) {
      // Coming to template page without edit mode but draft has editing ID - reset it
      setDraft(d => ({ ...d, editingCertificateId: null }));
    }
  }, [searchParams, draft.editingCertificateId, setDraft]);

  // Get institution data from API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/organization');
        if (res.ok) {
          const data = await res.json();
          const org = data.organization || {};

          // Set institution info for preview
          if (org.name) setInstitutionName(org.name);
          if (org.logo) setInstitutionLogo(org.logo);
          if (org.signature) setInstitutionSignature(org.signature);
          if (org.signatureName) setInstitutionSignatureName(org.signatureName);
          if (org.signatureTitle) setInstitutionSignatureTitle(org.signatureTitle);

          // Set default template if not already set
          if (org.defaultTemplate && !draft.template) {
            setDraft(d => ({ ...d, template: org.defaultTemplate as CertificateTemplateType }));
          }
        }
      } catch { }
    })();
  }, [draft.template, setDraft]);

  useEffect(() => {
    const calculateScale = () => {
      const containerWidth = window.innerWidth * 0.75;
      const certificateWidth = 1122;
      const calculatedScale = Math.min(containerWidth / certificateWidth, 0.6);
      setScale(calculatedScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  const handlePreview = (templateKey: CertificateTemplateType) => {
    setPreviewTemplate(templateKey);
    setShowPreview(true);
  };

  // Edit mode detection
  const isEditMode = !!draft.editingCertificateId;

  return (
    <div>
      {/* Edit Mode Banner */}
      {isEditMode && (
        <div className="mb-4 p-3 rounded-lg bg-orange-50 border border-orange-200 flex items-center gap-2">
          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-sm text-orange-700 font-medium">{t('institution.certificates.create.reviseModeBanner')}</span>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('institution.certificates.create.template.title')}</h2>
      <p className="text-gray-600 mt-1">{t('institution.certificates.create.template.subtitle')}</p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {CERTIFICATE_TEMPLATES.map(template => (
          <div key={template.key} className="space-y-2">
            <button
              onClick={() => setDraft(d => ({ ...d, template: template.key }))}
              className={`w-full p-4 rounded-lg border text-left transition-all ${draft.template === template.key
                ? 'bg-blue-50 border-blue-500 shadow-md'
                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="font-semibold text-gray-800 text-lg">{t(template.nameKey)}</div>
                {draft.template === template.key && (
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 mb-3">{t(template.descriptionKey)}</div>

              {/* Mini preview
              <div className="w-full h-20 rounded bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs text-gray-500">
                {t('institution.certificates.create.template.miniPreview')}
              </div> */}
            </button>

            <button
              onClick={() => handlePreview(template.key)}
              className="w-full px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-medium"
            >
              {t('institution.certificates.create.template.fullPreview')}
            </button>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-h-[95vh] max-w-[95vw] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-xl flex-shrink-0">
              <h3 className="text-xl font-semibold text-gray-900">
                {CERTIFICATE_TEMPLATES.find(tmpl => tmpl.key === previewTemplate)?.nameKey ? t(CERTIFICATE_TEMPLATES.find(tmpl => tmpl.key === previewTemplate)!.nameKey) : ''} {t('institution.certificates.create.template.modal.titleSuffix')}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={t('common.close')}
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Certificate Preview - Centered */}
            <div className="flex-1 overflow-auto bg-gradient-to-br from-gray-50 to-gray-100">
              <div className="p-6 flex items-center justify-center min-h-full">
                {!colorsLoading && (
                  <CertificateRenderer
                    data={getSamplePreviewData(
                      previewTemplate,
                      primaryColor,
                      secondaryColor,
                      institutionName,
                      institutionLogo,
                      institutionSignature,
                      institutionSignatureName,
                      institutionSignatureTitle
                    )}
                    scale={scale}
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t text-center rounded-b-xl flex-shrink-0">
              <p className="text-sm text-gray-600">
                {t('institution.certificates.create.template.modal.footerNote')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 flex justify-end items-center">
        <button
          onClick={() => router.push('/institution/certificates/create/training')}
          className="btn-primary"
          disabled={!draft.template}
        >
          {t('common.next')}
        </button>
      </div>
    </div>
  );
}
