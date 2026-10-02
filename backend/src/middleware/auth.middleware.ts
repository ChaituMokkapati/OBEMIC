import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt.utils';

// Extend Express Request object
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    
    // Check restricted state
    // [OPTIONAL PASSWORD CHANGE] Disabled forced redirect
    /*
    if (payload.mustChangePassword) {
      ...
    }
    */

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
};
