'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl text-center">
        <div className="bg-gradient-primary text-transparent bg-clip-text">
          <h1 className="text-6xl font-extrabold tracking-tight">404</h1>
        </div>
        <p className="mt-4 text-2xl font-semibold text-dark-800">{t('notFound.title')}</p>
        <p className="mt-2 text-dark-500">{t('notFound.description')}</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/" className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 transition">{t('notFound.actions.home')}</Link>
          <button onClick={() => history.back()} className="inline-flex items-center justify-center rounded-md border border-dark-300 px-4 py-2 text-dark-700 hover:bg-dark-50 transition">{t('notFound.actions.back')}</button>
        </div>
      </div>
    </main>
  );
}
