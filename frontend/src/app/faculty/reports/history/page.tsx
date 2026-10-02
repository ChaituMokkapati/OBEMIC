'use client';

import React, { useEffect, useState } from 'react';
import { facultyService } from '@/services/faculty.service';
import { ReportHistoryItem } from '@/types/faculty';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

export default function ReportHistoryPage() {
  const [history, setHistory] = useState<ReportHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Feedback modal state
  const [activeFeedback, setActiveFeedback] = useState<{ subject: string; text: string } | null>(null);

  // Submitting state tracker
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const data = await facultyService.getReportHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmitReport = async (reportId: string) => {
    setSubmittingId(reportId);
    try {
      await facultyService.submitReport(reportId);
      await fetchHistory();
    } catch (err: any) {
      alert(err.message || 'Failed to submit report');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleDownload = async (report: ReportHistoryItem) => {
    setDownloadingId(report.id);
    try {
      const blob = await facultyService.downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OBE_Report_${report.subject.subjectCode}_${report.reportType}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      alert(err.message || 'Failed to download report');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '8px' }}>
          Report History & Workflow Status
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Track all generated OBE calculation files, monitor Coordinator review status, and inspect approval feedback.
        </p>
      </div>

      {error && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '16px',
            borderRadius: '12px',
            color: '#fca5a5'
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <Card style={{ padding: '0px', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            Loading report submissions...
          </div>
        ) : history.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            No report history found. Generate an internal, external, or lab report to get started.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.5)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <th style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: '600' }}>Subject</th>
                  <th style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: '600' }}>Report Type</th>
                  <th style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: '600' }}>Generated At</th>
                  <th style={{ padding: '16px 20px', color: '#94a3b8', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', transition: 'background 0.2s ease' }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <p style={{ fontWeight: '700', color: '#f8fafc' }}>
                        {item.subject?.subjectCode || 'N/A'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {item.subject?.subjectName || ''}
                      </p>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#cbd5e1' }}>
                      {item.reportType}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Badge status={item.status} />
                        {item.feedback && (
                          <button
                            onClick={() =>
                              setActiveFeedback({
                                subject: item.subject?.subjectCode,
                                text: item.feedback || ''
                              })
                            }
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#f59e0b',
                              cursor: 'pointer',
                              fontSize: '0.85rem'
                            }}
                            title="View Coordinator Feedback"
                          >
                            💬 Note
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.85rem' }}>
                      {new Date(item.generatedAt).toLocaleDateString()} {new Date(item.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                        <Button
                          variant="secondary"
                          onClick={() => handleDownload(item)}
                          isLoading={downloadingId === item.id}
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        >
                          ⬇ Download
                        </Button>

                        {(item.status === 'GENERATED' || item.status === 'DRAFT' || item.status === 'REJECTED') && (
                          <Button
                            variant="success"
                            onClick={() => handleSubmitReport(item.id)}
                            isLoading={submittingId === item.id}
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            📤 Submit
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Coordinator Review Feedback Modal */}
      <Modal
        isOpen={!!activeFeedback}
        onClose={() => setActiveFeedback(null)}
        title={`Coordinator Feedback • ${activeFeedback?.subject}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              padding: '16px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#f8fafc',
              fontSize: '0.9rem',
              lineHeight: 1.6
            }}
          >
            {activeFeedback?.text}
          </div>
          <Button variant="secondary" onClick={() => setActiveFeedback(null)} style={{ alignSelf: 'flex-end' }}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
}
