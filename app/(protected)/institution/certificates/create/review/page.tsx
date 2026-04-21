"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useDraft } from '../state';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { CertificateRenderer } from '@/components/certificates/CertificateRenderer';
import { CertificateData, CERTIFICATE_TEMPLATES } from '@/types/certificate';
import { useInstitutionColors } from '@/hooks/useInstitutionColors';

type PartnerData = {
  id: string;
  name: string;
  logo?: string | null | undefined;
  publicId: string;
};

export default function ReviewStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { draft, setDraft } = useDraft();
  const { primaryColor, secondaryColor, loading: colorsLoading } = useInstitutionColors();
  const [institutionName, setInstitutionName] = useState('Kurumunuz');
  const [institutionLogo, setInstitutionLogo] = useState<string | null>(null);
  const [partnersData, setPartnersData] = useState<PartnerData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [scale, setScale] = useState(0.4);
  const [creditPerStudent, setCreditPerStudent] = useState(1); // Credit per student from system config
  const { t } = useLanguage();

  // Edit mode detection
  const isEditMode = searchParams.get('mode') === 'edit' || !!draft.editingCertificateId;

  // Date mode: 'today' for just today's date, 'range' for start-end dates
  const [dateMode, setDateMode] = useState<'today' | 'range'>('today');
  const [startDate, setStartDate] = useState<string>(draft.certificateStartDate || '');
  const [endDate, setEndDate] = useState<string>(draft.certificateEndDate || new Date().toISOString().split('T')[0]);

  // Sync dates to draft when changed
  useEffect(() => {
    if (dateMode === 'today') {
      const today = new Date().toISOString().split('T')[0];
      setDraft(prev => ({ ...prev, certificateStartDate: null, certificateEndDate: today }));
    } else {
      setDraft(prev => ({ ...prev, certificateStartDate: startDate || null, certificateEndDate: endDate }));
    }
  }, [dateMode, startDate, endDate, setDraft]);

  const studentCount = useMemo(() => (
    draft.studentMethod === 'single' ? draft.selectedStudentIds.length : (draft.csvPreview.length || 0)
  ), [draft]);

  // Calculate effective end date for display
  const effectiveEndDate = useMemo(() => {
    if (dateMode === 'today') {
      return new Date().toISOString().split('T')[0];
    }
    return endDate || new Date().toISOString().split('T')[0];
  }, [dateMode, endDate]);

  // Calculate total credits required
  const totalCreditsRequired = useMemo(() => {
    return studentCount * creditPerStudent;
  }, [studentCount, creditPerStudent]);

  const handleSubmit = async () => {
    if (submitting) return;

    // Validate training is selected
    if (!draft.trainingId) {
      alert('Lütfen bir eğitim seçin. Eğitim seçimi yapılmadan sertifika oluşturamazsınız.');
      return;
    }

    // Validate end date is set
    if (!effectiveEndDate) {
      alert('Lütfen sertifika bitiş tarihini seçin.');
      return;
    }

    // Validate students are selected
    const studentCount = draft.studentMethod === 'single'
      ? draft.selectedStudentIds.length
      : (draft.csvPreview?.length || 0);
    if (studentCount === 0) {
      alert('Lütfen en az bir öğrenci seçin.');
      return;
    }

    setSubmitting(true);
    try {
      console.group('Certificate Review Submit');
      console.log('Draft state before submit:', JSON.parse(JSON.stringify(draft)));
      console.log('Resolved colors:', { primaryColor, secondaryColor });
      console.log('Institution info:', { name: institutionName, logo: institutionLogo });
      console.log('Partners data:', partnersData);
      // Prepare student IDs
      console.log('Student selection method:', draft.studentMethod);
      console.log('Selected student IDs (single mode):', draft.selectedStudentIds);
      console.log('CSV preview length (bulk mode):', draft.csvPreview?.length);
      const studentIds = draft.studentMethod === 'single'
        ? draft.selectedStudentIds
        : draft.csvPreview.map(s => s.id);

      // Prepare request body with new date fields
      const body = {
        trainingId: draft.trainingId,
        dateIssued: effectiveEndDate, // Use end date as dateIssued for compatibility
        startDate: dateMode === 'range' && startDate ? startDate : null,
        endDate: effectiveEndDate,
        studentIds,
        partnerUserIds: draft.partners,
        referencePartnerPublicIds: draft.referencePartnerPublicIds,
        templateKey: draft.template || 'classic',
        colorPrimary: primaryColor,
        colorSecondary: secondaryColor,
        upperInstitutionRequired: draft.upperInstitutionRequired,
        upperInstitutionPartnerUserId: draft.upperInstitutionPartnerId || null,
      };
      console.log(`${isEditMode ? 'PUT' : 'POST'} /api/certificates body:`, body);

      // Edit modunda PUT, aksi halde POST kullan
      const url = isEditMode && draft.editingCertificateId
        ? `/api/certificates/${draft.editingCertificateId}`
        : '/api/certificates';
      const method = isEditMode && draft.editingCertificateId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`${method} /api/certificates response:`, data);

        const successMessage = isEditMode
          ? (t('institution.certificates.create.review.actions.revisedSuccess') || 'Sertifika başarıyla revize edildi ve onaya gönderildi!')
          : t('institution.certificates.create.review.actions.createdSuccess');
        alert(successMessage);

        // Clear draft and redirect
        localStorage.removeItem('cert_create_draft_v2');
        router.push('/institution/certificates/approvals');
      } else {
        const error = await res.json().catch(() => ({}));
        console.error(`${method} /api/certificates failed:`, res.status, error);
        alert(`${t('institution.certificates.create.review.actions.errorPrefix')} ${error.error || t('institution.certificates.create.review.actions.createFailed')}`);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert(t('institution.certificates.create.review.actions.unexpectedError'));
    } finally {
      console.groupEnd();
      setSubmitting(false);
    }
  };

  // Load institution data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/organization');
        if (res.ok && mounted) {
          const data = await res.json();
          console.log('Organization API Response:', data);
          setInstitutionName(data.organization?.name || 'Kurumunuz');
          setInstitutionLogo(data.organization?.logo);
        } else if (mounted) {
          // Handle 401/404 gracefully with defaults
          if (res.status === 401 || res.status === 404) {
            setInstitutionName('Kurumunuz');
            setInstitutionLogo(undefined as unknown as null);
          } else {
            console.error('Organization API failed:', res.status);
          }
        }
      } catch (err) {
        console.error('Organization API error:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load credit per student config
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/system-config');
        if (res.ok && mounted) {
          const data = await res.json();
          setCreditPerStudent(Number(data.creditPerStudent) || 1);
        }
      } catch (err) {
        console.error('System config API error:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Load partner data
  useEffect(() => {
    console.log('Draft partners:', draft.partners);
    if (!draft.partners.length) {
      console.log('No partners to load');
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const partners = await Promise.all(
          draft.partners.map(async (partnerId) => {
            console.log('Fetching partner:', partnerId);
            const res = await fetch(`/api/partners/${partnerId}`);
            if (res.ok) {
              const data = await res.json();
              console.log('Partner data:', data);
              return {
                id: partnerId,
                name: data.name || 'Partner',
                logo: data.logo,
                publicId: data.publicId || partnerId,
              };
            }
            console.error('Partner API failed for:', partnerId, res.status);
            return { id: partnerId, name: 'Bilinmeyen Partner', publicId: partnerId };
          })
        );
        if (mounted) {
          console.log('Loaded partners:', partners);
          setPartnersData(partners);
        }
      } catch (err) {
        console.error('Partner loading error:', err);
      }
    })();
    return () => { mounted = false; };
  }, [draft.partners]);

  // Calculate responsive scale for certificate preview
  useEffect(() => {
    const calculateScale = () => {
      const containerWidth = window.innerWidth > 1024 ? 900 : window.innerWidth * 0.85;
      const certificateWidth = 1122;
      const calculatedScale = Math.min(containerWidth / certificateWidth, 0.6);
      setScale(calculatedScale);
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

  // Generate preview certificate data
  const previewData: CertificateData = {
    certificateNumber: 'CRT-XXXX-XXX',
    publicId: 'PREVIEW-001',
    dateIssued: effectiveEndDate,
    trainingStartDate: dateMode === 'range' && startDate ? startDate : undefined,
    trainingEndDate: effectiveEndDate,
    studentName: 'Örnek Öğrenci',
    studentTc: '12345678901',
    trainingName: draft.trainingName || 'Eğitim Programı',
    trainingDescription: 'Bu bir önizleme sertifikasıdır',
    trainingHours: draft.trainingHours || 40,
    trainingLevel: draft.trainingLevel || undefined,
    trainingLanguage: draft.trainingLanguage || undefined,
    institutionName,
    institutionLogo: institutionLogo || undefined,
    partners: partnersData.map(p => ({ name: p.name, logo: p.logo || undefined })),
    siteName: 'Mert CIN Certificates',
    primaryColor,
    secondaryColor,
    templateKey: draft.template,
  };

  const selectedTemplate = CERTIFICATE_TEMPLATES.find(t => t.key === draft.template);
  const templateName = selectedTemplate ? t(selectedTemplate.nameKey) : draft.template;

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {isEditMode
            ? (t('institution.certificates.create.review.reviseTitle') || '📝 Sertifika Revizyonu')
            : t('institution.certificates.create.review.title')
          }
        </h2>
        <p className="text-gray-600 mt-1">
          {isEditMode
            ? (t('institution.certificates.create.review.reviseSubtitle') || 'Reddedilen sertifikayı düzenleyip tekrar onaya gönderebilirsiniz.')
            : t('institution.certificates.create.review.subtitle')
          }
        </p>
      </div>

      {/* Certificate Date Selection - NEW */}
      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Sertifika Tarihi
        </h3>

        <div className="flex flex-col gap-4">
          {/* Date Mode Selection */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setDateMode('today')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${dateMode === 'today'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('institution.certificates.create.review.dateSelection.today')}
              </div>
              <div className={`text-xs mt-1 ${dateMode === 'today' ? 'text-blue-100' : 'text-gray-500'}`}>
                {formatDate(new Date().toISOString().split('T')[0])}
              </div>
            </button>
            <button
              type="button"
              onClick={() => setDateMode('range')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${dateMode === 'range'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {t('institution.certificates.create.review.dateSelection.range')}
              </div>
              <div className={`text-xs mt-1 ${dateMode === 'range' ? 'text-blue-100' : 'text-gray-500'}`}>
                {t('institution.certificates.create.review.dateSelection.rangeLabel')}
              </div>
            </button>
          </div>

          {/* Date Range Inputs - Only shown when range mode is selected */}
          {dateMode === 'range' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg border border-gray-200">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('institution.certificates.create.review.dateSelection.startDate')}</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input w-full"
                />
                <p className="text-xs text-gray-500 mt-1">{t('institution.certificates.create.review.dateSelection.optional')}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('institution.certificates.create.review.dateSelection.endDate')} *</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input w-full"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{t('institution.certificates.create.review.dateSelection.displayNote')}</p>
              </div>
            </div>
          )}

          {/* Display Selected Date(s) */}
          <div className="flex items-center gap-2 text-sm text-gray-700 bg-white rounded-lg px-4 py-3 border border-gray-200">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>
              <strong>{t('institution.certificates.create.review.dateSelection.displayDate')}</strong>{' '}
              {dateMode === 'today' ? (
                formatDate(new Date().toISOString().split('T')[0])
              ) : startDate && endDate ? (
                `${formatDate(startDate)} - ${formatDate(endDate)}`
              ) : endDate ? (
                formatDate(endDate)
              ) : (
                <span className="text-red-500">Bitiş tarihi seçin</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Certificate Preview */}
      <div className="rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t('institution.certificates.create.review.certificatePreview')}
        </h3>
        <div className="flex justify-center items-center bg-white rounded-lg p-4 shadow-inner">
          {!colorsLoading && (
            <CertificateRenderer data={previewData} scale={scale} />
          )}
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column - Certificate Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {t('institution.certificates.create.review.details')}
          </h3>
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">{t('institution.certificates.create.review.template')}</span>
              <strong className="text-sm capitalize">{templateName}</strong>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">{t('institution.certificates.create.review.training')}</span>
              <strong className="text-sm text-right max-w-[200px]">{draft.trainingName || '-'}</strong>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">{t('institution.certificates.create.review.accreditorCount')}</span>
              <strong className="text-sm">{draft.partners.length || '0'}</strong>
            </div>
            {draft.trainingHours && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-600">{t('institution.certificates.create.review.trainingHours')}</span>
                <strong className="text-sm">{draft.trainingHours} {t('institution.certificates.create.review.hours')}</strong>
              </div>
            )}
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">{t('institution.certificates.create.review.uia')}</span>
              <strong className="text-sm">{draft.upperInstitutionRequired ? t('common.yes') : t('common.no')}</strong>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">{t('institution.certificates.create.review.studentCount')}</span>
              <strong className="text-sm text-blue-600">{studentCount}</strong>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">{t('institution.certificates.create.review.dateSelection.title')}</span>
              <strong className="text-sm">
                {dateMode === 'today' ? (
                  formatDate(new Date().toISOString().split('T')[0])
                ) : startDate && endDate ? (
                  `${formatDate(startDate)} - ${formatDate(endDate)}`
                ) : endDate ? (
                  formatDate(endDate)
                ) : '-'}
              </strong>
            </div>
            {/* Kredi gösterimi - öğrenci başına hesaplanıyor */}
            <div className="flex justify-between items-start pt-3 mt-3 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-600">{t('institution.certificates.create.review.creditInfo.title')}</span>
              <div className="text-right">
                <strong className="text-sm text-emerald-600">{totalCreditsRequired} {t('institution.certificates.create.review.creditInfo.unit')}</strong>
                <div className="text-xs text-gray-400">
                  {t('institution.certificates.create.review.creditInfo.calc')
                    .replace('{count}', studentCount.toString())
                    .replace('{credit}', creditPerStudent.toString())}
                </div>
              </div>
            </div>
          </div>

          {/* Partners List */}
          {draft.partners.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('institution.certificates.create.review.accreditors')}</h4>
              <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                {partnersData.map((partner) => (
                  <div key={partner.id} className="p-3 flex items-center gap-3">
                    {partner.logo ? (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 text-xs font-semibold flex-shrink-0">
                        {partner.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800">{partner.name}</div>
                      <div className="text-xs text-gray-500">{partner.publicId}</div>
                    </div>
                    {draft.upperInstitutionRequired && draft.upperInstitutionPartnerId === partner.id && (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full border border-emerald-200 font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {t('institution.certificates.create.review.uiaResponsible')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Edit Mode Navigation */}
        <div className="h-full">
          {isEditMode && (
            <div className="card p-4 border-2 border-orange-200 bg-orange-50 h-full flex flex-col rounded-lg">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-orange-800 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('institution.certificates.create.review.reviseBoxTitle') || 'Sertifika Revizyonu'}
              </h3>
              <p className="text-sm text-orange-700 mb-4">
                {t('institution.certificates.create.review.reviseBoxDescription') || 'Reddedilen sertifikayı düzenliyorsunuz.'}
              </p>
              <div className="flex-1 flex flex-col justify-center gap-4 py-2">
                <button
                  onClick={() => router.push('/institution/certificates/create/template?mode=edit')}
                  className="w-full text-left px-3 py-3 rounded-lg bg-white hover:bg-orange-100 transition-colors flex items-center gap-3 text-sm text-gray-700 shadow-sm border border-orange-100"
                >
                  <span className="w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-xs font-medium shrink-0">1</span>
                  {t('institution.certificates.create.review.actions.editTemplate')}
                </button>
                <button
                  onClick={() => router.push('/institution/certificates/create/training?mode=edit')}
                  className="w-full text-left px-3 py-3 rounded-lg bg-white hover:bg-orange-100 transition-colors flex items-center gap-3 text-sm text-gray-700 shadow-sm border border-orange-100"
                >
                  <span className="w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-xs font-medium shrink-0">2</span>
                  {t('institution.certificates.create.review.actions.editTraining')}
                </button>
                <button
                  onClick={() => router.push('/institution/certificates/create/students?mode=edit')}
                  className="w-full text-left px-3 py-3 rounded-lg bg-white hover:bg-orange-100 transition-colors flex items-center gap-3 text-sm text-gray-700 shadow-sm border border-orange-100"
                >
                  <span className="w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-xs font-medium shrink-0">3</span>
                  {t('institution.certificates.create.review.actions.editStudents')}
                </button>
                <button
                  onClick={() => router.push('/institution/certificates/create/partners?mode=edit')}
                  className="w-full text-left px-3 py-3 rounded-lg bg-white hover:bg-orange-100 transition-colors flex items-center gap-3 text-sm text-gray-700 shadow-sm border border-orange-100"
                >
                  <span className="w-6 h-6 rounded-full bg-orange-200 text-orange-700 flex items-center justify-center text-xs font-medium shrink-0">4</span>
                  {t('institution.certificates.create.review.actions.editPartners')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <button
          onClick={() => router.push('/institution/certificates/create/students')}
          className="btn-secondary flex items-center gap-2"
          disabled={submitting}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common.back')}
        </button>
        <button
          disabled={submitting || (dateMode === 'range' && !endDate)}
          onClick={handleSubmit}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('institution.certificates.create.review.actions.submitting')}
            </>
          ) : (
            <>
              {isEditMode
                ? (t('institution.certificates.create.review.actions.reviseAndApprove'))
                : t('institution.certificates.create.review.actions.submit')
              }
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
