"use client";

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HelpPage() {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: t('help.faqs.0.question'),
      answer: t('help.faqs.0.answer')
    },
    {
      question: t('help.faqs.1.question'),
      answer: t('help.faqs.1.answer')
    },
    {
      question: t('help.faqs.2.question'),
      answer: t('help.faqs.2.answer')
    },
    {
      question: t('help.faqs.3.question'),
      answer: t('help.faqs.3.answer')
    },
    {
      question: t('help.faqs.4.question'),
      answer: t('help.faqs.4.answer')
    },
    {
      question: t('help.faqs.5.question'),
      answer: t('help.faqs.5.answer')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0945A5] to-[#2AA8E2] text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{t('help.title')}</h1>
          <p className="text-xl text-blue-100">{t('help.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <a href="/verify" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('help.quickLinks.verify.title')}</h3>
            <p className="text-sm text-gray-600">{t('help.quickLinks.verify.description')}</p>
          </a>

          <a href="/contact" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('help.quickLinks.contact.title')}</h3>
            <p className="text-sm text-gray-600">{t('help.quickLinks.contact.description')}</p>
          </a>

          <a href="/how-it-works" className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">{t('help.quickLinks.howItWorks.title')}</h3>
            <p className="text-sm text-gray-600">{t('help.quickLinks.howItWorks.description')}</p>
          </a>
        </div>

        {/* FAQ Section */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">{t('help.faqTitle')}</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-8">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform ${openIndex === index ? 'rotate-180' : ''
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-5 text-gray-600 border-t border-gray-100 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mt-16 bg-gradient-to-r from-[#0945A5] to-[#2AA8E2] rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-2">{t('help.contactCta.title')}</h3>
          <p className="text-blue-100 mb-6">{t('help.contactCta.subtitle')}</p>
          <a
            href="/contact"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            {t('help.contactCta.button')}
          </a>
        </div>
      </div>
    </div>
  );
}
