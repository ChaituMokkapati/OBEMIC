import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../logs/logger';

export class AuthController {
  private authService = new AuthService();

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, employeeId, password } = req.body;
      if ((!email && !employeeId) || !password) {
        res.status(400).json({ error: 'Email or Employee ID, and password are required' });
        return;
      }
      
      const result = await this.authService.login({ email, employeeId, passwordPlain: password });
      
      // Optionally store refresh token in an httpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({ accessToken: result.accessToken, user: result.user });
    } catch (error: any) {
      logger.error(`Login failed for ${req.body?.email}: ${error.message}`);
      res.status(401).json({ error: error.message });
    }
  };

  public refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      // Refresh token can come from cookie or body
      const token = req.cookies?.refreshToken || req.body.refreshToken;
      if (!token) {
        res.status(400).json({ error: 'Refresh token is required' });
        return;
      }

      const result = await this.authService.refreshToken(token);
      
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      res.json({ accessToken: result.accessToken });
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  public logout = async (req: Request, res: Response): Promise<void> => {
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  };

  public changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        res.status(400).json({ error: 'oldPassword and newPassword are required' });
        return;
      }

      await this.authService.changePassword(req.user.userId, oldPassword, newPassword);
      res.json({ message: 'Password changed successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
