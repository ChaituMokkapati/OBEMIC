'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

export default function FacultyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.push('/login');
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  if (!isAuthorized) {
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
        Authenticating session...
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media screen {
          .print-only { 
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
            width: 700px !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        }
        @media print {
          @page { size: A4; margin: 1cm; }
          .print-only { 
            position: relative !important; left: 0 !important; top: 0 !important;
            width: 100% !important; max-width: 100vw !important; opacity: 1 !important;
            display: block !important; overflow: hidden !important; box-sizing: border-box !important;
          }
          .print-only * { max-width: 100% !important; box-sizing: border-box !important; }
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; margin: 0 !important; padding: 0 !important; }
          body::before, body::after { display: none !important; }
          #root-layout { display: block !important; min-height: 0 !important; }
          .no-print { display: none !important; } /* Force again just in case */
          main { padding: 0 !important; max-width: 100vw !important; margin: 0 !important; overflow: hidden !important; }
          /* No flex hacks that override inline styles */
        }
      `}</style>
      <div id="root-layout" style={{ display: 'flex', minHeight: '100vh' }}>
        <div className="no-print"><Sidebar /></div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div className="no-print"><Navbar /></div>
          <main style={{ flex: 1, padding: '32px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
