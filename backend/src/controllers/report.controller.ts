import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { ReportService } from '../services/report.service';
import { StorageService } from '../services/storage/StorageService';
import { logger } from '../logs/logger';

export class ReportController {
  private reportService = new ReportService();
  private storageService = new StorageService();

  public generateInternalReport = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Faculty marks workbook is required.' });
        return;
      }

      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized: Missing user info in request.' });
        return;
      }

      const subjectCode = req.body.subjectCode?.trim();
      if (!subjectCode) {
        res.status(400).json({ error: 'subjectCode is required in the form data.' });
        return;
      }

      // Process and Save directly using the uploaded faculty workbook
      const fileBuffer = fs.readFileSync(req.file.path);
      const { outputBuffer, history } = await this.reportService.processAndSaveReport(
        req.user.userId,
        fileBuffer,
        subjectCode
      );
      
      // Cleanup temporary file
      fs.unlinkSync(req.file.path);

      logger.info(`Internal Report generated successfully for user ${req.user.userId}, history ID: ${history.id}`);

      // Send file to client for immediate download, along with metadata headers if needed
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Generated_Internal_OBE_Report.xlsx`);
      // We can also return the history ID in a custom header
      res.setHeader('X-Report-History-Id', history.id);
      
      res.send(outputBuffer);
    } catch (error: any) {
      logger.error('Error generating internal report:', error);
      res.status(500).json({ error: error.message || 'Internal server error during internal report generation.' });
    }
  };

  public generateExternalReport = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'External marks workbook is required.' });
        return;
      }

      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized: Missing user info in request.' });
        return;
      }

      const subjectCode = req.body.subjectCode?.trim();
      if (!subjectCode) {
        res.status(400).json({ error: 'subjectCode is required in the form data.' });
        return;
      }

      // Process and Save directly using the uploaded external workbook
      const fileBuffer = fs.readFileSync(req.file.path);
      const { outputBuffer, history } = await this.reportService.processAndSaveExternalReport(
        req.user.userId,
        fileBuffer,
        subjectCode
      );

      // Cleanup temporary file
      fs.unlinkSync(req.file.path);

      logger.info(`External Report generated successfully for user ${req.user.userId}, history ID: ${history.id}`);

      // Send file to client for immediate download, along with metadata headers if needed
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Generated_External_OBE_Report.xlsx`);
      res.setHeader('X-Report-History-Id', history.id);
      
      res.send(outputBuffer);
    } catch (error: any) {
      logger.error('Error generating external report:', error);
      res.status(500).json({ error: error.message || 'Internal server error during external report generation.' });
    }
  };

  public generateLabReport = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Lab marks workbook is required.' });
        return;
      }

      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized: Missing user info in request.' });
        return;
      }

      const subjectCode = req.body.subjectCode?.trim();
      if (!subjectCode) {
        res.status(400).json({ error: 'subjectCode is required in the form data.' });
        return;
      }

      // Process and Save directly using the uploaded lab workbook
      const fileBuffer = fs.readFileSync(req.file.path);
      const { outputBuffer, history } = await this.reportService.processAndSaveLabReport(
        req.user.userId,
        fileBuffer,
        subjectCode
      );

      // Cleanup temporary file
      fs.unlinkSync(req.file.path);

      logger.info(`Lab Report generated successfully for user ${req.user.userId}, history ID: ${history.id}`);

      // Send file to client for immediate download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Generated_Lab_OBE_Report.xlsx`);
      res.setHeader('X-Report-History-Id', history.id);
      
      res.send(outputBuffer);
    } catch (error: any) {
      logger.error('Error generating lab report:', error);
      res.status(500).json({ error: error.message || 'Internal server error during lab report generation.' });
    }
  };

  public getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      const history = await this.reportService.getHistory(req.user.userId);
      res.json(history);
    } catch (error: any) {
      logger.error('Error fetching history:', error);
      res.status(500).json({ error: error.message });
    }
  };

  public downloadReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const reportId = req.params.id as string;
      const report = await this.reportService.getReport(reportId);
      
      if (!report || !report.filePath) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      // Verify the user owns the report, or is an admin/coordinator
      if (report.facultyId !== req.user?.userId && req.user?.role === 'FACULTY') {
        res.status(403).json({ error: 'Forbidden: You do not have access to this report.' });
        return;
      }

      const fileBuffer = await this.storageService.getFile(report.filePath);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Report_${report.subject.subjectCode}.xlsx`);
      res.send(fileBuffer);
    } catch (error: any) {
      logger.error('Error downloading report:', error);
      res.status(500).json({ error: error.message });
    }
  };

  public submitReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const reportId = req.params.id as string;
      if (!req.user?.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const updated = await this.reportService.submitReport(reportId, req.user.userId);
      res.json(updated);
    } catch (error: any) {
      logger.error('Error submitting report:', error);
      res.status(500).json({ error: error.message });
    }
  };
}
