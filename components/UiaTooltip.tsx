"use client";
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
interface UiaTooltipProps {
  children: React.ReactNode;
  className?: string;
}

export default function UiaTooltip({ children, className = '' }: UiaTooltipProps) {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className={`cursor-help ${className}`}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl shadow-xl animate-in fade-in duration-200">
          <div className="font-semibold text-gray-900 mb-1.5">{t('institution.certificates.uia.title')}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
            <div className="border-[6px] border-transparent border-t-white drop-shadow-sm"></div>
          </div>
        </div>
      )}
    </div>
  );
}
