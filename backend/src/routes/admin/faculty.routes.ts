import { Router } from 'express';
import { AdminFacultyController } from '../../controllers/admin/admin.faculty.controller';
import { upload } from '../../middleware/upload.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/role.middleware';
import { Permissions } from '../../config/permissions';

const router = Router();
const controller = new AdminFacultyController();

// Use middleware to authenticate and authorize ADMIN for these endpoints
router.use(authenticate);
router.use(requirePermission(Permissions.FACULTY_UPLOAD));

router.post('/upload/preview', upload.single('file'), controller.previewImport);
router.post('/upload/confirm', controller.confirmImport);
router.post('/create', controller.createFaculty);

/**
 * @swagger
 * /api/v1/admin/faculty/list:
 *   get:
 *     summary: Get a list of faculty members
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *         description: Optional department ID to filter the faculty
 *     responses:
 *       200:
 *         description: List of faculty
 */
router.get('/list', controller.getFacultyList);

/**
 * @swagger
 * /api/v1/admin/faculty/assign:
 *   post:
 *     summary: Manually assign a subject to a faculty member
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - facultyId
 *               - subjectId
 *               - academicYearId
 *             properties:
 *               facultyId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               academicYearId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully assigned
 */
router.post('/assign', controller.assignSubject);

/**
 * @swagger
 * /api/v1/admin/faculty/assignment/{id}:
 *   delete:
 *     summary: Un-assign a subject from a faculty member
 *     tags: [Admin]
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
 *         description: Successfully un-assigned
 */
router.delete('/assignment/:id', controller.unassignSubject);

export default router;
