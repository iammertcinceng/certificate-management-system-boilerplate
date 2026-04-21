'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import ExcelTemplateDownloader from '@/components/excel/ExcelTemplateDownloader';
import ExcelUploader from '@/components/excel/ExcelUploader';
import ExcelImportGuide, { ExcelFieldGuide } from '@/components/excel/ExcelImportGuide';

type ValidationStatus = 'pending' | 'valid' | 'invalid';

interface StudentRecord {
  nationalId: string;
  firstName: string;
  lastName: string;
  secondaryLastName: string | null;
  birthDate: string | null;
  email: string | null;
  phone: string | null;
  _status: ValidationStatus;
  _errors: string[];
  _excelRow?: number;
}

export default function BulkStudentImportPage() { //tüm sayfaya çeviri eklenecek.
  const { t } = useLanguage();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Student-specific Excel field guides
  const studentFieldGuides: ExcelFieldGuide[] = [
    {
      name: 'TC_NUMBER',
      description: t('institution.students.import.fieldGuides.nationalId.description'),
      validExamples: ['12345678901', '98765432109'],
      invalidExamples: ['123456789', '1234567890A', t('common.empty')],
      isRequired: true,
    },
    {
      name: 'FIRST_NAME',
      description: t('institution.students.import.fieldGuides.firstName.description'),
      validExamples: ['Ahmet', 'Mehmet', 'Ayşe'],
      invalidExamples: [t('common.empty')],
      isRequired: true,
    },
    {
      name: 'LAST_NAME',
      description: t('institution.students.import.fieldGuides.lastName.description'),
      validExamples: ['Yılmaz', 'Kaya', 'Demir'],
      invalidExamples: [t('common.empty')],
      isRequired: true,
    },
    {
      name: 'BIRTH_DATE',
      description: t('institution.students.import.fieldGuides.birthDate.description'),
      validExamples: ['1990-05-15', '2000-12-31', '1985-01-01'],
      invalidExamples: ['15/05/1990', '15.05.1990', '1990/05/15', t('common.empty')],
      isRequired: true,
    },
    {
      name: 'SECONDARY_LAST_NAME',
      description: t('institution.students.import.fieldGuides.secondaryLastName.description'),
      validExamples: ['Yılmaz', 'Kara'],
      invalidExamples: [],
      specialNote: t('institution.students.import.fieldGuides.secondaryLastName.specialNote'),
      noteType: 'info',
    },
    {
      name: 'EMAIL',
      description: t('institution.students.import.fieldGuides.email.description'),
      validExamples: ['ornek@email.com', 'student@university.edu.tr'],
      invalidExamples: ['invalid-email', '@email.com', 'email@'],
    },
    {
      name: 'PHONE',
      description: t('institution.students.import.fieldGuides.phone.description'),
      validExamples: ['05551234567', '0 555 123 45 67', '+90 555 123 45 67'],
      invalidExamples: ['123', 'phone'],
    },
  ];

  const studentExampleData = [
    {
      TC_NUMBER: '12345678901',
      FIRST_NAME: 'Ahmet',
      LAST_NAME: 'Yılmaz',
      BIRTH_DATE: '1995-06-15',
      SECONDARY_LAST_NAME: '',
      EMAIL: 'ahmet.yilmaz@example.com',
      PHONE: '05551234567',
    },
  ];

  // Memoized stats
  const { totalStudents, hasErrors } = useMemo(() => {
    const stats = {
      totalStudents: students.length,
      hasErrors: students.some(s => s._status === 'invalid'),
    };
    return stats;
  }, [students]);

  /**
   * Esnek tarih çözümleyici - Excel'in farklı formatlarını destekler
   * Desteklenen formatlar:
   * - Excel seri numarası (örn: 33008)
   * - DD.MM.YYYY (örn: 15.05.1990)
   * - DD-MM-YYYY (örn: 15-05-1990)
   * - DD/MM/YYYY (örn: 15/05/1990)
   * - YYYY-MM-DD (örn: 1990-05-15)
   * - YYYY/MM/DD (örn: 1990/05/15)
   */
  const parseBirthDate = (value: any): string | null => {
    if (!value) return null;

    const str = String(value).trim();
    if (!str) return null;

    // 1. Excel seri numarası kontrolü (sadece rakamlardan oluşuyor ve 5-6 hane)
    if (/^\d{4,6}$/.test(str)) {
      const serial = parseInt(str, 10);
      // Excel tarihi: 1 Ocak 1900'den itibaren gün sayısı
      // Excel'in 1900 hatasını da hesaba kat (Excel 1900'ü artık yıl sayar)
      // UTC hesaplama yaparak timezone sorununu önle
      const excelEpoch = Date.UTC(1899, 11, 30); // 30 Aralık 1899 UTC
      const dateMs = excelEpoch + serial * 24 * 60 * 60 * 1000;
      const date = new Date(dateMs);
      if (!isNaN(date.getTime()) && date.getUTCFullYear() >= 1900 && date.getUTCFullYear() <= 2100) {
        // UTC değerlerini kullanarak local timezone etkisinden kaçın
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    // 2. Zaten YYYY-MM-DD formatında mı?
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    // 3. DD.MM.YYYY veya DD-MM-YYYY veya DD/MM/YYYY formatı
    const ddmmyyyyMatch = str.match(/^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = ddmmyyyyMatch[1].padStart(2, '0');
      const month = ddmmyyyyMatch[2].padStart(2, '0');
      const year = ddmmyyyyMatch[3];
      return `${year}-${month}-${day}`;
    }

    // 4. YYYY/MM/DD formatı
    const yyyymmddMatch = str.match(/^(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{1,2})$/);
    if (yyyymmddMatch) {
      const year = yyyymmddMatch[1];
      const month = yyyymmddMatch[2].padStart(2, '0');
      const day = yyyymmddMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Tanınmayan format - olduğu gibi döndür (validation'da hata verecek)
    return str;
  };

  // Student-specific processing and validation logic
  const processAndValidateFile = async (records: any[]) => {
    console.log('📄 Excel parse edildi, toplam satır:', records.length);
    setIsProcessing(true);

    if (records.length === 0) {
      setStudents([]);
      setIsProcessing(false);
      return;
    }

    // Map records to StudentRecord format - ensure all values are strings
    let processedStudents: StudentRecord[] = records.map((record, index) => ({
      nationalId: String(record.TC_NUMBER || '').trim(),
      firstName: String(record.FIRST_NAME || '').trim(),
      lastName: String(record.LAST_NAME || '').trim(),
      secondaryLastName: record.SECONDARY_LAST_NAME ? String(record.SECONDARY_LAST_NAME).trim() : null,
      birthDate: parseBirthDate(record.BIRTH_DATE),
      email: record.EMAIL ? String(record.EMAIL).trim() : null,
      phone: record.PHONE ? String(record.PHONE).trim() : null,
      _status: 'pending' as ValidationStatus,
      _errors: [],
      _excelRow: index + 2, // Excel row number (header is row 1)
    }));

    // Check for duplicates within the Excel file
    const tcMap = new Map<string, number>();
    const emailMap = new Map<string, number>();
    const phoneMap = new Map<string, number>();

    processedStudents.forEach((student, index) => {
      const tc = student.nationalId; // Already trimmed
      const email = student.email;
      const phone = student.phone;

      if (tc) {
        tcMap.set(tc, (tcMap.get(tc) || 0) + 1);
      }
      if (email) {
        emailMap.set(email, (emailMap.get(email) || 0) + 1);
      }
      if (phone) {
        phoneMap.set(phone, (phoneMap.get(phone) || 0) + 1);
      }
    });

    // Client-side validation
    processedStudents = processedStudents.map(student => {
      const errors: string[] = [];

      // TC Number validation
      if (!student.nationalId || student.nationalId === '') {
        errors.push('TC_NUMBER boş olamaz.');
      } else if (!/^\d{11}$/.test(student.nationalId)) {
        errors.push('TC_NUMBER 11 haneli sayı olmalıdır.');
      } else if (tcMap.get(student.nationalId)! > 1) {
        errors.push('TC_NUMBER Excel içinde tekrar ediyor. Her öğrenci farklı TC\'ye sahip olmalı.');
      }

      // First name validation
      if (!student.firstName || student.firstName.trim() === '') {
        errors.push('FIRST_NAME boş olamaz.');
      }

      // Last name validation
      if (!student.lastName || student.lastName.trim() === '') {
        errors.push('LAST_NAME boş olamaz.');
      }

      // Birth date validation
      if (!student.birthDate || student.birthDate === '') {
        errors.push('BIRTH_DATE boş olamaz.');
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(student.birthDate)) {
        errors.push('BIRTH_DATE formatı YYYY-MM-DD olmalıdır (örn: 1990-05-15).');
      }

      // Email validation (optional)
      if (student.email && student.email !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(student.email)) {
          errors.push('EMAIL geçerli bir e-posta adresi olmalıdır.');
        } else if (emailMap.get(student.email)! > 1) {
          errors.push('EMAIL Excel içinde tekrar ediyor. Her öğrenci farklı email\'e sahip olmalı.');
        }
      }

      // Phone validation (optional)
      if (student.phone && student.phone !== '') {
        if (phoneMap.get(student.phone)! > 1) {
          errors.push('PHONE Excel içinde tekrar ediyor. Her öğrenci farklı telefona sahip olmalı.');
        }
      }

      if (errors.length > 0) {
        return { ...student, _status: 'invalid' as ValidationStatus, _errors: errors };
      }

      return { ...student, _status: 'valid' as ValidationStatus };
    });

    // Server-side validation - check for duplicate TC numbers, emails, and phones
    try {
      const nationalIds = processedStudents
        .map(s => s.nationalId)
        .filter(Boolean);

      const emails = processedStudents
        .map(s => s.email?.trim())
        .filter(Boolean);

      const phones = processedStudents
        .map(s => s.phone?.trim())
        .filter(Boolean);

      if (nationalIds.length > 0 || emails.length > 0 || phones.length > 0) {
        const response = await fetch('/api/students/validate-tc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nationalIds, emails, phones }),
        });

        if (response.ok) {
          const data = await response.json();
          const existingTCs = new Set(data.existingTCs || []);
          const existingEmails = new Set(data.existingEmails || []);
          const existingPhones = new Set(data.existingPhones || []);

          processedStudents = processedStudents.map(student => {
            const errors = [...student._errors];

            if (existingTCs.has(student.nationalId)) {
              errors.push(`TC_NUMBER ${student.nationalId} sistemde zaten kayıtlı.`);
            }

            if (student.email && existingEmails.has(student.email.trim())) {
              errors.push(`EMAIL ${student.email} sistemde zaten kayıtlı.`);
            }

            if (student.phone && existingPhones.has(student.phone.trim())) {
              errors.push(`PHONE ${student.phone} sistemde zaten kayıtlı.`);
            }

            if (errors.length > student._errors.length) {
              return {
                ...student,
                _status: 'invalid' as ValidationStatus,
                _errors: errors,
              };
            }

            return student;
          });
        }
      }
    } catch (error) {
      console.error('Server validation failed:', error);
      alert(t('institution.students.import.messages.validationError'));
    }

    setStudents(processedStudents);
    setIsProcessing(false);
  };

  const handleCreateStudents = async () => {
    setIsProcessing(true);
    const validStudents = students.filter(s => s._status === 'valid');

    try {
      const response = await fetch('/api/students/bulk-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students: validStudents }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(t('institution.students.import.messages.createSuccess').replace('{count}', String(result.created || validStudents.length)));
        setStudents([]);
        // Redirect to students page
        window.location.href = '/institution/students';
      } else {
        const errorData = await response.json();
        alert(errorData.error ? t('institution.students.import.messages.createError').replace('{error}', errorData.error) : t('institution.students.import.messages.createErrorUnknown'));
      }
    } catch (error) {
      console.error('Bulk create failed:', error);
      alert(t('institution.students.import.messages.createNetworkError'));
    }
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('institution.students.import.title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('institution.students.import.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowInfoModal(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          title="Excel Doldurma Talimatları"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('institution.students.import.howToFill')}
        </button>
      </div>

      {/* Info Modal - Using Component */}
      <ExcelImportGuide
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        fields={studentFieldGuides}
        additionalInfo={
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">ℹ️ {t('institution.students.import.infoTitle')}</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>{t('institution.students.import.infoItems.eachRow')}</li>
              <li>{t('institution.students.import.infoItems.uniqueTc')}</li>
              <li>{t('institution.students.import.infoItems.existingTc')}</li>
              <li>{t('institution.students.import.infoItems.optionalFields')}</li>
            </ul>
          </div>
        }
      />

      {/* Step 1: Download Template - Using Component */}
      <ExcelTemplateDownloader
        exampleData={studentExampleData}
        filename="toplu_ogrenci_sablonu.xlsx"
        sheetName="Öğrenciler"
        buttonText={t('institution.students.import.step1.button')}
        downloadButtonText={t('institution.students.import.step1.downloadButton')}
        stepNumber={1}
        stepColor="blue"
        description={t('institution.students.import.step1.description')}
      />

      {/* Step 2: Upload File - Using Component */}
      <ExcelUploader
        onDataParsed={(data) => {
          setStudents([]);
          processAndValidateFile(data);
        }}
        title={t('institution.students.import.step2.title')}
        description={t('institution.students.import.step2.description')}
        buttonText={t('institution.students.import.step2.button')}
        stepNumber={2}
        stepColor="green"
      />

      {/* Step 3: Validation & Preview */}
      {isProcessing && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-700">{t('institution.students.import.step3.processing')}</p>
          </div>
        </div>
      )}

      {students.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-700 font-bold text-lg">3</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-800">{t('institution.students.import.step3.title')}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {t('institution.students.import.step3.description')}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-4 border border-purple-100">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-600">{t('institution.students.import.step3.stats.total')}</p>
                <p className="text-2xl font-bold text-purple-700">{totalStudents}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('institution.students.import.step3.stats.valid')}</p>
                <p className="text-2xl font-bold text-green-700">
                  {students.filter(s => s._status === 'valid').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">{t('institution.students.import.step3.stats.invalid')}</p>
                <p className="text-2xl font-bold text-red-700">
                  {students.filter(s => s._status === 'invalid').length}
                </p>
              </div>
            </div>
            {hasErrors && (
              <div className="flex items-center gap-2 bg-red-100 px-4 py-2 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-semibold text-red-700">{t('institution.students.import.step3.hasErrors')}</p>
              </div>
            )}
          </div>

          {/* Student List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {students.map((student, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${student._status === 'invalid' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 mb-1">
                      {student.firstName} {student.lastName}
                      {student.secondaryLastName && <span className="text-gray-500 font-normal ml-1">{student.secondaryLastName}</span>}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <p><strong>{t('institution.students.import.step3.labels.tc')}</strong> {student.nationalId}</p>
                      <p><strong>{t('institution.students.import.step3.labels.birthDate')}</strong> {student.birthDate || '-'}</p>
                      <p><strong>{t('institution.students.import.step3.labels.email')}</strong> {student.email || '-'}</p>
                      <p><strong>{t('institution.students.import.step3.labels.phone')}</strong> {student.phone || '-'}</p>
                    </div>
                  </div>
                  <div>
                    {student._status === 'valid' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ {t('institution.students.import.step3.validBadge')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ✗ {t('institution.students.import.step3.invalidBadge')}
                      </span>
                    )}
                  </div>
                </div>
                {student._errors.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-red-300">
                    <p className="text-xs font-semibold text-red-700 mb-1">{t('institution.students.import.step3.errorsTitle')}</p>
                    <ul className="text-xs text-red-600 space-y-1">
                      {student._errors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreateStudents}
            className={`mt-6 w-full py-3 px-4 rounded-lg font-medium transition-colors ${isProcessing || students.filter(s => s._status === 'valid').length === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'btn-primary'
              }`}
            disabled={isProcessing || students.filter(s => s._status === 'valid').length === 0}
          >
            {isProcessing
              ? t('institution.students.import.actions.creating')
              : students.filter(s => s._status === 'valid').length === 0
                ? t('institution.students.import.actions.noValid')
                : t('institution.students.import.actions.create').replace('{count}', String(students.filter(s => s._status === 'valid').length))}
          </button>
        </div>
      )}
    </div>
  );
}
