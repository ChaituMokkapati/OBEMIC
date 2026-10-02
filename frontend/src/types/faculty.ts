export type ReportType = 'INTERNAL' | 'EXTERNAL' | 'LAB' | 'OVERALL' | 'INDIRECT' | 'COPO';

export type ReportStatus = 'DRAFT' | 'GENERATED' | 'SUBMITTED' | 'REVIEWED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';

export interface ProgressState {
  indirect: boolean;
  direct: boolean;
  copo: boolean;
  overall: boolean;
}

export interface AssignedSubject {
  assignmentId: string;
  academicYear: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  semester: string;
  department: string;
  departmentId: string;
  progressState: ProgressState;
}

export interface RecentReport {
  id: string;
  subjectCode: string;
  reportType: ReportType;
  status: ReportStatus;
  generatedAt: string;
}

export interface FacultyDashboardData {
  stats: {
    totalSubjects: number;
    totalReportsGenerated: number;
  };
  recentReports: RecentReport[];
}

export interface CourseOutcome {
  id: string;
  coCode: string;
  description: string;
}

export interface ProgramOutcome {
  id: string;
  code: string;
  title: string;
  description: string;
}

export interface IndirectSurveyStudent {
  id: string;
  rollNo: string;
  name: string;
  scores: Record<string, number>;
}

export interface DirectAssessmentData {
  hasInternal: boolean;
  hasExternal: boolean;
  data: Record<string, {
    internalPct: number;
    internal3Scale: number;
    externalPct: number;
    external3Scale: number;
    directPct: number;
    direct3Scale: number;
    target3Scale: number;
  }>;
}

export interface ReportHistoryItem {
  id: string;
  facultyId: string;
  subjectId: string;
  reportType: ReportType;
  status: ReportStatus;
  feedback?: string | null;
  filePath?: string | null;
  fileSize?: number | null;
  generatedAt: string;
  createdAt: string;
  subject: {
    id: string;
    subjectCode: string;
    subjectName: string;
  };
}
