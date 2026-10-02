import prisma from '../database';
import { ReportType, ReportStatus } from '@prisma/client';

export class ReportRepository {
  async createReportHistory(data: {
    facultyId: string;
    subjectId: string;
    reportType: ReportType;
    status: ReportStatus;
    filePath: string;
    fileSize: number;
    data?: any;
  }) {
    return prisma.reportHistory.create({
      data: {
        ...data,
        generatedAt: new Date(),
      }
    });
  }

  async getReportsByFaculty(facultyId: string) {
    return prisma.reportHistory.findMany({
      where: { facultyId, isDeleted: false },
      include: { subject: true }
    });
  }

  async getReportById(id: string) {
    return prisma.reportHistory.findUnique({
      where: { id, isDeleted: false },
      include: { subject: true, faculty: true }
    });
  }

  async updateReportStatus(id: string, status: ReportStatus) {
    return prisma.reportHistory.update({
      where: { id },
      data: { status }
    });
  }
}
