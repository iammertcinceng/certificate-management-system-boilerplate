"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ProtectedShellProps {
  children: React.ReactNode;
}

export default function ProtectedShell({ children }: ProtectedShellProps) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {children}
      </div>
    </div>
  );
}
