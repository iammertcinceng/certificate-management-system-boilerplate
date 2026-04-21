"use client";
import VerifyForm from '@/views/verify/VerifyForm';
import { useLanguage } from '@/contexts/LanguageContext';

export default function VerifyPage() {
  const { t } = useLanguage();
  return (
    <main className="min-h-[70vh] px-4 pt-24 md:pt-28 pb-12">
      <div className="w-full max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold gradient-text">{t('verify.title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('verify.subtitle')}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
          <VerifyForm />
        </div>
      </div>
    </main>
  );
}
