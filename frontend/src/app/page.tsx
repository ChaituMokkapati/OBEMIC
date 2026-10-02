'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace('/faculty/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8'
      }}
    >
      Redirecting to OBEMIC Portal...
    </div>
  );
}
