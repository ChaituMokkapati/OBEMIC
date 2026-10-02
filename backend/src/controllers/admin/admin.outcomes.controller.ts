import { Request, Response } from 'express';
import { OutcomesService } from '../../services/admin/outcomes.service';
import { logger } from '../../logs/logger';

export class AdminOutcomesController {
  private outcomesService = new OutcomesService();

  public getOutcomes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { departmentId } = req.query;

      const data = await this.outcomesService.getOutcomes(
        departmentId ? String(departmentId) : undefined
      );

      res.status(200).json(data);
    } catch (error: any) {
      logger.error(`Error fetching outcomes: ${error.message}`);
      res.status(500).json({ error: 'Failed to fetch outcomes' });
    }
  };

  public upsertOutcomes = async (req: Request, res: Response): Promise<void> => {
    try {
      const { pos, peos, psos } = req.body;
      const { departmentId } = req.query;

      // Simple JSON bulk upsert for the frontend
      // In a real scenario, this would be wrapped in a Prisma transaction
      const results = { pos: 0, peos: 0, psos: 0 };

      if (pos && Array.isArray(pos)) {
        for (const po of pos) {
          await this.outcomesService.upsertProgramOutcome({
            code: po.code,
            title: po.title,
            description: po.description
          });
          results.pos++;
        }
      }

      if (peos && Array.isArray(peos)) {
        for (const peo of peos) {
          await this.outcomesService.upsertProgramEducationalObjective({
            code: peo.code,
            title: peo.title,
            description: peo.description
          });
          results.peos++;
        }
      }

      if (psos && Array.isArray(psos) && departmentId) {
        for (const pso of psos) {
          await this.outcomesService.upsertProgramSpecificObjective({
            code: pso.code,
            title: pso.title,
            description: pso.description,
            departmentId: String(departmentId)
          });
          results.psos++;
        }
      }

      res.status(200).json({ message: 'Outcomes successfully upserted', results });
    } catch (error: any) {
      logger.error(`Error upserting outcomes: ${error.message}`);
      res.status(500).json({ error: 'Failed to upsert outcomes' });
    }
  };
}
