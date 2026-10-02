'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/admin.service';

export default function VerifyMarksPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      // Management uses the same backend review service to see pending verification items
      const data = await adminService.getPendingReports();
      setReports(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveReport(id);
      alert('Internal Marks Approved Successfully!');
      fetchReports();
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (reason !== null) {
      try {
        await adminService.rejectReport(id, reason || 'Rejected by Management');
        alert('Internal Marks Rejected.');
        fetchReports();
      } catch (err: any) {
        alert(err.message || 'Failed to reject');
      }
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: 0 }}>Verify Internal Marks</h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Review and verify mark calculations submitted by faculty</p>
      </div>
      
      {isLoading ? (
        <Card glow><p style={{ color: '#94a3b8' }}>Loading pending verification items...</p></Card>
      ) : reports.length === 0 ? (
        <Card glow>
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>✅ All caught up! No pending marks to verify right now.</p>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {reports.map(report => (
            <Card key={report.id} glow>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ color: '#f8fafc', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8rem' }}>
                      {report.subject?.subjectCode}
                    </span>
                    {report.subject?.subjectName}
                  </h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                    Faculty: <strong>{report.faculty?.name}</strong> | Academic Year: <strong>{report.academicYear?.year}</strong>
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button style={{ background: '#10B981', color: 'white', border: 'none' }} onClick={() => handleApprove(report.id)}>Approve</Button>
                  <Button style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444' }} onClick={() => handleReject(report.id)}>Reject</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
