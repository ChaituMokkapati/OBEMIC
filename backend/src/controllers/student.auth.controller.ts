import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../database';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { logger } from '../logs/logger';
import { Constants } from '../config/constants';

export class StudentAuthController {
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { rollNumber, password } = req.body;

      if (!rollNumber || !password) {
        res.status(400).json({ error: 'Roll number and password are required' });
        return;
      }

      const student = await prisma.student.findUnique({
        where: { rollNumber, isDeleted: false },
      });

      if (!student) {
        res.status(401).json({ error: 'Invalid roll number or password' });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, student.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid roll number or password' });
        return;
      }

      const payload = {
        userId: student.id,
        role: 'STUDENT',
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Set refresh token in cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, 
      });

      logger.info(`Student logged in: ${student.rollNumber}`);

      res.json({
        accessToken,
        student: {
          id: student.id,
          rollNumber: student.rollNumber,
          name: student.name,
        },
      });
    } catch (error: any) {
      logger.error('Student login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}
