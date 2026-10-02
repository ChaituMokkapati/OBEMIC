'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/admin.service';
import { authService } from '@/services/auth.service';

export default function AssignmentsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Map to hold selected faculty for each subject
  const [selections, setSelections] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const user = authService.getCurrentUser();
        // Fetch only subjects from this Admin's department
        const fetchedSubjects = await adminService.getSubjects(user?.departmentId);
        
        // Fetch ALL faculty across the entire college for cross-department assigning
        const fetchedFaculty = await adminService.getFacultyList();

        setSubjects(fetchedSubjects);
        setFaculty(fetchedFaculty);

        // Pre-fill selections if a subject already has an active assignment
        // (Assuming backend might return current assignment if mapped, but if not we leave it blank)
        const initialSelections: Record<string, string> = {};
        fetchedSubjects.forEach(s => {
          if (s.facultyId) {
            initialSelections[s.id] = s.facultyId;
          }
        });
        setSelections(initialSelections);
      } catch (err) {
        console.error('Error fetching assignment data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectChange = (subjectId: string, facultyId: string) => {
    setSelections(prev => ({ ...prev, [subjectId]: facultyId }));
  };

  const handleSave = async (subjectId: string) => {
    const facultyId = selections[subjectId];
    if (!facultyId) return alert('Please select a faculty member first.');
    
    setSavingId(subjectId);
    try {
      // Typically requires an Academic Year ID. For now we pass a placeholder or get it from context.
      await adminService.assignFaculty(subjectId, facultyId, 'clz0n99c8000213q20c5879a9'); 
      alert('Assignment saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to assign faculty');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: 0 }}>Faculty - Subject Assignments</h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Assign faculty from any department to your subjects</p>
      </div>

      <Card glow>
        {isLoading ? (
          <p style={{ color: '#94a3b8' }}>Loading assignment matrix...</p>
        ) : subjects.length === 0 ? (
          <p style={{ color: '#94a3b8' }}>No subjects found in your department.</p>
        ) : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: '#f8fafc' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th style={{ padding: '12px' }}>Code</th>
                <th style={{ padding: '12px' }}>Subject</th>
                <th style={{ padding: '12px' }}>Semester</th>
                <th style={{ padding: '12px' }}>Assigned Faculty</th>
                <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(sub => (
                <tr key={sub.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                      {sub.subjectCode}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: '600' }}>{sub.subjectName}</td>
                  <td style={{ padding: '12px' }}>Sem {sub.semesterLevel || '?'}</td>
                  <td style={{ padding: '12px' }}>
                    <select 
                      value={selections[sub.id] || ''} 
                      onChange={(e) => handleSelectChange(sub.id, e.target.value)}
                      style={{
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid #334155',
                        color: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        width: '100%',
                        maxWidth: '250px'
                      }}
                    >
                      <option value="">— Unassigned —</option>
                      {faculty.map(fac => (
                        <option key={fac.id} value={fac.id}>
                          {fac.name} ({fac.department?.departmentName || 'No Dept'})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <Button 
                      onClick={() => handleSave(sub.id)}
                      isLoading={savingId === sub.id}
                      disabled={savingId === sub.id}
                      style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    >
                      Save
                    </Button>
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
