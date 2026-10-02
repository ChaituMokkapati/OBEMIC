import { Router } from 'express';
import { AdminAttainmentController } from '../../controllers/admin/admin.attainment.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';
import { Permissions } from '../../config/permissions';

const router = Router();
const controller = new AdminAttainmentController();

router.use(authenticate);

router.get(
  '/',
  requirePermission(Permissions.ATTAINMENT_CONFIG_VIEW),
  controller.getAttainmentConfig
);

router.post(
  '/',
  requirePermission(Permissions.ATTAINMENT_CONFIG_UPDATE),
  controller.updateAttainmentConfig
);

export default router;
