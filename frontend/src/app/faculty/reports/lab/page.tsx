'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { facultyService } from '@/services/faculty.service';
import { AssignedSubject } from '@/types/faculty';
import { Card } from '@/components/ui/Card';
import { Dropzone } from '@/components/ui/Dropzone';
import { Button } from '@/components/ui/Button';

export default function LabReportPage() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [subjects, setSubjects] = useState<AssignedSubject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState(initialCode);
  const [file, setFile] = useState<File | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHistoryId, setGeneratedHistoryId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const list = await facultyService.getAssignedSubjects();
        setSubjects(list);
        if (!selectedSubject && list.length > 0) {
          setSelectedSubject(list[0].subjectCode);
        }
      } catch (err: any) {
        console.error('Failed to load assigned subjects:', err);
      }
    }
    fetchSubjects();
  }, [selectedSubject]);

  const handleGenerate = async () => {
    if (!file) {
      setError('Please upload the Lab Marks Excel template.');
      return;
    }
    if (!selectedSubject) {
      setError('Please select a subject.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMsg(null);
    setSubmitted(false);

    try {
      const { blob, historyId } = await facultyService.generateLabReport(file, selectedSubject);
      
      if (historyId) {
        setGeneratedHistoryId(historyId);
      }

      // Automatically trigger browser download of the verified Excel report
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Generated_Lab_OBE_Report_${selectedSubject}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      setSuccessMsg(`Lab OBE Report for ${selectedSubject} generated and downloaded successfully!`);
    } catch (err: any) {
      setError(err.message || 'Error occurred while generating Lab report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!generatedHistoryId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await facultyService.submitReport(generatedHistoryId);
      setSubmitted(true);
      setSuccessMsg(`Report successfully submitted to Coordinator for review!`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report for review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h1 style={{ fontSize: '1.8rem', color: '#f8fafc', marginBottom: '8px' }}>
          Lab Marks OBE Generator
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Upload single unified Lab marks Excel workbook (Day-to-day continuous evaluation + Internal Lab Exam + External Lab Exam) to compute 100% direct lab attainment.
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

      {successMsg && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '16px',
            borderRadius: '12px',
            color: '#6ee7b7'
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      <Card glow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Subject Selector */}
          <div>
            <label
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#94a3b8',
                marginBottom: '8px',
                display: 'block'
              }}
            >
              Select Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '10px',
                color: '#f8fafc',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            >
              {subjects.length === 0 ? (
                <option value="">No assigned subjects found</option>
              ) : (
                subjects.map((sub) => (
                  <option key={sub.assignmentId} value={sub.subjectCode}>
                    {sub.subjectCode} - {sub.subjectName} ({sub.department}, Sem: {sub.semester})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Excel File Dropzone */}
          <div>
            <label
              style={{
                fontSize: '0.85rem',
                fontWeight: '600',
                color: '#94a3b8',
                marginBottom: '8px',
                display: 'block'
              }}
            >
              Upload Lab Marks Excel
            </label>
            <Dropzone
              selectedFile={file}
              onFileSelect={(selected) => setFile(selected)}
              onClear={() => setFile(null)}
              title="Upload Lab Marks Workbook (.xlsx)"
              subtitle="Unified single-file template containing Day-to-Day + Lab Exam marks"
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
            <Button
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={!file || !selectedSubject}
              style={{ flex: 1 }}
            >
              🚀 Generate & Download Lab Report
            </Button>

            {generatedHistoryId && !submitted && (
              <Button
                variant="success"
                onClick={handleSubmitForReview}
                isLoading={isSubmitting}
              >
                📤 Submit for Review
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
