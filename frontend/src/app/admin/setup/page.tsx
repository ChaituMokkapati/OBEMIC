'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dropzone } from '@/components/ui/Dropzone';
import { adminService } from '@/services/admin.service';
import { toast } from 'react-hot-toast';

type Tab = 'CO' | 'STAFF' | 'PO' | 'ATTAINMENT';

export default function AdminSetupPage() {
  const [activeTab, setActiveTab] = useState<Tab>('CO');
  
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  // Attainment Target States
  const [attainmentConfig, setAttainmentConfig] = useState<any>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(65);
  const [reason, setReason] = useState<string>('');
  const [isSavingAttainment, setIsSavingAttainment] = useState(false);
  const [loadingAttainment, setLoadingAttainment] = useState(false);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setFile(null);
    setPreviewData(null);
    if (tab === 'ATTAINMENT') {
      loadAttainmentConfig();
    }
  };

  const loadAttainmentConfig = async (deptId?: string) => {
    setLoadingAttainment(true);
    try {
      const data = await adminService.getAttainmentConfig(deptId);
      setAttainmentConfig(data);
      setSelectedDeptId(data.departmentId);
      setThreshold(data.threshold || 65);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load attainment config');
    } finally {
      setLoadingAttainment(false);
    }
  };

  const handleSaveAttainment = async () => {
    if (!selectedDeptId) return toast.error('Please select a department');
    if (threshold < 0 || threshold > 100) return toast.error('Threshold must be between 0 and 100%');

    setIsSavingAttainment(true);
    try {
      const res = await adminService.updateAttainmentConfig({
        departmentId: selectedDeptId,
        threshold,
        reason: reason.trim() || undefined
      });
      toast.success(res.message || 'Attainment target saved successfully!');
      setReason('');
      await loadAttainmentConfig(selectedDeptId);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save attainment configuration');
    } finally {
      setIsSavingAttainment(false);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    setIsProcessing(true);
    setPreviewData(null);
    try {
      let result;
      if (activeTab === 'CO') result = await adminService.previewCourseOutcomes(file);
      else if (activeTab === 'STAFF') result = await adminService.previewStaff(file);
      else {
        toast.error('PO Upload preview not implemented yet.');
        setIsProcessing(false);
        return;
      }
      setPreviewData(result);
      toast.success('Preview generated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to preview file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;
    setIsProcessing(true);
    try {
      if (activeTab === 'CO') await adminService.confirmCourseOutcomes(previewData);
      else if (activeTab === 'STAFF') await adminService.confirmStaff(previewData);
      toast.success('Upload confirmed and saved successfully to database!');
      setFile(null);
      setPreviewData(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to confirm');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPreviewTable = () => {
    if (!previewData) return null;
    
    let items: any[] = [];
    let isErrorState = false;

    try {
      const payload = (typeof previewData === 'string') ? JSON.parse(previewData) : previewData;
      const actualPayload = payload.batchId ? payload : (payload.data?.batchId ? payload.data : payload);
      
      const invalidBlocks = actualPayload.invalidBlocks || [];
      const validBlocks = actualPayload.validBlocks || [];
      const allBlocks = [...invalidBlocks, ...validBlocks];
      
      if (allBlocks.length > 0) {
        allBlocks.forEach((b: any) => {
          if (b.courseOutcomes && Array.isArray(b.courseOutcomes) && b.courseOutcomes.length > 0) {
            b.courseOutcomes.forEach((co: any) => {
              items.push({
                Subject: b.normalizedSubjectCode || b.subjectCode,
                Name: b.subjectName,
                CO: co.coCode,
                Description: co.description,
                POs: JSON.stringify(co.poMatrix || {}),
                Status: (b.action === 'CONTEXT_CONFLICT' || co.action === 'CO_CONTENT_CONFLICT') ? '[Conflict]' : '[Ready]',
                Issues: b.issues && b.issues.length > 0 ? b.issues.join(' | ') : ''
              });
            });
          } else {
            items.push({
              Subject: b.normalizedSubjectCode || b.subjectCode,
              Name: b.subjectName,
              CO: 'N/A',
              Description: 'No COs found',
              POs: 'N/A',
              Status: '[' + (b.action || 'FAILED') + ']',
              Issues: b.issues && b.issues.length > 0 ? b.issues.join(' | ') : ''
            });
          }
        });
      } else if (actualPayload.validRecords || actualPayload.invalidRecords) {
        const inv = (actualPayload.invalidRecords || []).map((r: any) => ({ ...r, __isInvalid: true }));
        const val = (actualPayload.validRecords || []).map((r: any) => ({ ...r, __isInvalid: false }));
        items = [...inv, ...val];
      }

      if (actualPayload.canConfirm === false) {
        isErrorState = true;
      }
    } catch {
      return <div style={{ color: '#ef4444' }}>Error parsing preview payload</div>;
    }

    if (items.length === 0) {
      return <p style={{ color: '#94a3b8' }}>No records parsed.</p>;
    }

    const headers = Object.keys(items[0]).filter(k => !k.startsWith('__'));

    return (
      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid #334155', borderRadius: '4px' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead style={{ background: '#1e293b', position: 'sticky', top: 0 }}>
              <tr>
                {headers.map(h => (
                  <th key={h} style={{ padding: '8px 12px', borderBottom: '1px solid #334155', color: '#94a3b8' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1e293b', background: row.__isInvalid ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
                  {headers.map(h => (
                    <td key={h} style={{ padding: '8px 12px', color: row.__isInvalid ? '#fca5a5' : '#f8fafc' }}>
                      {typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {isErrorState ? (
              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                Conflicts or validation errors detected. Review issues before proceeding.
              </span>
            ) : (
              <span style={{ color: '#10B981', fontWeight: 'bold' }}>
                Valid: {items.length} records ready for import
              </span>
            )}
          </div>
          <Button 
            onClick={handleConfirm} 
            isLoading={isProcessing} 
            disabled={isErrorState}
            style={{ 
              padding: '10px 24px', 
              background: isErrorState ? '#475569' : '#10B981', 
              color: 'white', 
              fontWeight: 'bold',
              cursor: isErrorState ? 'not-allowed' : 'pointer'
            }}
          >
            {isErrorState ? 'Fix Errors Before Saving' : 'Confirm & Save to Database'}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', margin: 0 }}>System Configuration</h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Configure Curriculum, Staff Rosters & Attainment Targets</p>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #334155', flexWrap: 'wrap' }}>
        <button 
          onClick={() => handleTabChange('CO')}
          style={{ padding: '12px 20px', background: activeTab === 'CO' ? 'rgba(59,130,246,0.1)' : 'transparent', color: activeTab === 'CO' ? '#60a5fa' : '#94a3b8', border: 'none', borderBottom: activeTab === 'CO' ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer', fontWeight: '600' }}
        >
          COs Upload
        </button>
        <button 
          onClick={() => handleTabChange('STAFF')}
          style={{ padding: '12px 20px', background: activeTab === 'STAFF' ? 'rgba(59,130,246,0.1)' : 'transparent', color: activeTab === 'STAFF' ? '#60a5fa' : '#94a3b8', border: 'none', borderBottom: activeTab === 'STAFF' ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer', fontWeight: '600' }}
        >
          Staff Upload
        </button>
        <button 
          onClick={() => handleTabChange('PO')}
          style={{ padding: '12px 20px', background: activeTab === 'PO' ? 'rgba(59,130,246,0.1)' : 'transparent', color: activeTab === 'PO' ? '#60a5fa' : '#94a3b8', border: 'none', borderBottom: activeTab === 'PO' ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer', fontWeight: '600' }}
        >
          POs & PSOs Upload
        </button>
        <button 
          onClick={() => handleTabChange('ATTAINMENT')}
          style={{ padding: '12px 20px', background: activeTab === 'ATTAINMENT' ? 'rgba(59,130,246,0.1)' : 'transparent', color: activeTab === 'ATTAINMENT' ? '#60a5fa' : '#94a3b8', border: 'none', borderBottom: activeTab === 'ATTAINMENT' ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer', fontWeight: '600' }}
        >
          Target Attainment
        </button>
      </div>

      {activeTab === 'ATTAINMENT' ? (
        <Card glow>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ color: '#f8fafc', margin: 0 }}>Department Attainment Target</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '4px' }}>
                Define the benchmark percentage required for Course Outcome attainment in your department.
              </p>
            </div>
            {attainmentConfig?.isDepartmentScoped && (
              <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.4)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600' }}>
                Scoped to {attainmentConfig.departmentName}
              </span>
            )}
          </div>

          {loadingAttainment ? (
            <p style={{ color: '#94a3b8' }}>Loading attainment configuration...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Department Selection */}
              <div>
                <label style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                  Target Department
                </label>
                {attainmentConfig?.isDepartmentScoped ? (
                  <input 
                    type="text" 
                    value={attainmentConfig.departmentName} 
                    disabled 
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#94a3b8', border: '1px solid #334155', cursor: 'not-allowed' }}
                  />
                ) : (
                  <select 
                    value={selectedDeptId} 
                    onChange={e => {
                      setSelectedDeptId(e.target.value);
                      loadAttainmentConfig(e.target.value);
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
                  >
                    {attainmentConfig?.departments?.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.departmentName}</option>
                    ))}
                  </select>
                )}
                {attainmentConfig?.isDepartmentScoped && (
                  <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>
                    As department administrator, you are authorized to adjust attainment targets solely for your assigned department.
                  </p>
                )}
              </div>

              {/* Target Slider & Value */}
              <div style={{ background: '#0f172a', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '1rem' }}>
                    Attainment Target Benchmark (%)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#38bdf8' }}>{threshold}%</span>
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8', background: '#1e293b', padding: '4px 10px', borderRadius: '6px', border: '1px solid #475569' }}>
                      {(3 * (threshold / 100)).toFixed(2)} / 3.00 Scale
                    </span>
                  </div>
                </div>

                <input 
                  type="range" 
                  min="40" 
                  max="90" 
                  step="1" 
                  value={threshold} 
                  onChange={e => setThreshold(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
                />

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                  {[60, 65, 70, 75].map(val => (
                    <button
                      key={val}
                      onClick={() => setThreshold(val)}
                      type="button"
                      style={{
                        padding: '6px 14px',
                        background: threshold === val ? '#38bdf8' : '#1e293b',
                        color: threshold === val ? '#0f172a' : '#cbd5e1',
                        border: '1px solid #475569',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.85rem'
                      }}
                    >
                      {val}% ({(3 * (val / 100)).toFixed(2)})
                    </button>
                  ))}
                </div>
              </div>

              {/* Adjustment Reason */}
              <div>
                <label style={{ color: '#cbd5e1', fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                  Reason for Target Adjustment (Optional)
                </label>
                <input 
                  type="text" 
                  value={reason} 
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g., Department Academic Advisory revision for NBA compliance"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#0f172a', color: '#fff', border: '1px solid #334155' }}
                />
              </div>

              <Button 
                onClick={handleSaveAttainment} 
                isLoading={isSavingAttainment}
                style={{ width: '100%', padding: '12px', background: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
              >
                Save Attainment Target for {attainmentConfig?.departmentName}
              </Button>

              {/* Change History */}
              {attainmentConfig?.history && attainmentConfig.history.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Recent Target Adjustment History
                  </h4>
                  <div style={{ background: '#0f172a', borderRadius: '8px', border: '1px solid #1e293b', overflow: 'hidden' }}>
                    {attainmentConfig.history.map((h: any, i: number) => (
                      <div key={h.id || i} style={{ padding: '10px 14px', borderBottom: i < attainmentConfig.history.length - 1 ? '1px solid #1e293b' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{h.newThreshold}%</span>
                          {h.oldThreshold !== null && <span style={{ color: '#64748b' }}> (from {h.oldThreshold}%)</span>}
                          {h.reason && <span style={{ color: '#94a3b8', marginLeft: '10px' }}> - {h.reason}</span>}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                          {h.user?.name || 'Admin'} • {new Date(h.changedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      ) : (
        <Card glow>
          <h3 style={{ color: '#f8fafc', marginTop: 0 }}>
            {activeTab === 'CO' ? 'Upload CO-PO Matrix' : activeTab === 'STAFF' ? 'Upload Faculty Roster' : 'Upload Program Outcomes'}
          </h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '16px' }}>
            {activeTab === 'CO' ? 'Upload the Excel file containing Course Outcomes for your subjects.' : 
             activeTab === 'STAFF' ? 'Upload an Excel or CSV file containing faculty details (Name, Email, Employee ID) to onboard them.' : 
             'Upload the master definitions for POs, PSOs, and PEOs.'}
          </p>

          {!previewData && (
            <>
              <Dropzone
                selectedFile={file}
                onFileSelect={setFile}
                onClear={() => setFile(null)}
                title={`Upload ${activeTab} Data`}
                subtitle="Drag & drop your Excel/CSV file here"
              />
              <Button onClick={handlePreview} isLoading={isProcessing} disabled={!file} style={{ width: '100%', marginTop: '16px' }}>
                Process & Preview
              </Button>
            </>
          )}

          {previewData && (
            <div style={{ marginTop: '24px', background: 'rgba(15,23,42,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ color: '#f8fafc', margin: 0 }}>Data Preview</h4>
                <button onClick={() => setPreviewData(null)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              </div>
              {renderPreviewTable()}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
