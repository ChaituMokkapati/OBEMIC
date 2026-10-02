'use client';

import React, { useEffect, useState } from 'react';
import { authService } from '@/services/auth.service';
import { User } from '@/types/auth';

import { useRouter } from 'next/navigation';

export const Navbar: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  return (
    <header
      style={{
        height: '70px',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
          Outcome-Based Education Management System
        </h3>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>
                {user.name || 'Faculty Member'}
              </p>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  color: '#60a5fa',
                  background: 'rgba(59, 130, 246, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}
              >
                {user.role} {user.employeeId ? `• ${user.employeeId}` : ''}
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
                  cursor: 'pointer'
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : 'F'}
              </div>
              {dropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '48px',
                  right: '0',
                  width: '180px',
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  zIndex: 100
                }}>
                  <div
                    onClick={() => { setDropdownOpen(false); router.push('/change-password'); }}
                    style={{ padding: '12px 16px', cursor: 'pointer', color: '#e2e8f0', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Change Password
                  </div>
                  <div
                    onClick={() => { setDropdownOpen(false); authService.logout(); }}
                    style={{ padding: '12px 16px', cursor: 'pointer', color: '#ef4444', fontSize: '0.9rem' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
