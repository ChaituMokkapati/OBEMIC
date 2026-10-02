'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please enter your Employee ID / Email and Password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Determine if identifier is email or employeeId
      const isEmail = identifier.includes('@');
      const credentials = isEmail
        ? { email: identifier, password }
        : { employeeId: identifier, password };

      const res = await authService.login(credentials);
      
      // Route based on user role
      if (res.user.role === 'FACULTY') {
        router.push('/faculty/dashboard');
      } else if (res.user.role === 'ADMIN' || res.user.role === 'COORDINATOR') {
        router.push('/admin/dashboard');
      } else if (res.user.role === 'MANAGEMENT') {
        router.push('/management/dashboard');
      } else {
        router.push('/faculty/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <img 
            src="/logo.png" 
            alt="OBEMIC Logo" 
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              marginBottom: '16px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
          />
          <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            OBEMIC Portal
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Sign in to access your OBE calculation and attainment engine
          </p>
        </div>

        {/* Login Card */}
        <Card glow>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  color: '#fca5a5',
                  fontSize: '0.85rem'
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <Input
              label="Employee ID or Email"
              placeholder="e.g. FAC001 or faculty@mic.edu.in"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              isLoading={isLoading}
              style={{ width: '100%', marginTop: '8px', padding: '13px' }}
            >
              Sign In to Dashboard
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.8rem', color: '#64748b' }}>
          Outcome-Based Education Management System • DVR & Dr. HS MIC College
        </p>
      </div>
    </div>
  );
}
