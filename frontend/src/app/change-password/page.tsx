'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsLoading(true);
      await authService.changePassword(oldPassword, newPassword);
      // Once successfully changed, clear local storage and redirect to login
      await authService.logout();
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <Card style={{ maxWidth: '400px', width: '100%', padding: '32px' }}>
        <h1 style={{ fontSize: '1.5rem', color: '#f8fafc', marginBottom: '8px', textAlign: 'center' }}>
          Change Password
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'center' }}>
          Secure your account by updating your password.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem' }}>
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem' }}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '0.9rem' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', borderRadius: '8px',
                background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '1rem'
              }}
            />
          </div>

          <Button type="submit" disabled={isLoading} style={{ marginTop: '8px', padding: '14px', width: '100%' }}>
            {isLoading ? 'Updating...' : 'Update Password & Re-login'}
          </Button>
          <button type="button" onClick={() => router.back()} style={{ marginTop: '12px', padding: '12px', width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', borderRadius: '8px', cursor: 'pointer' }}>
            Cancel / Back
          </button>
        </form>
      </Card>
    </div>
  );
}
