import { Request, Response } from 'express';
import { FacultyImportService } from '../../services/admin/imports/faculty/FacultyImportService';
import fs from 'fs';
import bcrypt from 'bcrypt';
import prisma from '../../database';
import { AcademicService } from '../../services/academic.service';

export class AdminFacultyController {
  private importService = new FacultyImportService();
  private academicService = new AcademicService();

  public createFaculty = async (req: Request, res: Response): Promise<void> => {
    try {
      const { employeeId, name, email, departmentId } = req.body;
      if (!employeeId || !name || !email || !departmentId) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Check if user exists
      const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { employeeId }] } });
      if (existing) {
        res.status(400).json({ error: 'User with this email or employee ID already exists' });
        return;
      }

      const role = await prisma.role.findUnique({ where: { roleName: 'FACULTY' } });
      if (!role) throw new Error('FACULTY role not found in database');

      // Generate temporary password based on employeeId and department
      const plainPassword = employeeId + '@' + departmentId;
      const passwordHash = await bcrypt.hash(plainPassword, 10);

      const user = await prisma.user.create({
        data: {
          employeeId,
          name,
          email,
          passwordHash,
          departmentId,
          roleId: role.id,
          mustChangePassword: true
        }
      });

      res.status(201).json({ message: 'Faculty created successfully', user });
    } catch (error: any) {
      console.error('Error creating faculty:', error);
      res.status(500).json({ error: 'Failed to create faculty' });
    }
  };

  public previewImport = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }
      
      const adminUserId = req.user?.userId;
      if (!adminUserId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.importService.preview(req.file.path, adminUserId);
      
      // Cleanup the uploaded file as it's been parsed and snapshotted
      fs.unlinkSync(req.file.path);

      res.json(result);
    } catch (error: any) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  };

  public confirmImport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { batchId } = req.body;
      if (!batchId) {
        res.status(400).json({ error: 'batchId is required' });
        return;
      }

      const adminUserId = req.user?.userId;
      if (!adminUserId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const result = await this.importService.confirm(batchId, adminUserId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public getFacultyList = async (req: Request, res: Response): Promise<void> => {
    try {
      const { departmentId } = req.query;

      const whereClause: any = { role: { roleName: 'FACULTY' }, isDeleted: false };
      if (departmentId) {
        whereClause.departmentId = String(departmentId);
      }

      const faculty = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          department: {
            select: { id: true, departmentName: true }
          },
          facultyProfile: true,
          assignments: {
            where: { status: 'ACTIVE' },
            include: { subject: true, section: true }
          }
        }
      });

      res.status(200).json(faculty);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch faculty list: ' + error.message });
    }
  };

  public assignSubject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { facultyId, subjectId, academicYearId } = req.body;
      const adminUserId = req.user?.userId;

      if (!facultyId || !subjectId || !academicYearId) {
        res.status(400).json({ error: 'facultyId, subjectId, and academicYearId are required' });
        return;
      }

      const assignment = await this.academicService.assignFaculty(facultyId, subjectId, academicYearId, adminUserId);
      res.status(200).json({ message: 'Subject assigned successfully', assignment });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to assign subject: ' + error.message });
    }
  };

  public unassignSubject = async (req: Request, res: Response): Promise<void> => {
    try {
      const assignmentId = String(req.params.id);
      
      const updated = await this.academicService.unassignFaculty(assignmentId);
      res.status(200).json({ message: 'Subject unassigned successfully', updated });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to unassign subject: ' + error.message });
    }
  };
}
