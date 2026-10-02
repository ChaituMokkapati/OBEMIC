import { z } from 'zod';

export const StudentMarksSchema = z.object({
  serialNumber: z.union([z.string(), z.number()]),
  rollNumber: z.string().min(1, "Roll number is required"),
  studentName: z.string().optional(),
  marks: z.record(z.string(), z.union([z.string(), z.number()])),
});

export const ClassMetadataSchema = z.object({
  subjectCode: z.string().optional(),
  subjectName: z.string().optional(),
  yearAndSem: z.string().optional(),
  academicYear: z.string().optional(),
  facultyName: z.string().optional(),
});

export const ExtractedDataSchema = z.object({
  metadata: ClassMetadataSchema,
  students: z.array(StudentMarksSchema).nonempty("At least one student record is required"),
});
