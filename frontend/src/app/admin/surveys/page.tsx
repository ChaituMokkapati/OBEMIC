'use client';
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { adminService } from '@/services/admin.service';

export default function SurveyManagementPage() {
  const router = useRouter();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [surveyData, yearData] = await Promise.all([
        adminService.getSurveys(),
        adminService.getAcademicYears()
      ]);
      setSurveys(surveyData);
      setAcademicYears(yearData);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleToggle = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === 'OPEN') await adminService.closeSurvey(id);
      else await adminService.openSurvey(id);
      fetchData();
    } catch (e: any) { alert(e.message || 'Error toggling survey'); }
  };

  const handleCreate = async () => {
    if (!newTitle || !selectedYear || !selectedSem) return alert('Please fill all fields');
    setIsCreating(true);
    try {
      await adminService.createSurvey({ title: newTitle, academicYearId: selectedYear, semesterId: selectedSem });
      setNewTitle('');
      setSelectedYear('');
      setSelectedSem('');
      alert('Survey created successfully!');
      fetchData();
    } catch (e: any) {
      alert(e.message || 'Error creating survey');
    } finally {
      setIsCreating(false);
    }
  };

  const copyShareLink = async (surveyId: string) => {
    try {
      const link = `${window.location.origin}/survey/${surveyId}`;
      await navigator.clipboard.writeText(link);
      setCopiedId(surveyId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
      // Fallback for older browsers or insecure contexts
      alert(`Share link: ${window.location.origin}/survey/${surveyId}`);
    }
  };

  // Prepare Dropdown Options
  const yearOptions = academicYears.map(y => ({ value: y.id, label: y.year }));
  
  // Find semesters for the selected academic year
  const activeYearObj = academicYears.find(y => y.id === selectedYear);
  const semOptions = activeYearObj?.semesters 
    ? activeYearObj.semesters.map((s: any) => ({ value: s.id, label: `Semester ${s.semester}` })) 
    : [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <button onClick={() => router.push('/admin/dashboard')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#e2e8f0', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>&larr; Back</button>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: 0 }}>Survey Management</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Create and manage Course Exit Surveys</p>
        </div>
      </div>
      
      {/* CREATE SURVEY SECTION */}
      <Card glow style={{ position: 'relative', zIndex: 20 }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#10B981', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>📝</span> Create New Survey
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.9rem' }}>Survey Title</label>
            <input 
              type="text" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Spring 2026 Course Exit Survey" 
              style={{ width: '100%', padding: '10px 14px', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid #334155', borderRadius: '8px', color: 'white', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.9rem' }}>Academic Year</label>
            <SearchableSelect options={yearOptions} value={selectedYear} onChange={setSelectedYear} placeholder="Select Year" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '0.9rem' }}>Semester</label>
            <SearchableSelect options={semOptions} value={selectedSem} onChange={setSelectedSem} placeholder="Select Sem" />
          </div>
          <div>
            <Button onClick={handleCreate} isLoading={isCreating} style={{ background: '#10B981', color: 'white', border: 'none', height: '42px' }}>
              Create Survey
            </Button>
          </div>
        </div>
      </Card>

      {/* SURVEYS LIST */}
      <Card glow>
        <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc' }}>Active Surveys</h3>
        {isLoading ? <p style={{ color: '#94a3b8' }}>Loading surveys...</p> : surveys.length === 0 ? <p style={{ color: '#94a3b8' }}>No surveys found.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: '#f8fafc' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', background: 'rgba(59,130,246,0.1)' }}>
                  <th style={{ padding: '12px 16px' }}>Survey Title</th>
                  <th style={{ padding: '12px 16px' }}>Semester (Year)</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Responses</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{s.title}</td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{s.semester?.semester} ({s.academicYear?.year})</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', background: s.status === 'OPEN' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: s.status === 'OPEN' ? '#10B981' : '#ef4444' }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#60a5fa', fontWeight: 'bold' }}>{s._count?.responses || 0}</td>
                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => copyShareLink(s.id)}
                        title="Copy Share Link"
                        style={{ 
                          background: copiedId === s.id ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)', 
                          border: copiedId === s.id ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(59,130,246,0.3)', 
                          color: copiedId === s.id ? '#10B981' : '#60a5fa', 
                          padding: '6px 12px', 
                          borderRadius: '6px', 
                          cursor: 'pointer', 
                          fontSize: '0.85rem',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {copiedId === s.id ? '✓ Copied!' : '🔗 Share Link'}
                      </button>
                      <Button 
                        onClick={() => handleToggle(s.id, s.status)}
                        style={{ 
                          background: 'transparent', 
                          border: s.status === 'OPEN' ? '1px solid #ef4444' : '1px solid #10B981', 
                          color: s.status === 'OPEN' ? '#ef4444' : '#10B981',
                          padding: '6px 12px',
                          fontSize: '0.85rem'
                        }}
                      >
                        {s.status === 'OPEN' ? 'Close Survey' : 'Reopen Survey'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
