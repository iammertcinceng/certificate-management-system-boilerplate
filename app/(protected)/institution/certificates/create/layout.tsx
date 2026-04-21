"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PropsWithChildren } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

const steps = [
  { id: '01', key: 'template', href: '/institution/certificates/create/template', descKey: 'template.desc' },
  { id: '02', key: 'training', href: '/institution/certificates/create/training', descKey: 'training.desc' },
  { id: '03', key: 'partners', href: '/institution/certificates/create/partners', descKey: 'partners.desc' },
  { id: '04', key: 'students', href: '/institution/certificates/create/students', descKey: 'students.desc' },
  { id: '05', key: 'review', href: '/institution/certificates/create/review', descKey: 'review.desc' },
];

export default function CreateCertificateLayout({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const currentIdx = Math.max(0, steps.findIndex(s => pathname?.startsWith(s.href)));
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/institution/certificates" className="text-sm text-gray-600 hover:text-[#0945A5] mb-4 inline-block">
          &larr; {t('institution.certificates.backToManagement')}
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">{t('institution.certificates.createNew')}</h1>
            <p className="text-gray-600 mt-2">{t('institution.certificates.createNewDescription')}</p>
          </div>
          <Link href="/institution/certificates/import" className="btn-secondary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 0 1 1.06 0l4.5 4.5a.75.75 0 0 1-1.06 1.06l-3.22-3.22V16.5a.75.75 0 0 1-1.5 0V4.81L8.03 8.03a.75.75 0 0 1-1.06-1.06l4.5-4.5ZM3 15.75a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
            </svg>
            {t('institution.certificates.bulkAdd')}
          </Link>
        </div>
      </div>

      <nav aria-label="Progress">
        <ol role="list" className="border border-gray-200 rounded-md divide-y divide-gray-200 md:flex md:divide-y-0">
          {steps.map((step, stepIdx) => (
            <li key={step.key} className="relative md:flex-1 md:flex">
              <Link href={step.href} className={`px-6 py-4 flex items-center text-sm font-medium ${stepIdx <= currentIdx ? 'text-[#0945A5]' : 'text-gray-500'}`}>
                <span className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border-2 rounded-full ${stepIdx <= currentIdx ? 'border-[#0945A5]' : 'border-gray-300'}`}>
                  {step.id}
                </span>
                <span className="ml-4 text-sm font-medium text-gray-600">
                  {t(`institution.certificates.create.${step.key}.title`)}
                </span>
              </Link>
              {stepIdx !== steps.length - 1 ? (
                <div className="hidden md:block absolute top-0 right-0 h-full w-5" aria-hidden="true">
                  <svg className="h-full w-full text-gray-200" viewBox="0 0 22 80" fill="none" preserveAspectRatio="none"><path d="M0.5 0H22L0.5 80H0.5V0Z" fill="currentColor" /></svg>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        {children}
      </div>
    </div>
  );
}
