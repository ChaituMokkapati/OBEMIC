export interface StudentMarks {
  serialNumber: string | number;
  rollNumber: string;
  studentName?: string;
  marks: Record<string, string | number>; // Dynamic marks mapped by question/header e.g. "Q1", "Quiz 1"
}

export interface ClassMetadata {
  subjectCode?: string;
  subjectName?: string;
  yearAndSem?: string;
  academicYear?: string;
  facultyName?: string;
}

export interface ExtractedData {
  metadata: ClassMetadata;
  students: StudentMarks[];
}
