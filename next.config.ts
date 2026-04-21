import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

// ─────────────────────────────────────────────────────
//  SECURITY HEADERS
//  Tarayıcıların uyması gereken güvenlik kuralları
// ─────────────────────────────────────────────────────

const isDev = process.env.NODE_ENV === 'development';

// Content Security Policy
// Next.js dev modunda HMR (Hot Module Replacement) için 'unsafe-eval' gereklidir
// Production'da 'unsafe-eval' YOKTUR — XSS koruması için kritik
const cspDirectives = [
  "default-src 'self'",
  // script-src: Next.js inline scriptleri var, Stripe JS + reCAPTCHA v3 whitelist
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://js.stripe.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.stripe.com https://www.gstatic.com",
  "font-src 'self' data:",
  // frame-src: Stripe iframe + reCAPTCHA challenge iframe
  "frame-src https://js.stripe.com https://hooks.stripe.com https://www.google.com https://www.gstatic.com https://www.recaptcha.net",
  // connect-src: API çağrıları — Stripe + reCAPTCHA verify
  `connect-src 'self' https://api.stripe.com https://www.google.com ${isDev ? 'ws://localhost:* http://localhost:*' : ''}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  // upgrade-insecure-requests sadece production'da — localhost HTTP üzerinden çalışır
  ...(isDev ? [] : ['upgrade-insecure-requests']),
];
const ContentSecurityPolicy = cspDirectives.join('; ');

const securityHeaders = [
  // 1. CSP — XSS ve injection koruması, hangi kaynakların çalışabileceğini belirler
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  // 2. Clickjacking koruması — sitenin başka sitelerde iframe içinde açılmasını engeller
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // 3. MIME-sniffing engelleme — tarayıcının dosya türünü tahmin etmesini durdurur
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // 4. HTTPS zorunluluğu — 2 yıl boyunca tüm bağlantıları HTTPS'e yönlendirir
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // 5. Referrer bilgi sızıntısını kontrol eder
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // 6. Gereksiz tarayıcı API'lerini kapatır (kamera, mikrofon vb.)
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // 7. DNS prefetch kontrolü
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
];

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: false },

  async headers() {
    return [
      {
        // Tüm route'lara güvenlik header'ları uygula
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
