import { Router } from 'express';
import { AdminCOController } from '../../controllers/admin/admin.co.controller';
import { upload } from '../../middleware/upload.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';
import { Permissions } from '../../config/permissions';

const router = Router();
const controller = new AdminCOController();

// Use middleware to authenticate and authorize ADMIN for these endpoints
router.use(authenticate);
router.use(requirePermission(Permissions.CO_UPLOAD));

router.post('/upload/preview', upload.single('file'), controller.previewImport);
router.post('/upload/confirm', controller.confirmImport);

export default router;
