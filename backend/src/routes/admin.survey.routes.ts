import { Router } from 'express';
import { AdminSurveyController } from '../controllers/admin.survey.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/role.middleware';
import { Permissions } from '../config/permissions';

const router = Router();
const controller = new AdminSurveyController();

// We apply authenticate and role middleware (e.g. requires ADMIN or COORDINATOR)
router.get('/list', authenticate, requirePermission(Permissions.MANAGE_SURVEYS), controller.getSurveys);

/**
 * @swagger
 * /api/v1/admin/survey/create:
 *   post:
 *     summary: Create a new survey
 *     tags: [Admin Survey]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - academicYearId
 *               - semesterId
 *             properties:
 *               title:
 *                 type: string
 *               academicYearId:
 *                 type: string
 *               semesterId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Survey created successfully
 */
router.post('/create', authenticate, requirePermission(Permissions.MANAGE_SURVEYS), controller.createSurvey);

/**
 * @swagger
 * /api/v1/admin/survey/{id}/open:
 *   patch:
 *     summary: Open a survey
 *     tags: [Admin Survey]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Survey opened
 */
router.patch('/:id/open', authenticate, requirePermission(Permissions.MANAGE_SURVEYS), controller.openSurvey);

/**
 * @swagger
 * /api/v1/admin/survey/{id}/close:
 *   patch:
 *     summary: Close a survey
 *     tags: [Admin Survey]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Survey closed
 */
router.patch('/:id/close', authenticate, requirePermission(Permissions.MANAGE_SURVEYS), controller.closeSurvey);

/**
 * @swagger
 * /api/v1/admin/survey/results:
 *   get:
 *     summary: Get aggregated survey results (Indirect Attainment)
 *     tags: [Admin Survey]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *       - in: query
 *         name: semesterId
 *         schema:
 *           type: string
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *       - in: query
 *         name: facultyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully retrieved aggregated results
 */
router.get('/results', authenticate, controller.getSurveyResults);

export default router;
