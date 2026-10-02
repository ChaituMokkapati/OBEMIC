'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/admin.service';
import { authService } from '@/services/auth.service';

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  

  const fetchSubjects = async () => {
    setIsLoading(true);
    try {
      const user = authService.getCurrentUser();
      const data = await adminService.getSubjects(user?.departmentId);
      setSubjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: 0 }}>Manage Subjects</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Overview of academic subjects in your department</p>
        </div>
        
      </div>

      <Card glow>
        {isLoading ? (
          <p style={{ color: '#94a3b8' }}>Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No subjects found in your department.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: '#f8fafc' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '12px' }}>Code</th>
                <th style={{ padding: '12px' }}>Subject Name</th>
                <th style={{ padding: '12px' }}>Semester</th>
                <th style={{ padding: '12px' }}>Credits</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                      {s.subjectCode}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{s.subjectName}</td>
                  <td style={{ padding: '12px' }}>Sem {s.semesterLevel || '?'}</td>
                  <td style={{ padding: '12px' }}>{s.credits || '-'}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <Button style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => alert('Edit subject coming soon!')}>Edit</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
