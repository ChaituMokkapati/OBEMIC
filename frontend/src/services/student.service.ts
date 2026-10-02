import { api } from './apiClient';

export const studentService = {
  async login(rollNumber: string, password: string):Promise<any> {
    const res = await api.post('/student/login', { rollNumber, password });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken);
    }
    return data;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  },

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('accessToken');
    }
    return false;
  },

  async getSubjects(): Promise<any> {
    const res = await api.get('/student/subjects');
    if (!res.ok) throw new Error('Failed to fetch subjects');
    return await res.json();
  },

  async getSurveyDetails(assignmentId: string): Promise<any> {
    const res = await api.get('/student/subjects/' + assignmentId + '/survey');
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch survey details');
    }
    const data = await res.json();
    return data;
  },

  async submitSurvey(facultyAssignmentId: string, ratings: any[]): Promise<any> {
    const res = await api.post('/student/survey/submit', {
      facultyAssignmentId,
      ratings
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit survey');
    }
    return res.json();
  }
};
