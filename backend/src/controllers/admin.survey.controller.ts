import { Request, Response } from 'express';
import { AdminSurveyService } from '../services/admin.survey.service';
import { logger } from '../logs/logger';
import { SurveyStatus } from '@prisma/client';

export class AdminSurveyController {
  private service = new AdminSurveyService();

  public getSurveys = async (req: Request, res: Response): Promise<void> => {
    try {
      const surveys = await this.service.getAllSurveys();
      res.json(surveys);
    } catch (error: any) {
      logger.error('Error fetching surveys:', error);
      res.status(500).json({ error: error.message });
    }
  };

  public createSurvey = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;
      if (!data.title || !data.academicYearId || !data.semesterId) {
        res.status(400).json({ error: 'Title, academicYearId, and semesterId are required' });
        return;
      }
      const survey = await this.service.createSurvey(data);
      res.status(201).json(survey);
    } catch (error: any) {
      logger.error('Error creating survey:', error);
      res.status(500).json({ error: error.message });
    }
  };

  public openSurvey = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const survey = await this.service.updateSurveyStatus(id as string, SurveyStatus.OPEN);
      res.json(survey);
    } catch (error: any) {
      logger.error('Error opening survey:', error);
      res.status(500).json({ error: error.message });
    }
  };

  public closeSurvey = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const survey = await this.service.updateSurveyStatus(id as string, SurveyStatus.CLOSED);
      res.json(survey);
    } catch (error: any) {
      logger.error('Error closing survey:', error);
      res.status(500).json({ error: error.message });
    }
  };

  public getSurveyResults = async (req: Request, res: Response): Promise<void> => {
    try {
      const filters = req.query as any;
      const results = await this.service.getSurveyResults(filters);
      res.json(results);
    } catch (error: any) {
      logger.error('Error fetching survey results:', error);
      res.status(500).json({ error: error.message });
    }
  };
}
