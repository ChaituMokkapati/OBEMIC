import { Request, Response } from 'express';
import { AcademicService } from '../services/academic.service';
import prisma from '../database';
import { logger } from '../logs/logger';

export class AcademicController {
  private academicService = new AcademicService();

  public getDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
      const depts = await this.academicService.getDepartments();
      res.json(depts);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  public createAcademicYear = async (req: Request, res: Response): Promise<void> => {
    try {
      const year = await this.academicService.createAcademicYear(req.body.year);
      res.status(201).json(year);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  public getAcademicYears = async (req: Request, res: Response): Promise<void> => {
    try {
      const years = await this.academicService.getAcademicYears();
      res.json(years);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  public createSemester = async (req: Request, res: Response): Promise<void> => {
    try {
      const { semester, academicYearId } = req.body;
      const result = await this.academicService.createSemester(semester, academicYearId);
      res.status(201).json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  public createSubject = async (req: Request, res: Response): Promise<void> => {
    try {
      const subject = await this.academicService.createSubject(req.body);
      res.status(201).json(subject);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };

  public getSubjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const subjects = await this.academicService.getAllSubjects();
      res.json(subjects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public getSections = async (req: Request, res: Response): Promise<void> => {
    try {
      const sections = await prisma.section.findMany({
        where: { departmentId: (req as any).user?.departmentId }
      });
      res.json(sections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public assignFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
      const { facultyId, subjectId, academicYearId } = req.body;
      const assignment = await this.academicService.assignFaculty(facultyId, subjectId, academicYearId);
      res.status(201).json(assignment);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  };
}
