'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';

export default function ManagementDashboardPage() {
  const router = useRouter();

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: 0 }}>Management Dashboard</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Overall View of the Process</p>
        </div>
        <Button onClick={() => authService.logout()}>Logout</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        <Card glow>
          <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Total Subjects</h3>
          <p style={{ color: '#3b82f6', fontSize: '2rem', fontWeight: 'bold' }}>142</p>
        </Card>
        <Card glow>
          <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Reports Generated</h3>
          <p style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold' }}>87</p>
        </Card>
        <Card glow>
          <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Pending Submissions</h3>
          <p style={{ color: '#f59e0b', fontSize: '2rem', fontWeight: 'bold' }}>55</p>
        </Card>
      </div>
      
      <Card>
         <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Department Wise Progress</h3>
         <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            [Chart Placeholder]
         </div>
      </Card>
    </div>
  );
}
