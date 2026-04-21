"use client";
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isRecaptchaEnabled, executeRecaptcha } from '@/lib/recaptcha';

export default function Home() {
  const { t, get } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  useEffect(() => {
    const role = (session?.user as any)?.role as string | undefined;
    if (role === 'admin') {
      router.replace('/admin');
    }
  }, [session, router]);

  // Anasayfada reCAPTCHA badge'i göster (minimal)
  useEffect(() => {
    if (isRecaptchaEnabled()) {
      document.body.classList.add('recaptcha-show');
      // Script'i önceden yükle (login'e geçiş hızlı olsun)
      executeRecaptcha('homepage');
      return () => { document.body.classList.remove('recaptcha-show'); };
    }
  }, []);

  return (
    <div className="min-h-screen">

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        {/* Brand gradient wash using root variables */}
        <div className="absolute inset-0 opacity-10" style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 50%, var(--accent) 100%)'
        }}></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl animate-bounce-subtle opacity-10" style={{ backgroundColor: 'var(--primary)' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-bounce-subtle opacity-10" style={{ backgroundColor: 'var(--secondary)', animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full blur-3xl animate-bounce-subtle opacity-10" style={{ backgroundColor: 'var(--accent)', animationDelay: '0.5s' }}></div>
        </div>

        <div className="relative max-w-[1400px] mx-auto px-6">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full glass mb-8 animate-fade-in">
              <span className="text-[var(--purple)] text-sm font-medium">{t('landing.trustBadge')}</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 animate-slide-up">
              <span className="gradient-text">{t('landing.title')}</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {t('landing.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Link href="/verify" className="btn-primary text-lg px-8 py-4">
                {t('landing.ctaVerify')}
              </Link>
              <Link href="/register" className="btn-secondary text-lg px-8 py-4">
                {t('landing.ctaLogin')}
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="glass-primary rounded-2xl p-6 border border-primary-100 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-300 hover:-translate-y-0.5">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{t('landing.heroStats.certificates')}</div>
                <div className="text-gray-500 font-medium">{t('landing.heroStats.certificatesLabel')}</div>
              </div>
              <div className="glass-secondary rounded-2xl p-6 border border-secondary-100 hover:border-secondary-200 hover:shadow-lg hover:shadow-secondary-500/10 transition-all duration-300 hover:-translate-y-0.5">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{t('landing.heroStats.institutions')}</div>
                <div className="text-gray-500 font-medium">{t('landing.heroStats.institutionsLabel')}</div>
              </div>
              <div className="glass-accent rounded-2xl p-6 border border-accent-100 hover:border-accent-200 hover:shadow-lg hover:shadow-accent-500/10 transition-all duration-300 hover:-translate-y-0.5">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">{t('landing.heroStats.countries')}</div>
                <div className="text-gray-500 font-medium">{t('landing.heroStats.countriesLabel')}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Wave divider for smooth transition */}
        <div className="pointer-events-none absolute bottom-0 left-0 w-full">
          <svg className="w-full h-16 md:h-24" viewBox="0 0 1440 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,40 C 360,100 1080,-20 1440,40 L1440,100 L0,100 Z" fill="var(--cream-light)" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        {/* subtle colorful background for layering using root vars */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-10 left-1/3 w-80 h-80 rounded-full blur-3xl opacity-10" style={{ backgroundColor: 'var(--primary)' }}></div>
          <div className="absolute bottom-0 right-1/4 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-10" style={{ backgroundColor: 'var(--secondary)' }}></div>
          <div className="absolute top-1/2 -left-10 w-72 h-72 rounded-full blur-3xl opacity-10" style={{ backgroundColor: 'var(--accent)' }}></div>
        </div>
        <div className="relative max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold gradient-text-secondary mb-6">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass-primary rounded-2xl p-8 border border-primary-100 hover:border-primary-200 hover:scale-105 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold gradient-text mb-4">{t('features.fastVerification.title')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('features.fastVerification.description')}</p>
            </div>

            <div className="glass-secondary rounded-2xl p-8 border border-secondary-100 hover:border-secondary-200 hover:scale-105 hover:shadow-xl hover:shadow-secondary-500/10 transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold gradient-text-secondary mb-4">{t('features.secureSystem.title')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('features.secureSystem.description')}</p>
            </div>

            <div className="glass-accent rounded-2xl p-8 border border-accent-100 hover:border-accent-200 hover:scale-105 hover:shadow-xl hover:shadow-accent-500/10 transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-primary-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold gradient-text-accent mb-4">{t('features.instantResult.title')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('features.instantResult.description')}</p>
            </div>

            <div className="glass-secondary rounded-2xl p-8 border border-secondary-100 hover:border-secondary-200 hover:scale-105 hover:shadow-xl hover:shadow-secondary-500/10 transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold gradient-text-secondary mb-4">{t('features.globalAccess.title')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('features.globalAccess.description')}</p>
            </div>

            <div className="glass-primary rounded-2xl p-8 border border-primary-100 hover:border-primary-200 hover:scale-105 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <h3 className="text-xl font-bold gradient-text mb-4">{t('features.multiLanguage.title')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('features.multiLanguage.description')}</p>
            </div>

            <div className="glass-accent rounded-2xl p-8 border border-accent-100 hover:border-accent-200 hover:scale-105 hover:shadow-xl hover:shadow-accent-500/10 transition-all duration-300 group hover:-translate-y-0.5">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold gradient-text-accent mb-4">{t('features.printableCertificates.title')}</h3>
              <p className="text-gray-600 leading-relaxed">{t('features.printableCertificates.description')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/10 to-secondary-900/10"></div>
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center gap-4 mb-16">
            <h2 className="text-3xl md:text-5xl font-bold gradient-text-accent mb-6 p-2">
              {t('testimonials.title')}
            </h2>
            <p className="text-xl text-dark-200 max-w-3xl mx-auto">
              {t('testimonials.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {get<{ name: string, role: string, content: string }[]>('testimonials.items', []).map((testimonial, index) => (
              <div key={index} className="glass-primary rounded-2xl p-8 border border-primary-100 hover:border-primary-200 hover:scale-105 hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <div className="font-bold text-gray-800">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed italic">"{testimonial.content}"</p>
                <div className="flex text-[#046358] mt-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold gradient-text mb-8">
            {t('landing.ctaSection.title')}
          </h2>
          <p className="text-xl text-dark-200 mb-12 max-w-2xl mx-auto">
            {t('landing.ctaSection.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/register" className="btn-primary text-lg px-8 py-4">
              {t('landing.ctaSection.primary')}
            </Link>
            <Link href="/contact" className="btn-secondary text-lg px-8 py-4">
              {t('landing.ctaSection.secondary')}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
