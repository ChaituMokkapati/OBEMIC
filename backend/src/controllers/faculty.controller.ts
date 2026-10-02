import { Request, Response } from 'express';
import { FacultyService } from '../services/faculty.service';
import { logger } from '../logs/logger';

export class FacultyController {
  private facultyService = new FacultyService();

  public getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const data = await this.facultyService.getDashboardStats(req.user.userId);
      res.json(data);
    } catch (e: any) {
      logger.error('Error fetching faculty dashboard:', e);
      res.status(500).json({ error: e.message });
    }
  };

  public getSubjects = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const subjects = await this.facultyService.getAssignedSubjects(req.user.userId);
      res.json(subjects);
    } catch (e: any) {
      logger.error('Error fetching faculty subjects:', e);
      res.status(500).json({ error: e.message });
    }
  };

  public getSubjectCOs = async (req: Request, res: Response): Promise<void> => {
    try {
      const cos = await this.facultyService.getSubjectCOs(req.params.id as string);
      res.json(cos);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  public getPOs = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.facultyService.getPOs(req.query.departmentId as string || 'default');
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  public getIndirectAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.facultyService.getIndirectAssessment(req.params.id as string, req.user!.userId as string);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  public getDirectAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.facultyService.getDirectAssessment(req.params.id as string, req.user!.userId as string);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  public getCOPOAttainment = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.facultyService.getCOPOMapping(req.params.id as string, req.user!.userId as string);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  public updateProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.facultyService.updateProgress(req.params.id as string, req.user!.userId as string, req.body);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  public syncStudents = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.facultyService.syncStudentsForSubject(req.params.id as string, req.user!.userId as string);
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };
}
