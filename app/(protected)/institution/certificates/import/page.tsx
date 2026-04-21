'use client';

import { useState, useMemo, useEffect } from 'react';
import ExcelTemplateDownloader from '@/components/excel/ExcelTemplateDownloader';
import ExcelUploader from '@/components/excel/ExcelUploader';
import ExcelImportGuide, { ExcelFieldGuide } from '@/components/excel/ExcelImportGuide';
import { useLanguage } from '@/contexts/LanguageContext';
import { executeRecaptcha, isRecaptchaEnabled, loadRecaptchaScript } from '@/lib/recaptcha';

// Type definitions for clarity
// This component is designed exclusively for Excel (.xlsx, .xls) file imports.
// All logic is based on the specific column headers defined in `handleDownloadTemplate`.
type ValidationStatus = 'pending' | 'valid' | 'invalid';

interface StudentInGroup {
  id: string;
  _status: ValidationStatus;
  _errors: string[];
  _excelRow?: number; // Excel satır numarası
}

interface CertificateGroup {
  trainingId: string;
  templateKey: string;
  startDate: string | null; // Optional start date
  endDate: string | null; // Required end date (certificate issue date)
  partnerIds: string | null;
  uiaRequired: 0 | 1 | null; // UIA (Upper Institution Approval) gerekli mi?
  uiaResponsibleId: string | null; // UIA sorumlusu ID
  approvalCode: string | null; // UIA kodu (Excel'de boş olmalı, partner tarafından girilir)
  students: StudentInGroup[];
  _status: ValidationStatus;
  _errors: string[];
}


export default function BulkImportPage() {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<CertificateGroup[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // reCAPTCHA badge'i göster (minimal)
  useEffect(() => {
    if (isRecaptchaEnabled()) {
      document.body.classList.add('recaptcha-show');
      loadRecaptchaScript(); // Script'i hemen yükle
      return () => { document.body.classList.remove('recaptcha-show'); };
    }
  }, []);

  // Certificate-specific Excel field guides
  const certificateFieldGuides: ExcelFieldGuide[] = [
    {
      name: 'TC_IDENTITY',
      description: t('institution.certificates.import.fieldGuides.nationalId.description'),
      validExamples: ['12345678901', '10987654321'],
      invalidExamples: ['12345', 'ABC12345678'],
      isRequired: true,
    },
    {
      name: 'TRAINING_ID',
      description: t('institution.certificates.import.fieldGuides.trainingId.description'),
      validExamples: ['TRN-000001', 'TRN-987654'],
      invalidExamples: ['000001', 'TRN000001', t('common.empty')],
      isRequired: true,
    },
    {
      name: 'TEMPLATE_KEY',
      description: t('institution.certificates.import.fieldGuides.templateKey.description'),
      validExamples: ['classic', 'modern', 'elegant'],
      invalidExamples: [t('common.empty')],
      isRequired: true,
    },
    {
      name: 'START_DATE',
      description: t('institution.certificates.import.fieldGuides.startDate.description'),
      validExamples: ['2025-01-01', '2024-09-15'],
      invalidExamples: ['01/01/2025', '01.01.2025'],
    },
    {
      name: 'END_DATE',
      description: t('institution.certificates.import.fieldGuides.endDate.description'),
      validExamples: ['2025-03-15', '2024-12-31'],
      invalidExamples: ['15/03/2025', '15.03.2025'],
      isRequired: true,
    },
    {
      name: 'PARTNER_IDS',
      description: t('institution.certificates.import.fieldGuides.partnerIds.description'),
      validExamples: ['ACR-000001', 'ACR-000001,RFR-000001'],
      invalidExamples: ['000001', 'ORG-000001'],
    },
    {
      name: 'UIA_REQUIRED',
      description: t('institution.certificates.import.fieldGuides.uiaRequired.description'),
      validExamples: ['0', '1'],
      invalidExamples: ['yes', 'no', 'true', 'false'],
    },
    {
      name: 'UIA_RESPONSIBLE_ID',
      description: t('institution.certificates.import.fieldGuides.uiaResponsibleId.description'),
      validExamples: ['ACR-000001'],
      invalidExamples: ['RFR-000001'],
    },
    {
      name: 'UIA_CODE',
      description: t('institution.certificates.import.fieldGuides.approvalCode.description'),
      validExamples: [],
      invalidExamples: [],
      specialNote: t('institution.certificates.import.fieldGuides.approvalCode.specialNote'),
      noteType: 'warning',
    },
  ];

  // Certificate-specific example data for template
  const certificateExampleData = [
    {
      TC_IDENTITY: '12345678901',
      TRAINING_ID: 'TRN-000001',
      TEMPLATE_KEY: 'classic',
      START_DATE: '2025-01-01',
      END_DATE: '2025-03-15',
      PARTNER_IDS: 'ACR-000001',
      UIA_REQUIRED: 0,
      UIA_RESPONSIBLE_ID: '',
      UIA_CODE: '',
    },
  ];

  // Memoized stats for the summary UI
  const { totalStudents, totalGroups, hasErrors } = useMemo(() => {
    const stats = {
      totalStudents: groups.reduce((sum, g) => sum + g.students.length, 0),
      totalGroups: groups.length,
      hasErrors: groups.some(g => g._status === 'invalid' || g.students.some(s => s._status === 'invalid')),
    };
    return stats;
  }, [groups]);


  // Certificate-specific processing and validation logic
  const processAndValidateFile = async (records: any[]) => {
    console.log('📄 Excel parse edildi, toplam satır:', records.length);
    setIsProcessing(true);
    console.log('📄 İlk 3 satır:', records.slice(0, 3));

    if (records.length === 0) {
      setGroups([]);
      setIsProcessing(false);
      return;
    }

    // 1. Group records by certificate properties (Excel satır numarasını da sakla)
    const grouped = records.reduce((acc, record, index) => {
      const excelRow = index + 2; // Excel'de satır 2'den başlıyor (1. satır başlık)

      const key = [
        record.TRAINING_ID,
        record.TEMPLATE_KEY,
        record.START_DATE,
        record.END_DATE,
        record.PARTNER_IDS,
        record.UIA_REQUIRED,
        record.UIA_RESPONSIBLE_ID,
      ].join('|');

      if (!acc[key]) {
        acc[key] = {
          trainingId: record.TRAINING_ID || null,
          templateKey: record.TEMPLATE_KEY || null,
          startDate: record.START_DATE || null,
          endDate: record.END_DATE || new Date().toISOString().split('T')[0], // Default to today if empty
          partnerIds: record.PARTNER_IDS || null,
          uiaRequired: record.UIA_REQUIRED || 0,
          uiaResponsibleId: record.UIA_RESPONSIBLE_ID || null,
          approvalCode: record.UIA_CODE || null,
          students: [],
          _status: 'pending',
          _errors: [],
        };
      }
      acc[key].students.push({
        id: String(record.TC_IDENTITY || ''),
        _status: 'pending',
        _errors: [],
        _excelRow: excelRow // Satır numarasını sakla
      });
      return acc;
    }, {} as Record<string, CertificateGroup>);

    let processedGroups: CertificateGroup[] = Object.values(grouped);

    // Helper function to validate date format and value
    const isValidDate = (dateStr: string | null): { valid: boolean; error?: string } => {
      if (!dateStr) return { valid: true }; // Empty is valid for optional fields

      // Try to parse the date
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        // Check if it's in DD.MM.YYYY format (common Excel format)
        const ddmmyyyy = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
        if (ddmmyyyy) {
          const [, day, month, year] = ddmmyyyy;
          const d = parseInt(day, 10);
          const m = parseInt(month, 10);
          const y = parseInt(year, 10);

          if (m < 1 || m > 12) {
            return { valid: false, error: `Geçersiz tarih: "${dateStr}" - ${m}. ay geçersiz (1-12 arası olmalı)` };
          }
          if (d < 1 || d > 31) {
            return { valid: false, error: `Geçersiz tarih: "${dateStr}" - ${d}. gün geçersiz (1-31 arası olmalı)` };
          }
          // Additional check for days in month
          const daysInMonth = new Date(y, m, 0).getDate();
          if (d > daysInMonth) {
            return { valid: false, error: `Geçersiz tarih: "${dateStr}" - ${m}. ayda ${d}. gün yok (max ${daysInMonth})` };
          }
          return { valid: true }; // Will be converted later
        }
        return { valid: false, error: `Geçersiz tarih formatı: "${dateStr}" (YYYY-MM-DD veya DD.MM.YYYY olmalı)` };
      }

      // Check if the date components are valid
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      const d = date.getDate();

      if (y < 1900 || y > 2100) {
        return { valid: false, error: `Geçersiz tarih: "${dateStr}" - yıl 1900-2100 arasında olmalı` };
      }

      return { valid: true };
    };

    // 2. Perform client-side validation
    processedGroups = processedGroups.map(group => {
      if (!group.trainingId) group._errors.push('TRAINING_ID boş olamaz.');
      if (!group.templateKey) group._errors.push('TEMPLATE_KEY boş olamaz.');
      if (group.students.some(s => !s.id)) group._errors.push('Listede boş TC_IDENTITY değerleri var.');

      // Date validation
      if (group.startDate) {
        const startDateCheck = isValidDate(group.startDate);
        if (!startDateCheck.valid) {
          group._errors.push(`START_DATE: ${startDateCheck.error}`);
        }
      }

      if (group.endDate) {
        const endDateCheck = isValidDate(group.endDate);
        if (!endDateCheck.valid) {
          group._errors.push(`END_DATE: ${endDateCheck.error}`);
        }
      }

      // UIA_CODE kontrolü - Excel'de boş olmalı (partner tarafından girilir)
      if (group.approvalCode && group.approvalCode.trim() !== '') {
        group._errors.push('UIA_CODE Excel\u2019de boş olmalıdır. Bu kod partner tarafından onay ekranında girilir.');
      }

      // UIA_REQUIRED kontrolü
      if (group.uiaRequired == 1) {
        if (!group.partnerIds || group.partnerIds.trim() === '') {
          group._errors.push('UIA_REQUIRED=1 ise PARTNER_IDS zorunludur.');
        } else {
          // Partner'lar arasında en az bir ACR olmalı (UIA sorumlusu olabilmesi için)
          const partnerIds = group.partnerIds.split(',').map(p => p.trim()).filter(Boolean);
          const hasAcrPartner = partnerIds.some(pid => pid.startsWith('ACR-'));

          if (!hasAcrPartner) {
            group._errors.push('UIA_REQUIRED=1 ise en az bir ACR-XXXXXX partner gereklidir (RFR partnerlar UIA sorumlusu olamaz).');
          }
        }
      }

      // Partner ID prefix kontrolü (RFR veya ACR kabul)
      if (group.partnerIds) {
        const partnerIds = group.partnerIds.split(',').map(p => p.trim()).filter(Boolean);
        partnerIds.forEach(pid => {
          if (!pid.startsWith('ACR-') && !pid.startsWith('RFR-')) {
            group._errors.push(`PARTNER_IDS geçersiz format: ${pid} (ACR-XXXXXX veya RFR-XXXXXX olmalı)`);
          }
        });
      }

      // UIA Responsible ID prefix kontrolü (sadece ACR kabul)
      if (group.uiaResponsibleId && !group.uiaResponsibleId.startsWith('ACR-')) {
        group._errors.push(`UIA_RESPONSIBLE_ID geçersiz format: ${group.uiaResponsibleId} (ACR-XXXXXX olmalı)`);
      }

      if (group._errors.length > 0) group._status = 'invalid';
      return group;
    });

    // 3. Perform server-side validation
    const allStudentIds = [...new Set(processedGroups.flatMap(g => g.students.map(s => s.id)))].filter(Boolean);
    const allTrainingIds = [...new Set(processedGroups.map(g => g.trainingId))].filter(Boolean);

    // ACR ve RFR'leri ayır
    const allPartnerIds = [...new Set(processedGroups.flatMap(g => {
      const partners = (g.partnerIds?.split(',') || []).map(p => p.trim()).filter(Boolean);
      return partners;
    }))].filter(Boolean);

    const acrPartnerIds = allPartnerIds.filter(p => p.startsWith('ACR-'));
    const rfrPartnerIds = allPartnerIds.filter(p => p.startsWith('RFR-'));

    // UIA Responsible IDs (sadece ACR)
    const allUiaResponsibleIds = [...new Set(processedGroups.map(g => g.uiaResponsibleId).filter(Boolean))];

    try {
      // console.log('🔍 Validation başlıyor...');
      // console.log('Student IDs:', allStudentIds);
      // console.log('Training IDs:', allTrainingIds);
      // console.log('ACR Partner IDs:', acrPartnerIds);
      // console.log('RFR Partner IDs:', rfrPartnerIds);
      // console.log('UIA Responsible IDs:', allUiaResponsibleIds);

      // Validation promises
      const validationPromises = [
        fetch('/api/students/validate-ids', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: allStudentIds }) }),
        fetch('/api/trainings/validate-ids', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: allTrainingIds }) }),
      ];

      // ACR organization validation
      if (acrPartnerIds.length > 0 || allUiaResponsibleIds.length > 0) {
        const acrIds = [...new Set([...acrPartnerIds, ...allUiaResponsibleIds])];
        validationPromises.push(
          fetch('/api/organizations/validate-ids', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: acrIds }) })
        );
      }

      // RFR external partner validation
      if (rfrPartnerIds.length > 0) {
        validationPromises.push(
          fetch('/api/external-partners/validate-ids', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: rfrPartnerIds }) })
        );
      }

      const responses = await Promise.all(validationPromises);

      const studentData = await responses[0].json();
      const trainingData = await responses[1].json();

      let responseIndex = 2;
      const orgData = (acrPartnerIds.length > 0 || allUiaResponsibleIds.length > 0) ? await responses[responseIndex++].json() : { results: [] };
      const rfrData = rfrPartnerIds.length > 0 ? await responses[responseIndex++].json() : { results: [] };

      // console.log('✅ Student validation:', studentData);
      // console.log('✅ Training validation:', trainingData);
      // console.log('✅ ACR Organization validation:', orgData);
      // console.log('✅ RFR Partner validation:', rfrData);

      const validStudents = new Set((studentData.results || []).filter((r: any) => r.isValid).map((r: any) => r.id));
      const validTrainings = new Set((trainingData.results || []).filter((r: any) => r.isValid).map((r: any) => r.id));
      const validAcrOrgs = new Set((orgData.results || []).filter((r: any) => r.isValid).map((r: any) => r.id));
      const validRfrPartners = new Set((rfrData.results || []).filter((r: any) => r.isValid).map((r: any) => r.id));

      // 4. Update groups with validation results
      processedGroups = processedGroups.map(group => {
        if (group._status === 'invalid') return group;

        // Excel satır numaralarını al (grubun ilk öğrencisinden)
        const excelRows = group.students.map(s => s._excelRow).filter(Boolean);
        const rowInfo = excelRows.length > 0 ? ` (Excel satır: ${excelRows.join(', ')})` : '';

        if (group.trainingId && !validTrainings.has(group.trainingId)) {
          group._errors.push(`Eğitim ID (${group.trainingId}) geçersiz${rowInfo}`);
        }

        // Partner validation - ACR ve RFR ayrı kontrol
        const partnerIds = (group.partnerIds?.split(',') || []).map(p => p.trim()).filter(Boolean);
        partnerIds.forEach((id: string) => {
          if (id.startsWith('ACR-') && !validAcrOrgs.has(id)) {
            group._errors.push(`Partner ID (${id}) geçersiz${rowInfo}`);
          } else if (id.startsWith('RFR-') && !validRfrPartners.has(id)) {
            group._errors.push(`Referans Partner ID (${id}) geçersiz${rowInfo}`);
          }
        });

        if (group.uiaResponsibleId && group.uiaResponsibleId.startsWith('ACR-') && !validAcrOrgs.has(group.uiaResponsibleId)) {
          group._errors.push(`UIA Sorumlusu ID (${group.uiaResponsibleId}) geçersiz${rowInfo}`);
        }

        group.students.forEach(student => {
          if (student.id && !validStudents.has(student.id)) {
            student._status = 'invalid';
            const rowInfo = student._excelRow ? ` (Satır ${student._excelRow})` : '';
            student._errors.push(`TC Kimlik No (${student.id}) geçersiz veya sistemde kayıtlı değil${rowInfo}`);
          }
        });

        if (group._errors.length > 0 || group.students.some(s => s._status === 'invalid')) {
          group._status = 'invalid';
        } else {
          group._status = 'valid';
        }

        return group;
      });

    } catch (error) {
      console.error("Server validation failed:", error);
      alert(t('institution.certificates.import.validationError'));
      processedGroups.forEach(g => g._status = 'invalid');
    }

    setGroups(processedGroups);
    setIsProcessing(false);
  };

  const handleCreateCertificates = async () => {
    setIsProcessing(true);
    const validGroups = groups.filter(g => g._status === 'valid');
    try {
      // reCAPTCHA token'ı al
      const recaptchaToken = await executeRecaptcha('bulk_certificate_create');

      const response = await fetch('/api/certificates/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: validGroups, recaptchaToken }),
      });
      if (response.ok) {
        alert(t('institution.certificates.import.createSuccess').replace('{count}', String(validGroups.length)));
        // Reset state after successful submission
        setGroups([]);
      } else {
        const errorData = await response.json();
        alert(t('institution.certificates.import.createError').replace('{error}', errorData.error || t('institution.certificates.import.unknownError')));
      }
    } catch (error) {
      console.error('Bulk create failed:', error);
      alert(t('institution.certificates.import.networkError'));
    }
    setIsProcessing(false);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('institution.certificates.import.title')}</h1>
          <p className="text-gray-600 mt-2">{t('institution.certificates.import.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowInfoModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          title={t('institution.certificates.import.howTo')}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('institution.certificates.import.howTo')}
        </button>
      </div>

      {/* Info Modal - Using Component */}
      <ExcelImportGuide
        isOpen={showInfoModal}
        title={t('institution.certificates.import.guide.modalTitle')}
        onClose={() => setShowInfoModal(false)}
        fields={certificateFieldGuides}
        additionalInfo={
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">{t('institution.certificates.import.guide.autoGroupTitle')}</h4>
              <p className="text-sm text-blue-800">{t('institution.certificates.import.guide.autoGroupDesc')}</p>
            </div>
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-amber-900 mb-1">{t('institution.certificates.import.guide.duplicateFileWarningTitle')}</h4>
                  <p className="text-sm text-amber-800">{t('institution.certificates.import.guide.duplicateFileWarningDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {/* Step 1: Download Template - Using Component */}
      <ExcelTemplateDownloader
        exampleData={certificateExampleData}
        filename="toplu_sertifika_sablonu.xlsx"
        sheetName={t('institution.certificates.import.downloadTemplate.sheetName')}
        buttonText={t('institution.certificates.import.downloadTemplate.button')}
        downloadButtonText={t('institution.certificates.import.downloadTemplate.downloadButton')}
        stepNumber={1}
        stepColor="blue"
        description={t('institution.certificates.import.downloadTemplate.description')}
      />

      {/* Step 2: Upload File - Using Component */}
      <ExcelUploader
        onDataParsed={(data) => {
          setGroups([]);
          processAndValidateFile(data);
        }}
        title={t('institution.certificates.import.uploader.title')}
        description={t('institution.certificates.import.uploader.description')}
        buttonText={t('institution.certificates.import.uploader.button')}
        stepNumber={2}
        stepColor="green"
      />

      {/* Step 3: Validation & Preview */}
      {isProcessing && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-700">{t('institution.certificates.import.processing')}</p>
          </div>
        </div>
      )}
      {groups.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-700 font-bold text-lg">3</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800">{t('institution.certificates.import.step3.title')}</h2>
              <p className="text-sm text-gray-600 mt-1">{t('institution.certificates.import.step3.desc')}</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-4 border border-purple-100">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-600">{t('institution.certificates.import.step3.totalStudents')}</p>
                <p className="text-2xl font-bold text-purple-700">{totalStudents}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('institution.certificates.import.step3.totalGroups')}</p>
                <p className="text-2xl font-bold text-blue-700">{totalGroups}</p>
              </div>
            </div>
            {hasErrors && (
              <div className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-semibold text-red-700">{t('institution.certificates.import.step3.hasErrors')}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {groups.map((group, index) => (
              <div key={index} className={`rounded-lg border p-4 ${group._status === 'invalid' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 mb-2">{t('institution.certificates.import.step3.group.title').replace('{index}', String(index + 1)).replace('{count}', String(group.students.length))}</p>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">{t('institution.certificates.import.step3.group.trainingId')}</span>
                        <span className={`ml-2 font-mono ${group.trainingId ? 'text-gray-800' : 'text-red-500'}`}>
                          {group.trainingId || t('institution.certificates.import.step3.group.unspecified')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('institution.certificates.import.step3.group.template')}</span>
                        <span className={`ml-2 ${group.templateKey ? 'text-gray-800' : 'text-red-500'}`}>
                          {group.templateKey || t('institution.certificates.import.step3.group.unspecified')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('institution.certificates.import.step3.group.date')}</span>
                        <span className="ml-2 text-gray-800">
                          {group.startDate && group.endDate
                            ? `${group.startDate} - ${group.endDate}`
                            : group.endDate || t('institution.certificates.import.step3.group.today')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('institution.certificates.import.step3.group.uiaRequired')}</span>
                        <span className="ml-2 text-gray-800">{group.uiaRequired == 1 ? t('institution.certificates.import.step3.group.yes') : t('institution.certificates.import.step3.group.no')}</span>
                      </div>
                      {group.partnerIds && (
                        <div className="col-span-2">
                          <span className="text-gray-500">{t('institution.certificates.import.step3.group.partners')}</span>
                          <span className="ml-2 font-mono text-gray-800">{group.partnerIds}</span>
                        </div>
                      )}
                      {group.uiaResponsibleId && (
                        <div className="col-span-2">
                          <span className="text-gray-500">{t('institution.certificates.import.step3.group.uiaResponsible')}</span>
                          <span className="ml-2 font-mono text-gray-800">{group.uiaResponsibleId}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2">
                      <span className="text-gray-500 text-xs">{t('institution.certificates.import.step3.group.students')}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {group.students.map((student, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded font-mono ${student._status === 'invalid'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                              }`}
                          >
                            {student.id}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    {group._status === 'invalid' ?
                      <span className="text-xs font-semibold px-2 py-1 bg-red-200 text-red-800 rounded">{t('institution.certificates.import.step3.group.invalid')}</span> :
                      <span className="text-xs font-semibold px-2 py-1 bg-green-200 text-green-800 rounded">{t('institution.certificates.import.step3.group.valid')}</span>
                    }
                  </div>
                </div>

                {group._errors.length > 0 && (
                  <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded">
                    <strong>{t('institution.certificates.import.step3.group.groupErrors')}</strong>
                    <ul className="list-disc list-inside mt-1">
                      {group._errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}

                {group.students.filter(s => s._status === 'invalid').length > 0 && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-100 p-2 rounded">
                    <strong>{t('institution.certificates.import.step3.group.invalidStudents').replace('{count}', String(group.students.filter(s => s._status === 'invalid').length))}</strong>
                    <div className="mt-1">
                      {group.students.filter(s => s._status === 'invalid').map((s, i) => (
                        <div key={i} className="font-mono">{s.id} - {s._errors.join(', ')}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Confirmation & Upload */}
      {groups.length > 0 && !hasErrors && (
        <div className="rounded-xl border border-blue-300 bg-green-50 p-6">
          <h2 className="text-lg font-semibold text-green-800">{t('institution.certificates.import.step4.title')}</h2>
          <p className="text-sm text-green-700 mt-1">{t('institution.certificates.import.step4.desc').replace('{groups}', String(totalGroups)).replace('{students}', String(totalStudents))}</p>
          <button
            onClick={handleCreateCertificates}
            className={`mt-4 py-3 px-4 rounded-lg font-medium transition-colors ${isProcessing || groups.filter(g => g._status === 'valid').length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'btn-primary'
              }`}
            disabled={isProcessing || groups.filter(g => g._status === 'valid').length === 0}
          >
            {isProcessing
              ? t('institution.certificates.import.step4.creating')
              : groups.filter(g => g._status === 'valid').length === 0
                ? t('institution.certificates.import.step4.noValid')
                : t('institution.certificates.import.step4.createN').replace('{count}', String(groups.filter(g => g._status === 'valid').length))}
          </button>
        </div>
      )}
    </div>
  );
}

// return (
//   <div className="space-y-6">
//     <div>
//       <h1 className="text-3xl font-bold text-gray-900">Toplu Sertifika Oluşturma</h1>
//       <p className="text-gray-600 mt-2">Tek bir Excel dosyası kullanarak, farklı özelliklere sahip sertifikaları öğrencileriniz için toplu olarak oluşturun.</p>
//     </div>

//     {/* Step 1: Download Template */}
//     <div className="rounded-xl border border-gray-200 bg-white p-6">
//       <h2 className="text-lg font-semibold text-gray-800">Adım 1: Şablonu İndirin</h2>
//       <p className="text-sm text-gray-600 mt-1">Verilerinizi doğru formatta girmek için Excel şablonunu indirin. Her satır bir öğrenciye verilecek bir sertifikayı temsil eder.</p>
//       <button onClick={handleDownloadTemplate} className="btn-secondary mt-4">
//         Excel Şablonu İndir (.xlsx)
//       </button>
//     </div>

//     {/* Step 2: Upload File */}
//     <div className="rounded-xl border border-gray-200 bg-white p-6">
//       <h2 className="text-lg font-semibold text-gray-800">Adım 2: Dosyanızı Yükleyin</h2>
//       <p className="text-sm text-gray-600 mt-1">Doldurduğunuz Excel dosyasını seçin. Dosyanızdaki veriler anında gruplanacak ve doğrulanacaktır.</p>
//       <div className="mt-4">
//         <input
//           key={file ? 'file-loaded' : 'file-empty'} // Reset input when file is processed
//           type="file"
//           accept=".xlsx, .xls" // Explicitly accept only Excel formats
//           onChange={handleFileChange}
//           className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//         />
//       </div>
//     </div>

//     {/* Step 3: Validation & Preview */}
//     {isProcessing && <p>İşleniyor...</p>}
//     {groups.length > 0 && (
//       <div className="rounded-xl border border-gray-200 bg-white p-6">
//         <h2 className="text-lg font-semibold text-gray-800 mb-4">Adım 3: Doğrulama ve Önizleme</h2>
//         <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg mb-4">
//           <p className="text-sm text-gray-700">Toplam <strong>{totalStudents}</strong> öğrenci için <strong>{totalGroups}</strong> farklı sertifika grubu bulundu.</p>
//           {hasErrors && <p className="text-sm font-bold text-red-600">Lütfen hatalı grupları düzeltin.</p>}
//         </div>

//         <div className="space-y-4">
//           {groups.map((group, index) => (
//             <div key={index} className={`rounded-lg border p-4 ${group._status === 'invalid' ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
//               <div className="flex justify-between items-start">
//                 <div>
//                   <p className="font-semibold text-gray-800">Grup #{index + 1}: {group.students.length} Öğrenci</p>
//                   <p className="text-xs text-gray-500 mt-1">Eğitim: {group.trainingId || <span className='text-red-500'>Belirtilmemiş</span>}</p>
//                   <p className="text-xs text-gray-500">Partnerler: {group.partnerIds || 'Yok'}</p>
//                 </div>
//                 <div>
//                   {group._status === 'invalid' ?
//                     <span className="text-xs font-semibold text-red-600">Hatalı</span> :
//                     <span className="text-xs font-semibold text-green-600">Geçerli</span>
//                   }
//                 </div>
//               </div>
//               {group._errors.length > 0 && (
//                 <div className="mt-2 text-xs text-red-700 bg-red-100 p-2 rounded">
//                   <strong>Grup Hataları:</strong> {group._errors.join(', ')}
//                 </div>
//               )}
//               {group.students.filter(s => s._status === 'invalid').length > 0 && (
//                  <div className="mt-2 text-xs text-amber-700 bg-amber-100 p-2 rounded">
//                   <strong>Geçersiz Öğrenciler:</strong> {group.students.filter(s => s._status === 'invalid').map(s => s.id).join(', ')}
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     )}

//     {/* Step 4: Confirmation & Upload */}
//     {groups.length > 0 && !hasErrors && (
//       <div className="rounded-xl border border-green-300 bg-green-50 p-6">
//         <h2 className="text-lg font-semibold text-green-800">Adım 4: Onay ve Sertifika Oluşturma</h2>
//         <p className="text-sm text-green-700 mt-1">Tüm {totalGroups} grup doğrulandı ve {totalStudents} öğrenci için sertifika oluşturmaya hazır.</p>
//         <button
//           onClick={handleCreateCertificates}
//           className="btn-primary mt-4"
//           disabled={isProcessing}
//         >
//           {isProcessing ? 'Oluşturuluyor...' : `${totalGroups} Sertifika Grubunu Oluştur`}
//         </button>
//       </div>
//     )}
//   </div>
// );