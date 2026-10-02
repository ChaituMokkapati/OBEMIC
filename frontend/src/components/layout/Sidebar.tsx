'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { User } from '@/types/auth';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  let navItems: { label: string, href: string, icon: string }[] = [];

  if (user?.role === 'ADMIN') {
    navItems = [
      { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
      { label: 'Review Reports', href: '/admin/review', icon: '✅' },
      { label: 'System Setup', href: '/admin/setup', icon: '⚙️' },
      { label: 'Survey Management', href: '/admin/surveys', icon: '📝' },
      { label: 'Faculty Management', href: '/admin/faculty', icon: '👨‍🏫' },
      { label: 'Subjects', href: '/admin/subjects', icon: '📖' },
      { label: 'Assignments', href: '/admin/assignments', icon: '🔗' }
    ];
  } else if (user?.role === 'FACULTY') {
    navItems = [
      { label: 'Dashboard', href: '/faculty/dashboard', icon: '📊' },
      { label: 'Assigned Subjects', href: '/faculty/dashboard', icon: '📖' }
    ];
  } else if (user?.role === 'MANAGEMENT') {
    navItems = [
      { label: 'Dashboard', href: '/management/dashboard', icon: '📊' },
      { label: 'Verify Marks', href: '/management/verify', icon: '✅' }
    ];
  }

  return (
    <aside
      style={{
        width: '260px',
        minHeight: '100vh',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 16px',
        position: 'sticky',
        top: 0,
      }}
    >
      <div>
        {/* Brand Logo */}
        <div style={{ padding: '0 12px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/logo.png" 
            alt="OBEMIC" 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
            }}
          />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.02em' }}>
              OBEMIC
            </h2>
            <span style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user?.role || 'Portal'} Panel
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                  boxShadow: isActive ? '0 0 16px rgba(59, 130, 246, 0.15)' : 'none',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <div>
        <button
          onClick={() => authService.logout()}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#f87171',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
          }}
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
