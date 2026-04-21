"use client";
import { useLanguage } from '@/contexts/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-[var(--primary)] text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('about.title')}</h1>
          <p className="text-xl text-[var(--primary-light)] opacity-90 max-w-2xl">{t('about.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('about.mission.title')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('about.mission.content')}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="w-16 h-16 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('about.vision.title')}</h2>
            <p className="text-gray-600 leading-relaxed">{t('about.vision.content')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl p-12 mb-16 border border-gray-100 shadow-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('about.stats.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-extrabold text-[var(--primary)] mb-2">
                {t('landing.heroStats.certificates')}
              </div>
              <div className="text-gray-600 font-medium uppercase tracking-wider text-sm">{t('landing.heroStats.certificatesLabel')}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold text-[var(--primary)] mb-2">
                {t('landing.heroStats.institutions')}
              </div>
              <div className="text-gray-600 font-medium uppercase tracking-wider text-sm">{t('landing.heroStats.institutionsLabel')}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-extrabold text-[var(--primary)] mb-2">
                {t('landing.heroStats.countries')}
              </div>
              <div className="text-gray-600 font-medium uppercase tracking-wider text-sm">{t('landing.heroStats.countriesLabel')}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <p className="text-gray-700 leading-relaxed text-lg">
            Our enterprise authentication and verification systems are built to run independently across multiple global regions.
            Providing top tier solutions for universities, large enterprises and standard validation organizations natively.
          </p>
        </div>
      </div>
    </div>
  );
}
