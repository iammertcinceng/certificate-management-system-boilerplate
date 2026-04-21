export const locales = ['tr', 'en'] as const;
export type Locale = typeof locales[number];
export const defaultLocale: Locale = 'en'; // Default to English for international users

//yeni dil eklemek için aşağıya ekleme yapın ve 
//languages klasörü altına .json dosyasını ekleyin. 
export const localeNames = {
  tr: 'Türkçe',
  en: 'English',
  // ar: 'العربية', arapça
  // de: 'Deutsch', almanca
  // fr: 'Français', fransızca
  // es: 'Español', ispanyolca
  // it: 'Italiano', italyanca
  // ja: '日本語', japonca

  // pt: 'Português', portekizce
  // ru: 'Русский', rusça
} as const;
