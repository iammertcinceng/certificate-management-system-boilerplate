'use client';

import * as XLSX from 'xlsx';

interface ExcelUploaderProps {
  onDataParsed: (data: any[]) => void;
  acceptedFormats?: string;
  disabled?: boolean;
  buttonText?: string;
  title?: string;
  description?: string;
  stepNumber?: number;
  stepColor?: string;
}

export default function ExcelUploader({
  onDataParsed,
  acceptedFormats = '.xlsx, .xls',
  disabled = false,
  buttonText,
  title,
  description,
  stepNumber,
  stepColor = 'green',
}: ExcelUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        onDataParsed(jsonData);
      } catch (error) {
        console.error('Excel parse error:', error);
        alert('Dosya okunurken bir hata oluştu. Lütfen dosyanın bozuk olmadığından emin olun.');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const colorClasses = {
    green: 'bg-green-100 text-green-700 file:bg-green-50 file:text-green-700 hover:file:bg-green-100',
    blue: 'bg-blue-100 text-blue-700 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100',
    purple: 'bg-purple-100 text-purple-700 file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        {stepNumber && (
          <div className={`flex-shrink-0 w-10 h-10 ${colorClasses[stepColor as keyof typeof colorClasses].split(' ')[0]} rounded-full flex items-center justify-center`}>
            <span className={`${colorClasses[stepColor as keyof typeof colorClasses].split(' ')[1]} font-bold text-lg`}>{stepNumber}</span>
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
          <div className="mt-4">
            <label className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${stepColor === 'green' ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' : stepColor === 'blue' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'} transition-colors`}>
              {buttonText || 'Dosya Seç'}
              <input
                type="file"
                accept={acceptedFormats}
                onChange={handleFileChange}
                disabled={disabled}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

