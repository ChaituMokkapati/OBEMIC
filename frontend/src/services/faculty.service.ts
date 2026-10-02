import { api } from './apiClient';
import { 
  AssignedSubject, 
  FacultyDashboardData, 
  ReportHistoryItem,
  CourseOutcome,
  ProgramOutcome,
  IndirectSurveyStudent,
  DirectAssessmentData,
  ProgressState
} from '../types/faculty';

export const facultyService = {
  getAssignedSubjects: async (): Promise<AssignedSubject[]> => {
    const res = await api.get('/faculty/subjects');
    if (!res.ok) throw new Error('Failed to fetch assigned subjects');
    return res.json();
  },

  getDashboardData: async (): Promise<FacultyDashboardData> => {
    const res = await api.get('/faculty/dashboard');
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  },

  // --- Wizard Endpoints ---
  
  getSubjectCOs: async (subjectId: string): Promise<CourseOutcome[]> => {
    const res = await api.get(`/faculty/subjects/${subjectId}/cos`);
    if (!res.ok) throw new Error('Failed to fetch Course Outcomes');
    return res.json();
  },

  getPOs: async (departmentId: string): Promise<{pos: ProgramOutcome[], peos: ProgramOutcome[], psos: ProgramOutcome[]}> => {
    const res = await api.get(`/faculty/subjects/placeholder/pos?departmentId=${departmentId}`);
    if (!res.ok) throw new Error('Failed to fetch Program Outcomes');
    return res.json();
  },

  getIndirectAssessment: async (subjectId: string): Promise<IndirectSurveyStudent[]> => {
    const res = await api.get(`/faculty/subjects/${subjectId}/indirect-assessment`);
    if (!res.ok) throw new Error('Failed to fetch Indirect Assessment');
    return res.json();
  },

  getDirectAssessment: async (subjectId: string): Promise<DirectAssessmentData> => {
    const res = await api.get(`/faculty/subjects/${subjectId}/direct-assessment`);
    if (!res.ok) throw new Error('Failed to fetch Direct Assessment');
    return res.json();
  },

  getCOPOMapping: async (subjectId: string): Promise<any> => {
    const res = await api.get(`/faculty/subjects/${subjectId}/copo`);
    if (!res.ok) throw new Error('Failed to fetch CO-PO Mapping');
    return res.json();
  },

  updateProgress: async (subjectId: string, progress: Partial<ProgressState>): Promise<ProgressState> => {
    const res = await api.post(`/faculty/subjects/${subjectId}/progress`, progress);
    if (!res.ok) throw new Error('Failed to update progress');
    return res.json();
  },

  // --- Excel Generators ---
  
  generateInternalReport: async (file: File, subjectCode: string): Promise<{ blob: Blob, historyId: string }> => {
    const formData = new FormData();
    formData.append('facultyWorkbook', file);
    formData.append('subjectCode', subjectCode);

    const res = await api.post('/reports/generate/internal', formData);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate internal report');
    }

    const historyId = res.headers.get('X-History-Id');
    const blob = await res.blob();
    return { blob, historyId: historyId || '' };
  },

  generateExternalReport: async (file: File, subjectCode: string): Promise<{ blob: Blob, historyId: string }> => {
    const formData = new FormData();
    formData.append('externalWorkbook', file);
    formData.append('subjectCode', subjectCode);

    const res = await api.post('/reports/generate/external', formData);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate external report');
    }

    const historyId = res.headers.get('X-History-Id');
    const blob = await res.blob();
    return { blob, historyId: historyId || '' };
  },

  generateLabReport: async (file: File, subjectCode: string): Promise<{ blob: Blob, historyId: string }> => {
    const formData = new FormData();
    formData.append('labWorkbook', file);
    formData.append('subjectCode', subjectCode);

    const res = await api.post('/reports/generate/lab', formData);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate lab report');
    }

    const historyId = res.headers.get('X-History-Id');
    const blob = await res.blob();
    return { blob, historyId: historyId || '' };
  },

  // --- History & Submission ---
  
  getReportHistory: async (): Promise<ReportHistoryItem[]> => {
    const res = await api.get('/reports/history');
    if (!res.ok) throw new Error('Failed to fetch report history');
    return res.json();
  },

  submitReport: async (historyId: string): Promise<void> => {
    const res = await api.post(`/reports/${historyId}/submit`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit report');
    }
  },

  syncStudents: async (subjectId: string): Promise<{ success: boolean; count: number; message: string }> => {
    const res = await api.post(`/faculty/subjects/${subjectId}/sync-students`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sync students');
    }
    return res.json();
  },

  downloadReport: async (historyId: string): Promise<Blob> => {
    const res = await api.get(`/reports/download/${historyId}`);
    if (!res.ok) throw new Error('Failed to download report');
    return res.blob();
  }
};
