import { Router } from 'express';
import { AcademicController } from '../controllers/academic.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/role.middleware';
import { Permissions } from '../config/permissions';

const router = Router();
const academicController = new AcademicController();

/**
 * @swagger
 * /api/v1/academic/departments:
 *   get:
 *     summary: Get all departments
 *     tags: [Academic]
 *     responses:
 *       200:
 *         description: A list of departments
 */
router.get('/departments', authenticate, academicController.getDepartments);

/**
 * @swagger
 * /api/v1/academic/subjects:
 *   get:
 *     summary: Get all subjects
 *     tags: [Academic]
 *     responses:
 *       200:
 *         description: A list of subjects
 */
router.get('/subjects', authenticate, academicController.getSubjects);

/**
 * @swagger
 * /api/v1/academic/sections:
 *   get:
 *     summary: Get all sections
 *     tags: [Academic]
 */
router.get('/sections', authenticate, academicController.getSections);

/**
 * @swagger
 * /api/v1/academic/subjects:
 *   post:
 *     summary: Create a new subject
 *     tags: [Academic]
 */
router.post('/subjects', authenticate, requirePermission(Permissions.MANAGE_SUBJECTS), academicController.createSubject);

/**
 * @swagger
 * /api/v1/academic/years:
 *   get:
 *     summary: Get all academic years
 *     tags: [Academic]
 */
router.get('/years', authenticate, academicController.getAcademicYears);

/**
 * @swagger
 * /api/v1/academic/years:
 *   post:
 *     summary: Create a new academic year
 *     tags: [Academic]
 */
router.post('/years', authenticate, requirePermission(Permissions.MANAGE_SUBJECTS), academicController.createAcademicYear);

/**
 * @swagger
 * /api/v1/academic/semesters:
 *   post:
 *     summary: Create a new semester
 *     tags: [Academic]
 */
router.post('/semesters', authenticate, requirePermission(Permissions.MANAGE_SUBJECTS), academicController.createSemester);

/**
 * @swagger
 * /api/v1/academic/assignments:
 *   post:
 *     summary: Assign a faculty to a subject
 *     tags: [Academic]
 */
router.post('/assignments', authenticate, requirePermission(Permissions.ASSIGN_FACULTY), academicController.assignFaculty);

export default router;
