import prisma from '../database';
import { SurveyStatus } from '@prisma/client';

export class StudentSurveyService {
  public async getDashboard(studentId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          where: { isActive: true },
          include: {
            department: true,
            semester: true,
            academicYear: true,
            section: true,
          }
        }
      }
    });

    if (!student) throw new Error('Student not found');
    return student;
  }

  public async getSubjects(studentId: string) {
    // 1. Get active enrollments
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { studentId, isActive: true },
    });

    if (enrollments.length === 0) return [];

    const currentEnrollment = enrollments[0]; // Assuming 1 active enrollment at a time

    // 2. Find OPEN survey for this academic year and semester
    const openSurvey = await prisma.survey.findFirst({
      where: {
        academicYearId: currentEnrollment.academicYearId,
        semesterId: currentEnrollment.semesterId,
        status: SurveyStatus.OPEN,
        // Optional: date window validation
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: new Date() }, endDate: { gte: new Date() } }
        ]
      }
    });

    if (!openSurvey) return [];

    // 3. Get all FacultyAssignments for this academicYear, semester (via subjects), and section
    const assignments = await prisma.facultyAssignment.findMany({
      where: {
        academicYearId: currentEnrollment.academicYearId,
        sectionId: currentEnrollment.sectionId,
        semesterId: currentEnrollment.semesterId,
          subject: { departmentId: currentEnrollment.departmentId },
        status: 'ACTIVE'
      },
      include: {
        subject: true,
        faculty: {
          select: { name: true, employeeId: true }
        }
      }
    });

    // 4. Filter out subjects already surveyed by this student for this survey
    const submittedResponses = await prisma.surveyResponse.findMany({
      where: {
        surveyId: openSurvey.id,
        studentId,
      },
      select: { facultyAssignmentId: true }
    });

    const submittedIds = new Set(submittedResponses.map(r => r.facultyAssignmentId));

    const pendingAssignments = assignments.filter(a => !submittedIds.has(a.id));

    return {
      survey: {
        id: openSurvey.id,
        title: openSurvey.title,
      },
      pendingSubjects: pendingAssignments.map(a => ({
        facultyAssignmentId: a.id,
        subjectCode: a.subject.subjectCode,
        subjectName: a.subject.subjectName,
        facultyName: a.faculty.name,
      }))
    };
  }

  public async getSurveyDetails(studentId: string, facultyAssignmentId: string) {
    const assignment = await prisma.facultyAssignment.findUnique({
      where: { id: facultyAssignmentId },
      include: {
        subject: {
          include: {
            courseOutcomes: true
          }
        },
        faculty: { select: { name: true } }
      }
    });

    if (!assignment) throw new Error('Assignment not found');

    // Sort COs logically (CO1, CO2, etc.)
    const sortedCOs = assignment.subject.courseOutcomes.sort((a, b) => a.coCode.localeCompare(b.coCode));

    return {
      facultyAssignmentId: assignment.id,
      subjectCode: assignment.subject.subjectCode,
      subjectName: assignment.subject.subjectName,
      facultyName: assignment.faculty.name,
      courseOutcomes: sortedCOs.map(co => ({
        id: co.id,
        coCode: co.coCode,
        description: co.description
      }))
    };
  }

  public async submitSurvey(studentId: string, facultyAssignmentId: string, ratings: { courseOutcomeId: string, rating: number }[]) {
    // 1. Validate Assignment
    const assignment = await prisma.facultyAssignment.findUnique({
      where: { id: facultyAssignmentId },
      include: { subject: { include: { courseOutcomes: true } } }
    });
    if (!assignment) throw new Error('Invalid assignment');

    // 2. Validate OPEN Survey for this assignment's year/sem
    const openSurvey = await prisma.survey.findFirst({
      where: {
        academicYearId: assignment.academicYearId,
        semesterId: assignment.semesterId,
        status: SurveyStatus.OPEN,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: new Date() }, endDate: { gte: new Date() } }
        ]
      }
    });

    if (!openSurvey) throw new Error('No open survey found for this subject window');

    // 3. Prevent duplicate submission
    const existing = await prisma.surveyResponse.findUnique({
      where: {
        surveyId_studentId_facultyAssignmentId: {
          surveyId: openSurvey.id,
          studentId,
          facultyAssignmentId
        }
      }
    });

    if (existing) throw new Error('You have already submitted this survey.');

    // 4. Validate all COs are rated
    const subjectCOIds = new Set(assignment.subject.courseOutcomes.map(co => co.id));
    const submittedCOIds = new Set(ratings.map(r => r.courseOutcomeId));

    for (const id of subjectCOIds) {
      if (!submittedCOIds.has(id)) {
        throw new Error('All Course Outcomes must be rated before submission.');
      }
    }

    for (const r of ratings) {
      if (r.rating < 1 || r.rating > 5) {
        throw new Error('Ratings must be between 1 and 5');
      }
    }

    // 5. Save Survey Response and Ratings inside a Transaction
    const response = await prisma.$transaction(async (tx) => {
      const resp = await tx.surveyResponse.create({
        data: {
          surveyId: openSurvey.id,
          studentId,
          facultyAssignmentId
        }
      });

      const ratingCreates = ratings.map(r => ({
        surveyResponseId: resp.id,
        courseOutcomeId: r.courseOutcomeId,
        rating: r.rating
      }));

      await tx.surveyRating.createMany({
        data: ratingCreates
      });

      return resp;
    });

    return { message: 'Survey submitted successfully', responseId: response.id };
  }
}
