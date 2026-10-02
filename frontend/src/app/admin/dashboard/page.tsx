'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { adminService } from '@/services/admin.service';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminService.getDashboardStats()
      .then(data => {
        setStats(data);
      })
      .catch(err => {
        console.error('Failed to load stats', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: 0 }}>Admin / Coordinator Dashboard</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Manage System Data & Review Reports</p>
        </div>
        <Button onClick={() => authService.logout()}>Logout</Button>
      </div>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '10px' }}>
        <Card>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Faculty</p>
          <h2 style={{ margin: '8px 0 0 0', color: '#f8fafc', fontSize: '2rem' }}>{isLoading ? '-' : stats?.totalFaculty || 0}</h2>
        </Card>
        <Card>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Subjects</p>
          <h2 style={{ margin: '8px 0 0 0', color: '#f8fafc', fontSize: '2rem' }}>{isLoading ? '-' : stats?.totalSubjects || 0}</h2>
        </Card>
        <Card>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Reports</p>
          <h2 style={{ margin: '8px 0 0 0', color: '#f8fafc', fontSize: '2rem' }}>{isLoading ? '-' : stats?.pendingReports || 0}</h2>
        </Card>
        <Card>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Surveys</p>
          <h2 style={{ margin: '8px 0 0 0', color: '#f8fafc', fontSize: '2rem' }}>{isLoading ? '-' : stats?.activeSurveys || 0}</h2>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <Card glow>
          <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Review Reports (Coordinator)</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
             Review and approve reports submitted by faculty members.
          </p>
          <Button style={{ marginTop: '16px' }} onClick={() => router.push('/admin/review')}>Go to Review Section</Button>
        </Card>

        <Card glow>
          <h3 style={{ color: '#f8fafc', marginTop: 0 }}>System Configuration (Admin)</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
             Upload Course Outcomes, update PO mappings, and manage users.
          </p>
          <Button style={{ marginTop: '16px' }} onClick={() => router.push('/admin/setup')}>Manage Setup</Button>
        </Card>

        <Card glow>
          <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Survey Management</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
             Create Indirect Surveys, define timeframes, and toggle OPEN/CLOSE status.
          </p>
          <Button style={{ marginTop: '16px' }} onClick={() => router.push('/admin/surveys')}>Manage Surveys</Button>
        </Card>

        <Card glow>
          <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Faculty Management</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
             Onboard new faculty members and assign subjects & sections.
          </p>
          <Button style={{ marginTop: '16px' }} onClick={() => router.push('/admin/faculty')}>Manage Faculty</Button>
        </Card>
      </div>
    </div>
  );
}
