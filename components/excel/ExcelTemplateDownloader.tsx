'use client';

import * as XLSX from 'xlsx';

interface ExcelTemplateDownloaderProps {
  headers?: string[];
  exampleData?: any[];
  filename: string;
  sheetName?: string;
  buttonText?: string;
  downloadButtonText?: string;
  stepNumber?: number;
  stepColor?: string;
  description?: string;
}

export default function ExcelTemplateDownloader({
  headers,
  exampleData,
  filename,
  sheetName = 'Sheet1',
  buttonText,
  downloadButtonText,
  stepNumber,
  stepColor = 'blue',
  description,
}: ExcelTemplateDownloaderProps) {
  const handleDownload = () => {
    let ws: XLSX.WorkSheet;

    if (exampleData && exampleData.length > 0) {
      ws = XLSX.utils.json_to_sheet(exampleData);
    } else if (headers && headers.length > 0) {
      ws = XLSX.utils.json_to_sheet([{}], { header: headers });
    } else {
      console.error('Either headers or exampleData must be provided');
      return;
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  };

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        {stepNumber && (
          <div className={`flex-shrink-0 w-10 h-10 ${colorClasses[stepColor as keyof typeof colorClasses]} rounded-full flex items-center justify-center`}>
            <span className={`${colorClasses[stepColor as keyof typeof colorClasses].split(' ')[1]} font-bold text-lg`}>{stepNumber}</span>
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800">{buttonText}</h2>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          <button onClick={handleDownload} className="btn-secondary mt-4">
            📥 {downloadButtonText || 'Excel Şablonu İndir (.xlsx)'}
          </button>
        </div>
      </div>
    </div>
  );
}

