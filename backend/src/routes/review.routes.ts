import { Router } from 'express';
import { ReviewController } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/role.middleware';
import { Permissions } from '../config/permissions';

const router = Router();
const reviewController = new ReviewController();

// All review routes require the REVIEW_REPORT permission
router.use(authenticate);
router.use(requirePermission(Permissions.REVIEW_REPORT));

/**
 * @swagger
 * /api/v1/review/dashboard:
 *   get:
 *     summary: Get dashboard statistics for reviews
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats successfully retrieved
 */
router.get('/dashboard', reviewController.getDashboardStats);

/**
 * @swagger
 * /api/v1/review/reports/pending:
 *   get:
 *     summary: Get all pending reports awaiting review
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending reports
 */
router.get('/reports/pending', reviewController.getPendingReports);

/**
 * @swagger
 * /api/v1/review/reports/{id}/approve:
 *   post:
 *     summary: Approve a submitted report
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The report ID
 *     responses:
 *       200:
 *         description: Report successfully approved
 */
router.post('/reports/:id/approve', reviewController.approveReport);

/**
 * @swagger
 * /api/v1/review/reports/{id}/reject:
 *   post:
 *     summary: Reject a submitted report with feedback
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The report ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: The feedback/reason for rejection
 *     responses:
 *       200:
 *         description: Report successfully rejected
 */
router.post('/reports/:id/reject', reviewController.rejectReport);

export default router;
