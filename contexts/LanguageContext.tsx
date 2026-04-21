"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Locale, defaultLocale } from '@/lib/locales';

interface LanguageContextType {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  get: <T = unknown>(key: string, fallback?: T) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

type ProviderProps = {
  children: React.ReactNode;
  initialLanguage?: Locale;
  initialMessages?: Record<string, unknown>;
};

export function LanguageProvider({ children, initialLanguage, initialMessages }: ProviderProps) {
  const [language, setLanguageState] = useState<Locale>(() => {
    if (initialLanguage) return initialLanguage;
    if (typeof document === 'undefined') return defaultLocale;

    // 1. Check if user has previously selected a language (cookie)
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale | undefined;

    console.log('[LanguageContext] Initial cookie locale:', cookieLocale);
    if (cookieLocale) return cookieLocale;

    // 2. Detect browser language
    const browserLang = navigator.language || (navigator as any).userLanguage;
    const browserLocale = browserLang.split('-')[0].toLowerCase(); // 'en-US' -> 'en'

    // 3. Check if we support this language
    const supportedLocales: Locale[] = ['tr', 'en'];
    if (supportedLocales.includes(browserLocale as Locale)) {
      return browserLocale as Locale;
    }

    // 4. Fallback to English (not Turkish, for international users)
    return 'en';
  });
  const [messages, setMessages] = useState<Record<string, unknown>>(() => initialMessages ?? {});
  const [loaded, setLoaded] = useState<boolean>(() => Boolean(initialMessages));

  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoaded(false);

        // Load all 4 modular translation files and merge them
        const [common, root, institution, acreditor] = await Promise.all([
          import(`../languages/${language}/common.json`),
          import(`../languages/${language}/root.json`),
          import(`../languages/${language}/institution.json`),
          import(`../languages/${language}/acreditor.json`),
        ]);

        const mergedMessages = {
          ...common.default,
          ...root.default,
          ...institution.default,
          ...acreditor.default,
        };

        setMessages(mergedMessages as Record<string, unknown>);
        setLoaded(true);

        // Save to cookie for server-side access
        document.cookie = `NEXT_LOCALE=${language}; path=/; max-age=31536000`;

        console.log(`[LanguageContext] Loaded ${language} messages:`, Object.keys(mergedMessages).length, 'top-level keys');
        console.log('[LanguageContext] Cookie set to:', language);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };
    // If we already have initial messages for the current language, skip reload
    if (initialMessages && initialLanguage === language) {
      setLoaded(true);
      // Ensure cookie is set for subsequent requests
      if (typeof document !== 'undefined') {
        document.cookie = `NEXT_LOCALE=${language}; path=/; max-age=31536000`;
      }
      return;
    }
    loadMessages();
  }, [language, initialLanguage, initialMessages]);

  const get = <T = unknown>(key: string, fallback?: T): T => {
    const keys = key.split('.');
    let value: unknown = messages;
    for (const k of keys) {
      if (typeof value === 'object' && value !== null && k in (value as Record<string, unknown>)) {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
        break;
      }
    }
    return (value !== undefined ? (value as T) : (fallback as T)) as T;
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const value = get<string | undefined>(key);
    let result = typeof value === 'string' ? value : key;

    // Debug: Log if translation is missing
    if (loaded && result === key && key.includes('.')) {
      console.warn('[LanguageContext] Missing translation:', key, 'language:', language);
    }

    // Interpolate parameters like {count}, {credits}, etc.
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }

    return result;
  };

  const setLanguage = (lang: Locale) => {
    console.log('[LanguageContext] setLanguage called:', lang, 'current:', language);
    setLanguageState(lang);
    try {
      if (typeof document !== 'undefined') {
        document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`;
        // Small refresh to reflect serverside-rendered texts
        setTimeout(() => {
          if (typeof window !== 'undefined') window.location.reload();
        }, 150);
      }
    } catch { }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, get }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

