"use client";

import { useLanguage } from '@/contexts/LanguageContext';

export default function HowItWorksPage() {
  const { t } = useLanguage();

  const steps = [
    {
      number: "01",
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      titleKey: "howItWorks.steps.registration.title",
      descKey: "howItWorks.steps.registration.description",
      color: "from-blue-500 to-blue-600"
    },
    {
      number: "02",
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      titleKey: "howItWorks.steps.createCertificate.title",
      descKey: "howItWorks.steps.createCertificate.description",
      color: "from-purple-500 to-purple-600"
    },
    {
      number: "03",
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      titleKey: "howItWorks.steps.verification.title",
      descKey: "howItWorks.steps.verification.description",
      color: "from-green-500 to-green-600"
    },
    {
      number: "04",
      icon: (
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      titleKey: "howItWorks.steps.reporting.title",
      descKey: "howItWorks.steps.reporting.description",
      color: "from-orange-500 to-orange-600"
    }
  ];

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      titleKey: "howItWorks.features.fast.title",
      descKey: "howItWorks.features.fast.description"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      titleKey: "howItWorks.features.secure.title",
      descKey: "howItWorks.features.secure.description"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
      ),
      titleKey: "howItWorks.features.cloud.title",
      descKey: "howItWorks.features.cloud.description"
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      titleKey: "howItWorks.features.collaboration.title",
      descKey: "howItWorks.features.collaboration.description"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('howItWorks.title')}</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">{t('howItWorks.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Process Steps */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('howItWorks.processTitle')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('howItWorks.processSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent -translate-x-1/2 z-0" />
              )}
              
              <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border border-gray-200 h-full">
                {/* Step Number */}
                <div className={`absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white mb-6`}>
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {t(step.titleKey)}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t(step.descKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('howItWorks.whyChooseUs')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('howItWorks.whyChooseUsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t(feature.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold mb-2">200+</div>
              <div className="text-blue-100">{t('howItWorks.stats.institutions')}</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">50,000+</div>
              <div className="text-blue-100">{t('howItWorks.stats.certificates')}</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">15+</div>
              <div className="text-blue-100">{t('howItWorks.stats.countries')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('howItWorks.cta.title')}
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            {t('howItWorks.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              {t('howItWorks.cta.getStarted')}
            </a>
            <a
              href="/contact"
              className="px-8 py-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all border-2 border-gray-200 hover:border-gray-300"
            >
              {t('howItWorks.cta.contactUs')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
