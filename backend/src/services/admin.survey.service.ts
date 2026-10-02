import prisma from '../database';
import { SurveyStatus } from '@prisma/client';

export class AdminSurveyService {
  public async getAllSurveys() {
    return prisma.survey.findMany({
      include: {
        academicYear: true,
        semester: true,
        _count: {
          select: { responses: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  public async createSurvey(data: { title: string, academicYearId: string, semesterId: string, startDate?: Date, endDate?: Date }) {
    return prisma.survey.create({
      data: {
        title: data.title,
        academicYearId: data.academicYearId,
        semesterId: data.semesterId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: SurveyStatus.OPEN,
      }
    });
  }

  public async updateSurveyStatus(id: string, status: SurveyStatus) {
    return prisma.survey.update({
      where: { id },
      data: { status }
    });
  }

  public async getSurveyResults(filters: {
    academicYearId?: string,
    semesterId?: string,
    departmentId?: string,
    sectionId?: string,
    facultyId?: string,
    subjectId?: string
  }) {
    // 1. Build the where clause for SurveyResponse based on filters
    const responseWhere: any = {};
    
    // We navigate through facultyAssignment for most filters
    const assignmentWhere: any = {};
    if (filters.academicYearId) assignmentWhere.academicYearId = filters.academicYearId;
    if (filters.facultyId) assignmentWhere.facultyId = filters.facultyId;
    if (filters.subjectId) assignmentWhere.subjectId = filters.subjectId;
    if (filters.sectionId) assignmentWhere.sectionId = filters.sectionId;

    if (filters.semesterId || filters.departmentId) {
      assignmentWhere.subject = {};
      if (filters.semesterId) assignmentWhere.semesterId = filters.semesterId;
      if (filters.departmentId) assignmentWhere.subject.departmentId = filters.departmentId;
    }

    if (Object.keys(assignmentWhere).length > 0) {
      responseWhere.facultyAssignment = assignmentWhere;
    }

    // 2. Fetch all matching ratings
    // We want to group ratings by CO. Prisma groupBy doesn't easily let us join nested tables for filtering, 
    // so we'll fetch the matching ratings and aggregate them in memory, which is fine for typical survey sizes.
    const matchingResponses = await prisma.surveyResponse.findMany({
      where: responseWhere,
      select: { id: true }
    });

    const responseIds = matchingResponses.map(r => r.id);

    if (responseIds.length === 0) {
      return [];
    }

    const ratings = await prisma.surveyRating.findMany({
      where: {
        surveyResponseId: { in: responseIds }
      },
      include: {
        courseOutcome: { select: { id: true, coCode: true, description: true } }
      }
    });

    // 3. Aggregate by CO
    const coMap = new Map<string, { coCode: string, description: string, sum: number, count: number }>();

    for (const r of ratings) {
      const co = r.courseOutcome;
      if (!coMap.has(co.id)) {
        coMap.set(co.id, { coCode: co.coCode, description: co.description, sum: 0, count: 0 });
      }
      const data = coMap.get(co.id)!;
      data.sum += r.rating;
      data.count += 1;
    }

    // 4. Calculate Averages and Indirect Attainment
    const results = Array.from(coMap.values()).map(co => {
      const averageRating = co.sum / co.count;
      // Formula: ROUND((AverageRating/5)*3, 2)
      const indirectAttainment = Math.round((averageRating / 5) * 3 * 100) / 100;

      return {
        coCode: co.coCode,
        description: co.description,
        responses: co.count,
        averageRating: Math.round(averageRating * 100) / 100,
        indirectAttainment
      };
    });

    // Sort by CO Code
    return results.sort((a, b) => a.coCode.localeCompare(b.coCode));
  }
}
