'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { facultyService } from '@/services/faculty.service';
import { FacultyDashboardData, AssignedSubject } from '@/types/faculty';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AttainmentDonutChart } from '@/components/ui/Charts';

export default function FacultyDashboard() {
  const router = useRouter();
  const [data, setData] = useState<FacultyDashboardData | null>(null);
  const [subjects, setSubjects] = useState<AssignedSubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [dashData, subjectList] = await Promise.all([
          facultyService.getDashboardData(),
          facultyService.getAssignedSubjects()
        ]);
        setData(dashData);
        setSubjects(subjectList);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return <div style={{ color: '#94a3b8' }}>Loading dashboard...</div>;
  }

  if (error) {
    return <div style={{ color: '#ef4444' }}>{error}</div>;
  }

  const assignedCount = data?.stats.totalSubjects || 0;
  const reportsCount = data?.stats.totalReportsGenerated || 0;
  // Approximation of pending vs assigned based on reports vs subjects (simplified logic)
  const completedSubjects = Math.min(assignedCount, Math.floor(reportsCount / 2)); // assume internal+external per subject

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
            Faculty Dashboard
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            Manage course attainments and outcome evaluations
          </p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Chart Card */}
        <Card>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#f8fafc' }}>Attainment Status</h3>
          <div style={{ display: 'flex', alignItems: 'center', height: '180px' }}>
            <div style={{ width: '130px', height: '130px', margin: '0 auto' }}>
              <AttainmentDonutChart assigned={completedSubjects} pending={assignedCount - completedSubjects} />
            </div>
            <div style={{ flex: 1, fontSize: '0.95rem', color: '#cbd5e1' }}>
              <p style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#1e73be', borderRadius: '3px' }}></span>
                Assigned: <strong style={{ color: '#f8fafc' }}>{completedSubjects}</strong>
              </p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#cf2c31', borderRadius: '3px' }}></span>
                Pending: <strong style={{ color: '#f8fafc' }}>{assignedCount - completedSubjects}</strong>
              </p>
            </div>
          </div>
        </Card>

        {/* Static Milestone Card (Replacing Syllabus) */}
        <Card>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#f8fafc' }}>Workflow Progress</h3>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '180px', alignItems: 'center' }}>
            <h2 style={{ fontSize: '3.5rem', color: '#3b82f6', margin: '0 0 10px 0', fontWeight: '800' }}>
              {assignedCount > 0 ? Math.round((completedSubjects / assignedCount) * 100) : 0}%
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Average attainment completion across your subjects</p>
          </div>
        </Card>

      </div>

      {/* Subjects Grid */}
      <div>
        <h2 style={{ fontSize: '1.5rem', color: '#f8fafc', marginBottom: '20px', fontWeight: '700' }}>Assigned Subjects</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {subjects.map((sub) => {
            const hasMarks = sub.progressState.direct || sub.progressState.indirect; // simple heuristic
            
            return (
              <Card 
                key={sub.assignmentId} 
                glow 
                style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}
              >
                <div 
                  onClick={() => router.push(`/faculty/subjects/${sub.subjectId}`)}
                  style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <div style={{ padding: '24px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                      <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '12px', borderRadius: '12px', color: '#3b82f6' }}>
                        📚
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: '#f8fafc', fontWeight: '700' }}>
                          {sub.subjectName}
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>{sub.subjectCode}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎓</span> Regulation: MIC-23
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📅</span> Sem: {sub.semester} &bull; AY: {sub.academicYear}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🏢</span> {sub.department} &bull; {sub.credits} Credits
                      </div>
                    </div>
                  </div>

                  <div style={{ 
                    padding: '16px 24px', 
                    background: 'rgba(15, 23, 42, 0.4)', 
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                      <span style={{ 
                        width: '8px', height: '8px', borderRadius: '50%', 
                        background: hasMarks ? '#10b981' : '#64748b' 
                      }}></span>
                      <span style={{ color: hasMarks ? '#10b981' : '#94a3b8' }}>
                        {hasMarks ? 'Marks Entered' : 'Pending Entry'}
                      </span>
                    </div>
                    <span style={{ color: '#3b82f6', fontSize: '0.85rem', fontWeight: '600' }}>View Details &rarr;</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
