"use client";
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-gray-400 py-12" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <Image src="/mertcin-anonym-logo.png" alt={t('footer.brand.alt')} width={40} height={40} className="h-10 w-10" />
              <div className="leading-tight">
                <div
                  className="font-extrabold text-xl inline-block bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'var(--purple-transition)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '100% 100%'
                  }}
                >
                  Sertifika Sistemi
                </div>
                <div className="text-sm text-[var(--primary)]">SaaS Platformu</div>
              </div>
            </Link>
            <p className="text-gray-600 mb-4">{t('footer.tagline')}</p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-[#0945A5] transition-colors" aria-label="Twitter">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#0945A5] transition-colors" aria-label="Facebook">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.675 0h-21.35C.597 0 0 .598 0 1.333v21.333C0 23.403.597 24 1.325 24H12.82v-9.294H9.692V11.06h3.128V8.414c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.098 2.795.142v3.24l-1.918.001c-1.504 0-1.796.715-1.796 1.764v2.316h3.587l-.467 3.646h-3.12V24h6.116C23.403 24 24 23.403 24 22.666V1.333C24 .598 23.403 0 22.675 0z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#0945A5] transition-colors" aria-label="LinkedIn">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-4">{t('footer.columns.product.title')}</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/verify" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.product.items.verify')}</Link></li>
              <li><Link href="/how-it-works" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.product.items.howItWorks')}</Link></li>
              <li><Link href="/services" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.product.items.features')}</Link></li>
              <li><Link href="/collaborations" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.product.items.collaborations')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-4">{t('footer.columns.company.title')}</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/about" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.company.items.about')}</Link></li>
              <li><span className="text-gray-400 cursor-not-allowed">{t('footer.columns.company.items.careers')}</span></li>
              <li><span className="text-gray-400 cursor-not-allowed">{t('footer.columns.company.items.blog')}</span></li>
              <li><Link href="/contact" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.company.items.contact')}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-800 mb-4">{t('footer.columns.support.title')}</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link href="/help" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.support.items.help')}</Link></li>
              <li><Link href="/privacy" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.support.items.privacy')}</Link></li>
              <li><Link href="/terms" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.support.items.terms')}</Link></li>
              <li><Link href="/kvkk" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.support.items.kvkk')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <div className="text-center md:text-left">
              <p>&copy; {new Date().getFullYear()} Sertifika Sistemi. {t('footer.copyright')}</p>
              <p className="text-xs mt-1">{t('footer.tagline')}</p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <a href="mailto:mertcin0@outlook.com" className="hover:text-[var(--primary)] transition-colors">
                mertcin0@outlook.com
              </a>
              <div className="flex gap-3 text-xs">
                <Link href="/privacy" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.support.items.privacy')}</Link>
                <span>•</span>
                <Link href="/terms" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.support.items.terms')}</Link>
                <span>•</span>
                <Link href="/kvkk" className="hover:text-[#0945A5] transition-colors">{t('footer.columns.support.items.kvkk')}</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
