"use client";

import { useLanguage } from '@/contexts/LanguageContext';

export default function ServicesPage() {
  const { t } = useLanguage();

  const services = [
    {
      key: 'certificateManagement',
      icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      color: 'blue'
    },
    {
      key: 'verification',
      icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      color: 'green'
    },
    {
      key: 'partnerNetwork',
      icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
      color: 'purple'
    },
    {
      key: 'reporting',
      icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      color: 'orange'
    },
    {
      key: 'security',
      icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
      color: 'red'
    },
    {
      key: 'support',
      icon: <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
      color: 'indigo'
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; hover: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-200' },
    green: { bg: 'bg-green-100', text: 'text-green-600', hover: 'hover:bg-green-200' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:bg-purple-200' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:bg-orange-200' },
    red: { bg: 'bg-red-100', text: 'text-red-600', hover: 'hover:bg-red-200' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', hover: 'hover:bg-indigo-200' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section - Same as About page */}
      <div className="bg-gradient-to-r from-[#0945A5] to-[#2AA8E2] text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('services.title')}</h1>
          <p className="text-xl text-blue-100 max-w-2xl">{t('services.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const colors = colorClasses[service.color];
            return (
              <div key={service.key} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-all group">
                <div className={`w-16 h-16 ${colors.bg} rounded-xl flex items-center justify-center mb-6 ${colors.text} ${colors.hover} transition-colors group-hover:scale-110 transform duration-300`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {t(`services.${service.key}.title`)}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t(`services.${service.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">{t('services.cta.title')}</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">{t('services.cta.subtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              {t('services.cta.getStarted')}
            </a>
            <a
              href="/contact"
              className="inline-block bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white"
            >
              {t('services.cta.contactUs')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
