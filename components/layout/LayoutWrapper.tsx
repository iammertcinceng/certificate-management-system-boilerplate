"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '../header/Header';
import Footer from '../footer/Footer';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

// Sayfalar için header/footer konfigürasyonu
const layoutConfig = {
  // Header gizlenecek sayfalar
  hideHeader: [
    '/payment',
    '/checkout',
    '/admin'
  ],

  // Footer gizlenecek sayfalar  
  hideFooter: [
    '/login',
    '/register',
    '/payment',
    '/checkout',
    '/admin',
    '/institution/certificates/create'
  ]
};

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pathname'e göre header/footer gösterilip gösterilmeyeceğini kontrol et
  const shouldShowHeader = !layoutConfig.hideHeader.some(path => pathname.startsWith(path));
  const shouldShowFooter = !layoutConfig.hideFooter.some(path => pathname.startsWith(path));

  return (
    <div className="min-h-screen flex flex-col">
      {(mounted && shouldShowHeader) && <Header />}
      <main className={`flex-1 ${mounted && !shouldShowHeader ? 'pt-0' : ''}`}>
        {children}
      </main>
      {(mounted && shouldShowFooter) && <Footer />}
    </div>
  );
}
