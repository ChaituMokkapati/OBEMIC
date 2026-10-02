import { Request, Response } from 'express';
import prisma from '../../database/index';
import { logger } from '../../logs/logger';

export class AdminDashboardController {
  public getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const [facultyCount, subjectCount, surveyCount, pendingReportsCount] = await Promise.all([
        prisma.user.count({ where: { role: { roleName: 'FACULTY' } } }),
        prisma.subject.count(),
        prisma.survey.count({ where: { status: 'OPEN' } }),
        prisma.reportHistory.count({ where: { status: 'SUBMITTED', isDeleted: false } }),
      ]);
      
      res.status(200).json({
        totalFaculty: facultyCount,
        totalSubjects: subjectCount,
        activeSurveys: surveyCount,
        pendingReports: pendingReportsCount
      });
    } catch (error: any) {
      logger.error('Error fetching admin dashboard stats: ' + error.message);
      res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  }
}
export const adminDashboardController = new AdminDashboardController();
