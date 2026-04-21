import React from 'react';

// Clean layout without header/footer for certificate viewing
export default function CertificateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
