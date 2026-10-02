import { Router } from 'express';
import { StudentSurveyController } from '../controllers/student.survey.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const controller = new StudentSurveyController();

// Only apply authenticate, no role middleware since role is checked manually or assumed by endpoint name, 
// but we could add a role check for STUDENT. Let's rely on token payload role inside controller if needed.

/**
 * @swagger
 * /api/v1/student/dashboard:
 *   get:
 *     summary: Get student dashboard
 *     tags: [Student Survey]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard data
 */
router.get('/dashboard', authenticate, controller.getDashboard);

/**
 * @swagger
 * /api/v1/student/subjects:
 *   get:
 *     summary: Get pending survey subjects
 *     tags: [Student Survey]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending survey subjects
 */
router.get('/subjects', authenticate, controller.getSubjects);

/**
 * @swagger
 * /api/v1/student/subjects/{id}/survey:
 *   get:
 *     summary: Get survey details and COs for a specific faculty assignment
 *     tags: [Student Survey]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The faculty assignment ID
 *     responses:
 *       200:
 *         description: Survey details and COs
 */
router.get('/subjects/:id/survey', authenticate, controller.getSurveyDetails);

/**
 * @swagger
 * /api/v1/student/survey/submit:
 *   post:
 *     summary: Submit a survey response
 *     tags: [Student Survey]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facultyAssignmentId
 *               - ratings
 *             properties:
 *               facultyAssignmentId:
 *                 type: string
 *               ratings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     courseOutcomeId:
 *                       type: string
 *                     rating:
 *                       type: number
 */
router.post('/survey/submit', authenticate, controller.submitSurvey);

export default router;
