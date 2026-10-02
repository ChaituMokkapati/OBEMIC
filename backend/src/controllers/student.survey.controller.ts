import { Request, Response } from 'express';
import { StudentSurveyService } from '../services/student.survey.service';
import { logger } from '../logs/logger';

export class StudentSurveyController {
  private service = new StudentSurveyService();

  public getDashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const dashboard = await this.service.getDashboard(req.user.userId);
      res.json(dashboard);
    } catch (error: any) {
      logger.error('Error in getDashboard:', error);
      res.status(500).json({ error: error.message });
    }
  };

  public getSubjects = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const subjects = await this.service.getSubjects(req.user.userId);
      res.json(subjects);
    } catch (error: any) {
      logger.error('Error in getSubjects:', error);
      res.status(500).json({ error: error.message });
    }
  };

  public getSurveyDetails = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const { id } = req.params; // facultyAssignmentId
      const details = await this.service.getSurveyDetails(req.user.userId, id as string);
      res.json(details);
    } catch (error: any) {
      logger.error('Error in getSurveyDetails:', error);
      res.status(500).json({ error: error.message });
    }
  };

  public submitSurvey = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const { facultyAssignmentId, ratings } = req.body;

      if (!facultyAssignmentId || !ratings || !Array.isArray(ratings)) {
        res.status(400).json({ error: 'facultyAssignmentId and ratings array are required' });
        return;
      }

      const result = await this.service.submitSurvey(req.user.userId, facultyAssignmentId, ratings);
      res.json(result);
    } catch (error: any) {
      logger.error('Error in submitSurvey:', error);
      if (error.message.includes('already submitted') || error.message.includes('must be rated')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  };
}
