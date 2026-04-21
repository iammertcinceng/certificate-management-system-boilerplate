"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminHeader() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  const handleSignOut = () => {
    setSignOutLoading(true);
    signOut();
  };

  const nav = [
    { href: "/admin", label: "Panel", exact: true },
    { href: "/admin/users", label: "Kullanıcılar" },
    { href: "/admin/certificates", label: "Sertifikalar" },
    { href: "/admin/trainings", label: "Eğitimler" },
    { href: "/admin/students", label: "Öğrenciler" },
    { href: "/admin/balances", label: "Bakiye Yönetimi" },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="w-full border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-6">
        {/* Logo-like title */}
        <Link href="/admin" className="select-none">
          <div
            className="font-extrabold text-2xl md:text-3xl inline-block bg-clip-text text-transparent"
            style={{
              backgroundImage: 'var(--purple-transition)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '100% 100%'
            }}
          >
            Admin Panel
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${active
                  ? "bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}

          {/* Referanslar - Direct Link (no dropdown needed for single item) */}
          <Link
            href="/admin/approvals/references"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/admin/approvals')
              ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
              }`}
          >
            Referans Başvuruları
          </Link>

          {/* Settings dropdown */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => {
                setSettingsOpen((v) => !v);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 cursor-pointer ${pathname.startsWith('/admin/settings')
                ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              Ayarlar
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`}>
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {settingsOpen && (
              <div className="absolute mt-2 w-56 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                <Link href="/admin/settings/site" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-600">
                    <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v11.5A2.25 2.25 0 004.25 18h11.5A2.25 2.25 0 0018 15.75V4.25A2.25 2.25 0 0015.75 2H4.25zm4.03 6.28a.75.75 0 00-1.06-1.06L4.97 9.47a.75.75 0 000 1.06l2.25 2.25a.75.75 0 001.06-1.06L6.56 10l1.72-1.72zm4.5-1.06a.75.75 0 10-1.06 1.06L13.44 10l-1.72 1.72a.75.75 0 101.06 1.06l2.25-2.25a.75.75 0 000-1.06l-2.25-2.25z" clipRule="evenodd" />
                  </svg>
                  <span>Site Ayarları</span>
                </Link>
                <Link href="/admin/settings/payments" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-600">
                    <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM3 13.25a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5a.75.75 0 01-.75-.75zm4.75-.75a.75.75 0 000 1.5h3.5a.75.75 0 000-1.5h-3.5z" clipRule="evenodd" />
                  </svg>
                  <span>Ödeme Ayarları</span>
                </Link>
                <Link href="/admin/settings/certificates" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-purple-600">
                    <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" />
                  </svg>
                  <span>Sertifika Ayarları</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="ml-auto">
          <button
            onClick={handleSignOut}
            disabled={signOutLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-700 rounded-lg hover:from-red-700 hover:to-red-800 shadow-md transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {signOutLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Çıkış yapılıyor...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                  <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
                </svg>
                Çıkış Yap
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
