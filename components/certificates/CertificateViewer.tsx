'use client';

import React, { useRef, useState } from 'react';
import { CertificateRenderer } from './CertificateRenderer';
import { CertificateData } from '@/types/certificate';
import { exportCertificateToPDF, exportCertificateToPNG } from '@/utils/certificateExport';
import { useLanguage } from '@/contexts/LanguageContext';

interface CertificateViewerProps {
  data: CertificateData;
  scale?: number;
  showControls?: boolean;
}

export const CertificateViewer: React.FC<CertificateViewerProps> = ({
  data,
  scale = 0.5,
  showControls = true,
}) => {
  const { t } = useLanguage();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    if (!certificateRef.current) return;

    setIsExporting(true);
    try {
      const filename = `sertifika-${data.certificateNumber}-${data.studentName.replace(/\s+/g, '-')}.pdf`;
      await exportCertificateToPDF(certificateRef.current, filename);
    } catch (error) {
      console.error('PDF export error:', error);
      alert(t('certificate.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPNG = async () => {
    if (!certificateRef.current) return;

    setIsExporting(true);
    try {
      const filename = `sertifika-${data.certificateNumber}-${data.studentName.replace(/\s+/g, '-')}.png`;
      await exportCertificateToPNG(certificateRef.current, filename);
    } catch (error) {
      console.error('PNG export error:', error);
      alert(t('certificate.exportError'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      {showControls && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {data.studentName} - {data.trainingName}
              </h3>
              <p className="text-sm text-gray-600">
                {t('certificate.certificateNo')}: {data.publicId} - {t('certificate.certificateId')}: {data.certificateCode}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* <button
                onClick={handleExportPNG}
                disabled={isExporting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                PNG İndir
              </button> */}

              {/* <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isExporting ? t('verify.downloading') : t('verify.downloadPdf')}
              </button> */}
            </div>
          </div>
        </div>
      )}

      {/* Certificate Preview */}
      <div className="bg-white rounded-lg shadow-sm px-6 pt-6 pb-2">
        <div className="flex justify-center overflow-x-hidden  bg-gray-100 rounded-lg px-6">
          <div
            ref={certificateRef}
            style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
          >
            <CertificateRenderer data={data} scale={scale} />
          </div>
        </div>
        {showControls && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-1">{t('certificate.previewInfo')}</p>
                <p>
                  {t('certificate.previewDescription')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
