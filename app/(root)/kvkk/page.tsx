"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { useSystemConfig } from '@/hooks/useSystemConfig';

export default function KVKKPage() {
  const { t } = useLanguage();
  const { supportEmail } = useSystemConfig();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-r from-[#0945A5] to-[#2AA8E2] text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('kvkk.title')}</h1>
          <p className="text-xl text-blue-100">{t('kvkk.lastUpdated')}: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('kvkk.sections.intro.title')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('kvkk.sections.intro.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('kvkk.sections.dataController.title')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('kvkk.sections.dataController.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('kvkk.sections.personalData.title')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">{t('kvkk.sections.personalData.content')}</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('kvkk.sections.personalData.items.0')}</li>
              <li>{t('kvkk.sections.personalData.items.1')}</li>
              <li>{t('kvkk.sections.personalData.items.2')}</li>
              <li>{t('kvkk.sections.personalData.items.3')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('kvkk.sections.processingPurpose.title')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('kvkk.sections.processingPurpose.content')}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('kvkk.sections.dataSubjectRights.title')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">{t('kvkk.sections.dataSubjectRights.content')}</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>{t('kvkk.sections.dataSubjectRights.items.0')}</li>
              <li>{t('kvkk.sections.dataSubjectRights.items.1')}</li>
              <li>{t('kvkk.sections.dataSubjectRights.items.2')}</li>
              <li>{t('kvkk.sections.dataSubjectRights.items.3')}</li>
              <li>{t('kvkk.sections.dataSubjectRights.items.4')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('kvkk.sections.contact.title')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('kvkk.sections.contact.content')}{' '}
              <a href={`mailto:${supportEmail}`} className="text-blue-600 hover:text-blue-700 font-medium">
                {supportEmail}
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
