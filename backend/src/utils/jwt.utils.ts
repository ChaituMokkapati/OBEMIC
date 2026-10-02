import jwt from 'jsonwebtoken';
import { Constants } from '../config/constants';

export interface TokenPayload {
  userId: string;
  role: string;
  mustChangePassword?: boolean;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: Constants.JWT_EXPIRES_IN as any,
  });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: Constants.JWT_REFRESH_EXPIRES_IN as any,
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET as string) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string) as TokenPayload;
};
