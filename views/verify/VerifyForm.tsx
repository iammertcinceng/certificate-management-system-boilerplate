"use client";
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRouter } from 'next/navigation';

export default function VerifyForm() {
  const { t } = useLanguage();
  const router = useRouter();
  const [q, setQ] = useState('');

  const normalize = (value: string) => {
    const v = (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return v;
  };

  const go = (value: string) => {
    const input = normalize(value).trim();
    if (!input) return;
    router.push(`/verify/result?q=${encodeURIComponent(input)}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    go(q);
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="11" cy="11" r="6.2" stroke="currentColor" strokeWidth="1.8"/></svg>
        </span>
        <input
          value={q}
          onChange={(e)=> setQ(normalize(e.target.value))}
          onKeyDown={(e)=> { if (e.key === 'Enter') go(q); }}
          placeholder={t('verify.placeholder')}
          aria-label={t('verify.placeholder')}
          className="w-full rounded-2xl border border-gray-200 bg-white px-12 py-4 text-lg shadow-sm outline-none focus:border-[#0945A5] focus:ring-2 focus:ring-[#0945A5]/30"
        />
        <button
          type="submit"
          aria-label={t('verify.submit')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[#0945A5] px-4 py-2 text-white shadow hover:bg-[#083b8f] focus:ring-2 focus:ring-[#0945A5]/30"
        >
          {t('verify.submit')}
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-3 text-center">{t('verify.hint')}</p>
    </form>
  );
}
