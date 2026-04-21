import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();

  // Get locale from cookie or fallback to English
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const supportedLocales = ['tr', 'en'];
  const resolvedLocale = supportedLocales.includes(cookieLocale) ? cookieLocale : 'en';

  // Load all 4 modular translation files and merge them
  const [common, root, institution, acreditor] = await Promise.all([
    import(`../languages/${resolvedLocale}/common.json`),
    import(`../languages/${resolvedLocale}/root.json`),
    import(`../languages/${resolvedLocale}/institution.json`),
    import(`../languages/${resolvedLocale}/acreditor.json`),
  ]);

  return {
    locale: resolvedLocale,
    messages: {
      ...common.default,
      ...root.default,
      ...institution.default,
      ...acreditor.default,
    }
  };
});

