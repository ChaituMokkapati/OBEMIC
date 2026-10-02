import { Request, Response } from 'express';
import { COImportService } from '../../services/admin/imports/course-outcomes/COImportService';
import fs from 'fs';

export class AdminCOController {
  private importService = new COImportService();

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
}
