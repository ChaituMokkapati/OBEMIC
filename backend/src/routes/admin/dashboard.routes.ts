import { Router } from 'express';
import { adminDashboardController } from '../../controllers/admin/admin.dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';
import { Permissions } from '../../config/permissions';

const router = Router();

router.use(authenticate, requirePermission(Permissions.ADMIN_DASHBOARD_VIEW));
router.get('/', adminDashboardController.getStats);

export default router;
