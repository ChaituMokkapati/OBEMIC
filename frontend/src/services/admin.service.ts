import { api } from './apiClient';

export const adminService = {
  async getDashboardStats(): Promise<any> {
    const res = await api.get('/admin/dashboard');
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  // Course Outcomes
  async previewCourseOutcomes(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/admin/course-outcomes/upload/preview', formData);
    if (!res.ok) throw new Error('Preview failed');
    return res.json();
  },
  async confirmCourseOutcomes(data: any): Promise<any> {
    const res = await api.post('/admin/course-outcomes/upload/confirm', data);
    if (!res.ok) throw new Error('Confirm failed');
    return res.json();
  },

  // Staff (Faculty)
  async previewStaff(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/admin/faculty/upload/preview', formData);
    if (!res.ok) throw new Error('Preview failed');
    return res.json();
  },
  async confirmStaff(data: any): Promise<any> {
    const res = await api.post('/admin/faculty/upload/confirm', data);
    if (!res.ok) throw new Error('Confirm failed');
    return res.json();
  },

  // POs, PSOs, PEOs
  async upsertOutcomes(payload: any): Promise<any> {
    const res = await api.post('/admin/outcomes/upload', payload);
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  async getPendingReports(): Promise<any[]> {
    const res = await api.get('/review/reports/pending');
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  },

  async approveReport(id: string): Promise<any> {
    const res = await api.post(`/review/reports/${id}/approve`);
    if (!res.ok) throw new Error('Failed to approve');
    return res.json();
  },

  async rejectReport(id: string, reason: string): Promise<any> {
    const res = await api.post(`/review/reports/${id}/reject`, { reason });
    if (!res.ok) throw new Error('Failed to reject');
    return res.json();
  },

  async getSurveys(): Promise<any[]> {
    const res = await api.get('/admin/survey/list');
    if (!res.ok) return [];
    return res.json();
  },

  async openSurvey(id: string): Promise<any> {
    const res = await api.patch(`/admin/survey/${id}/open`);
    if (!res.ok) throw new Error('Failed to open');
    return res.json();
  },

  async closeSurvey(id: string): Promise<any> {
    const res = await api.patch(`/admin/survey/${id}/close`, {});
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to close survey');
    }
    return res.json();
  },

  async createSurvey(data: { title: string, academicYearId: string, semesterId: string }): Promise<any> {
    const res = await api.post(`/admin/survey/create`, data);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create survey');
    }
    return res.json();
  },

  async getAcademicYears(): Promise<any[]> {
    const res = await api.get('/academic/years');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  },

  async getSections(): Promise<any[]> {
    const res = await api.get('/academic/sections');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.data || []);
  },

  async getFacultyList(): Promise<any[]> {
    const res = await api.get('/admin/faculty/list');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  },

  async getSubjects(departmentId?: string): Promise<any[]> {
    let url = '/academic/subjects';
    if (departmentId) url += `?departmentId=${departmentId}`;
    const res = await api.get(url);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || [];
  },

  async createSubject(data: { subjectCode: string, subjectName: string, semesterLevel: string, credits: number, departmentId?: string }): Promise<any> {
    const res = await api.post('/academic/subjects', data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create subject');
    }
    return res.json();
  },

  async assignFaculty(subjectId: string, facultyId: string, academicYearId: string, sectionId?: string): Promise<any> {
    const res = await api.post('/academic/assignments', {
      subjectId,
      facultyId,
      academicYearId,
      sectionId
    });
    if (!res.ok) throw new Error('Failed to assign faculty');
    return res.json();
  },

  async unassignFaculty(assignmentId: string): Promise<void> {
    const res = await api.delete(`/admin/faculty/assignment/${assignmentId}`);
    if (!res.ok) throw new Error('Failed to unassign faculty');
  },

  async createFaculty(data: any): Promise<void> {
    const res = await api.post('/admin/faculty/create', data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create faculty');
    }
  },

  async getAttainmentConfig(departmentId?: string): Promise<any> {
    let url = '/admin/attainment-configurations';
    if (departmentId) url += `?departmentId=${departmentId}`;
    const res = await api.get(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch attainment configuration');
    }
    return res.json();
  },

  async updateAttainmentConfig(data: { departmentId: string; threshold: number; reason?: string }): Promise<any> {
    const res = await api.post('/admin/attainment-configurations', data);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update attainment configuration');
    }
    return res.json();
  }
};
