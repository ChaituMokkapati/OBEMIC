import { Router } from 'express';
import { AdminOutcomesController } from '../../controllers/admin/admin.outcomes.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';
import { Permissions } from '../../config/permissions';

const router = Router();
const controller = new AdminOutcomesController();

router.get(
  '/',
  authenticate,
  requirePermission(Permissions.MANAGE_SUBJECTS), // Or a specific MANAGE_OUTCOMES permission
  controller.getOutcomes
);

router.post(
  '/upload',
  authenticate,
  requirePermission(Permissions.MANAGE_SUBJECTS), // Admin only
  controller.upsertOutcomes
);

export default router;
