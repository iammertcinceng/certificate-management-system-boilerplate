"use client";
import { useLanguage } from '@/contexts/LanguageContext';
import { locales, type Locale } from '@/lib/locales';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const switchTo = (nextLocale: Locale) => {
    if (nextLocale === language) return;
    setLanguage(nextLocale);
    setOpen(false);
    
    // Refresh the page to apply language change to server components
    router.refresh();
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-gray-100 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-200"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {language.toUpperCase()}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-500">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <ul className="absolute right-0 mt-2 min-w-[8rem] rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden z-40" role="listbox">
          {locales.map((lc) => (
            <li key={lc}>
              <button
                type="button"
                onClick={() => switchTo(lc)}
                className={`w-full text-left px-3 py-2 text-sm transition hover:bg-gray-50 ${lc === language ? 'bg-gray-100 text-[#0945A5] font-semibold' : 'text-gray-700'}`}
                role="option"
                aria-selected={lc === language}
              >
                {lc.toUpperCase()}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
