import prisma from '../database';
import { ReportStatus } from '@prisma/client';

export class ReviewService {
  /**
   * Retrieves pending reports.
   * If departmentId is provided, filters to only that department (Coordinator logic).
   * Otherwise, fetches all pending reports (Admin logic).
   */
  public async getPendingReports(departmentId?: string) {
    const whereClause: any = {
      status: { in: [ReportStatus.SUBMITTED, ReportStatus.GENERATED, ReportStatus.APPROVED] },
      isDeleted: false
    };

    if (departmentId) {
      whereClause.subject = {
        departmentId
      };
    }

    return prisma.reportHistory.findMany({
      where: whereClause,
      include: {
        subject: {
          include: { department: true }
        },
        faculty: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  /**
   * Approves a report.
   */
  public async approveReport(reportId: string, reviewerId: string) {
    const report = await prisma.reportHistory.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');
    if (report.status !== ReportStatus.SUBMITTED && report.status !== ReportStatus.GENERATED) {
      throw new Error(`Cannot approve report with status ${report.status}`);
    }

    const updated = await prisma.reportHistory.update({
      where: { id: reportId },
      data: { status: ReportStatus.APPROVED, feedback: null }
    });

    await prisma.auditLog.create({
      data: {
        userId: reviewerId,
        action: 'APPROVED_REPORT',
        entity: 'ReportHistory',
        entityId: reportId
      }
    });

    return updated;
  }

  /**
   * Rejects a report with feedback.
   */
  public async rejectReport(reportId: string, reviewerId: string, feedback: string) {
    const report = await prisma.reportHistory.findUnique({ where: { id: reportId } });
    if (!report) throw new Error('Report not found');
    if (report.status !== ReportStatus.SUBMITTED) throw new Error(`Cannot reject report with status ${report.status}`);

    const updated = await prisma.reportHistory.update({
      where: { id: reportId },
      data: { status: ReportStatus.REJECTED, feedback }
    });

    await prisma.auditLog.create({
      data: {
        userId: reviewerId,
        action: 'REJECTED_REPORT',
        entity: 'ReportHistory',
        entityId: reportId
      }
    });

    return updated;
  }

  /**
   * Dashboard stats for the review dashboard.
   */
  public async getDashboardStats(departmentId?: string) {
    const pendingWhere: any = { status: ReportStatus.SUBMITTED, isDeleted: false };
    const approvedWhere: any = { status: ReportStatus.APPROVED, isDeleted: false };
    const rejectedWhere: any = { status: ReportStatus.REJECTED, isDeleted: false };

    if (departmentId) {
      const depFilter = { subject: { departmentId } };
      Object.assign(pendingWhere, depFilter);
      Object.assign(approvedWhere, depFilter);
      Object.assign(rejectedWhere, depFilter);
    }

    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      prisma.reportHistory.count({ where: pendingWhere }),
      prisma.reportHistory.count({ where: approvedWhere }),
      prisma.reportHistory.count({ where: rejectedWhere })
    ]);

    return {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount
    };
  }
}
