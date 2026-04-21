"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCertificatePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to first step (template selection)
    router.replace('/institution/certificates/create/template');
  }, [router]);
  
  return null;
}

