import { Router } from 'express';
import { StudentAuthController } from '../controllers/student.auth.controller';

const router = Router();
const studentAuthController = new StudentAuthController();

/**
 * @swagger
 * /api/v1/student/login:
 *   post:
 *     summary: Login a student
 *     tags: [Student Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rollNumber
 *               - password
 *             properties:
 *               rollNumber:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', studentAuthController.login);

export default router;
