'use client';

import { useLanguage } from "@/contexts/LanguageContext";

export interface ExcelFieldGuide {
  name: string;
  description: string;
  validExamples: string[];
  invalidExamples: string[];
  isRequired?: boolean;
  specialNote?: string;
  noteType?: 'warning' | 'info' | 'danger';
}

interface ExcelImportGuideProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  fields: ExcelFieldGuide[];
  additionalInfo?: React.ReactNode;
}

export default function ExcelImportGuide({
  isOpen,
  onClose,
  title,
  fields,
  additionalInfo,
}: ExcelImportGuideProps) {

  const { t } = useLanguage();
  if (!isOpen) return null;

  const noteColors = {
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    danger: 'bg-red-50 border-red-300 text-red-900',
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900">{title || t('institution.certificates.import.guide.modalTitle')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {fields.map((field, index) => (
            <div key={index}>
              <h4 className="font-semibold text-gray-900 mb-2">
                {index + 1}️⃣ {field.name}
                {field.isRequired && <span className="text-red-500 ml-1">*</span>}
              </h4>
              <p className="text-sm text-gray-600 mb-2">{field.description}</p>

              {/* Valid Examples */}
              {field.validExamples.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm mb-2">
                  <p className="text-green-800">
                    <strong>✅ {t('common.true')}:</strong> {field.validExamples.join(', ')}
                  </p>
                </div>
              )}

              {/* Invalid Examples */}
              {field.invalidExamples.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                  <p className="text-red-800">
                    <strong>❌ {t('common.false')}:</strong> {field.invalidExamples.join(', ')}
                  </p>
                </div>
              )}

              {/* Special Note */}
              {field.specialNote && (
                <div className={`border-2 rounded-lg p-4 mt-2 ${noteColors[field.noteType || 'info']}`}>
                  <p className="text-sm font-medium">{field.specialNote}</p>
                </div>
              )}
            </div>
          ))}

          {/* Additional Info */}
          {additionalInfo}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <button onClick={onClose} className="w-full btn-primary">
            {t('common.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
}
