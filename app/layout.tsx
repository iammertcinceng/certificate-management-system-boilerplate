import type { Metadata } from "next";
import "./globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cookies } from 'next/headers';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import LayoutWrapper from '@/components/layout/LayoutWrapper';
import SessionProviderClient from "@/components/SessionProviderClient";
export const metadata: Metadata = {
  title: "Enterprise App Platform",
  description: "Enterprise SaaS Application Template",
  icons: {
    icon: [
      { url: "/mertcin-anonym-logo.png", type: "image/png", sizes: "32x32" },
      { url: "/mertcin-anonym-logo.png", type: "image/png", sizes: "192x192" },
      { url: "/mertcin-anonym-logo.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/mertcin-anonym-logo.png",
    apple: "/mertcin-anonym-logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const supportedLocales = ['tr', 'en'] as const;
  const resolvedLocale = (supportedLocales as readonly string[]).includes(cookieLocale) ? cookieLocale : 'en';

  return (
    <html lang={resolvedLocale}>
      <body className="antialiased font-sans min-h-screen flex flex-col">
        <SessionProviderClient>
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <LanguageProvider initialLanguage={resolvedLocale as any} initialMessages={messages as any}>
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </LanguageProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </SessionProviderClient>
      </body>
    </html>
  );
}

