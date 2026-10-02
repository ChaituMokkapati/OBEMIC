import { Router } from 'express';
import { FacultyController } from '../controllers/faculty.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/role.middleware';
import { Permissions } from '../config/permissions';

const router = Router();
const facultyController = new FacultyController();

/**
 * @swagger
 * /api/v1/faculty/dashboard:
 *   get:
 *     summary: Get dashboard statistics for the logged-in faculty
 *     tags: [Faculty]
 *     responses:
 *       200:
 *         description: Dashboard stats including total subjects and recent reports
 */
router.get(
  '/dashboard',
  authenticate,
  // Assuming viewing subjects is the baseline permission for a faculty dashboard
  requirePermission(Permissions.VIEW_SUBJECTS),
  facultyController.getDashboard
);

/**
 * @swagger
 * /api/v1/faculty/subjects:
 *   get:
 *     summary: Get all subjects assigned to the logged-in faculty
 *     tags: [Faculty]
 *     responses:
 *       200:
 *         description: A list of assigned subjects
 */
router.get(
  '/subjects',
  authenticate,
  requirePermission(Permissions.VIEW_SUBJECTS),
  facultyController.getSubjects
);

/**
 * Wizard Endpoints
 */
router.get('/subjects/:id/cos', authenticate, facultyController.getSubjectCOs);
router.get('/subjects/:id/pos', authenticate, facultyController.getPOs);
router.get('/subjects/:id/indirect-assessment', authenticate, facultyController.getIndirectAssessment);
router.get('/subjects/:id/direct-assessment', authenticate, facultyController.getDirectAssessment);
router.get('/subjects/:id/copo', authenticate, facultyController.getCOPOAttainment);
router.post('/subjects/:id/progress', authenticate, facultyController.updateProgress);
router.post('/subjects/:id/sync-students', authenticate, facultyController.syncStudents);

export default router;
