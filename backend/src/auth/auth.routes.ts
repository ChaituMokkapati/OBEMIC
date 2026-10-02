import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 */
router.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Log out
 *     tags: [Auth]
 */
router.post('/logout', authController.logout);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Auth]
 */
router.post('/change-password', authenticate, authController.changePassword);

export default router;
