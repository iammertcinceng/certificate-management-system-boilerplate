"use client";
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

const NavLink = ({ href, currentPath, children }: { href: string, currentPath: string, children: React.ReactNode }) => (
  <Link href={href} className={`font-medium transition-colors relative group py-2 ${currentPath === href
    ? 'text-[var(--primary)]'
    : 'text-gray-600 hover:text-[var(--primary)]'
    }`}>
    {children}
    <span className={`absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary-light)] transition-transform duration-300 scale-x-0 group-hover:scale-x-100 ${currentPath === href ? 'scale-x-100' : ''
      }`} />
  </Link>
);

export default function Header() {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const guestLinks = [
    { href: '/verify', label: t('nav.verify') },
    { href: '/about', label: t('nav.about') },
    { href: '/services', label: t('nav.services') },
    { href: '/collaborations', label: t('nav.collaborations') },
  ];

  const institutionLinks = [
    { href: '/institution', label: t('nav.dashboard') },
    { href: '/institution/certificates', label: t('nav.certificates') },
    { href: '/institution/students', label: t('nav.students') },
    { href: '/institution/partners', label: t('nav.partners') },
    { href: '/institution/profile', label: t('nav.profile') },
    { href: '/institution/settings', label: t('nav.settings') },
  ];

  const partnerLinks = [
    { href: '/acreditor', label: t('nav.dashboard') },
    { href: '/acreditor/approvals', label: t('nav.approvals') },
    { href: '/acreditor/institutions', label: t('nav.institutions') },
    { href: '/acreditor/profile', label: t('nav.profile') },
  ];

  const getNavLinks = () => {
    if (!user) return guestLinks;
    switch (user.role) {
      case 'institution': return institutionLinks;
      case 'acreditor':
        return partnerLinks;
      default: return guestLinks;
    }
  };

  const navLinks = getNavLinks();

  // console.log(user);

  return (
    <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-200 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center space-x-3 hover:scale-105 transition-transform">
            <Image src="/mertcin-anonym-logo.png" alt="Enterprise App" width={48} height={48} className="h-12 w-12" />
            <div className="leading-tight">
              <div
                className="font-extrabold text-xl md:text-2xl inline-block bg-clip-text text-transparent"
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
              <div className="text-sm md:text-base text-[var(--primary)]">SaaS Platformu</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map(link => <NavLink key={link.href} href={link.href} currentPath={pathname}>{link.label}</NavLink>)}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-800">{user.organizationName || user.email}</div> {/* TODO: kurum adı gelmiyor güncellenecek. */}
                  <div className="text-xs text-gray-500">{t(`header.roles.${user.role}`)}</div>
                </div>
                <button onClick={signOut} className="px-4 py-2 text-sm font-medium text-red-600 bg-red-100 border border-gray-300 rounded-lg hover:bg-red-400 hover:text-white transition-colors">{t('nav.logout')}</button> {/* TODO: Çıkış butonu rengi güncellenecek.*/}
                <LanguageSwitcher />
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link href="/login" className="text-gray-700 hover:text-[var(--primary)] font-medium transition-colors">{t('nav.login')}</Link>
                <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-light)] transition-colors">{t('nav.register')}</Link>
                <LanguageSwitcher />
              </div>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 bg-white">
            <nav className="flex flex-col space-y-3">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} className={`font-medium transition-colors py-2 ${pathname === link.href ? 'text-[var(--primary)]' : 'text-gray-600 hover:text-[var(--primary)]'}`}>
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-gray-200">
                {user ? (
                  <div className="space-y-3">
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">{user.organizationName}</div>
                      <div className="text-xs text-gray-500">{t(`header.roles.${user.role}`)}</div>
                    </div>
                    <button onClick={signOut} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors w-full">{t('nav.logout')}</button>
                    <LanguageSwitcher />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/login" className="block text-center text-gray-700 hover:text-[var(--primary)] font-medium transition-colors py-2">{t('nav.login')}</Link>
                    <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-light)] transition-colors w-full text-center block">{t('nav.register')}</Link>
                    <LanguageSwitcher />
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
