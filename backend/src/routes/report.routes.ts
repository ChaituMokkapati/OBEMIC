import { Router } from 'express';
import { upload } from '../middleware/upload.middleware';
import { ReportController } from '../controllers/report.controller';

import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/role.middleware';
import { Permissions } from '../config/permissions';

const router = Router();
const reportController = new ReportController();

/**
 * @swagger
 * /api/v1/reports/generate/internal:
 *   post:
 *     summary: Generate an Internal OBE report from faculty marks
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - facultyWorkbook
 *               - subjectCode
 *             properties:
 *               facultyWorkbook:
 *                 type: string
 *                 format: binary
 *               subjectCode:
 *                 type: string
 *                 description: The code of the subject (e.g., 23ME4T01)
 *     responses:
 *       200:
 *         description: Generated Internal Excel report
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post(
  '/generate/internal',
  authenticate,
  requirePermission(Permissions.GENERATE_REPORT),
  upload.single('facultyWorkbook'),
  reportController.generateInternalReport
);

/**
 * @swagger
 * /api/v1/reports/generate/external:
 *   post:
 *     summary: Generate an External OBE report from external marks
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - externalWorkbook
 *               - subjectCode
 *             properties:
 *               externalWorkbook:
 *                 type: string
 *                 format: binary
 *               subjectCode:
 *                 type: string
 *                 description: The code of the subject (e.g., 23ME4T01)
 *     responses:
 *       200:
 *         description: Generated External Excel report
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post(
  '/generate/external',
  authenticate,
  requirePermission(Permissions.GENERATE_REPORT),
  upload.single('externalWorkbook'), 
  reportController.generateExternalReport
);

/**
 * @swagger
 * /api/v1/reports/generate/lab:
 *   post:
 *     summary: Generate a Lab OBE report from lab marks
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - labWorkbook
 *               - subjectCode
 *             properties:
 *               labWorkbook:
 *                 type: string
 *                 format: binary
 *               subjectCode:
 *                 type: string
 *                 description: The code of the subject (e.g., 23ME4T01)
 *     responses:
 *       200:
 *         description: Generated Lab Excel report
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post(
  '/generate/lab',
  authenticate,
  requirePermission(Permissions.GENERATE_REPORT),
  upload.single('labWorkbook'), 
  reportController.generateLabReport
);

/**
 * @swagger
 * /api/v1/reports/history:
 *   get:
 *     summary: Get faculty report history
 *     tags: [Reports]
 */
router.get(
  '/history',
  authenticate,
  requirePermission(Permissions.VIEW_OWN_REPORTS),
  reportController.getHistory
);

/**
 * @swagger
 * /api/v1/reports/download/{id}:
 *   get:
 *     summary: Download a generated report
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The report history ID
 *     responses:
 *       200:
 *         description: Generated Excel file
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/download/:id',
  authenticate,
  reportController.downloadReport
);

/**
 * @swagger
 * /api/v1/reports/{id}/submit:
 *   post:
 *     summary: Submit a drafted report
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully submitted the report
 */
router.post(
  '/:id/submit',
  authenticate,
  reportController.submitReport
);

router.post(
  '/submit/:id',
  authenticate,
  reportController.submitReport
);

export default router;
