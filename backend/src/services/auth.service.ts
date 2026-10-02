import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { UserStatus } from '@prisma/client';

export class AuthService {
  private userRepo = new UserRepository();

  async login(credentials: { email?: string, employeeId?: string, passwordPlain: string }) {
    let user;
    if (credentials.employeeId) {
      user = await this.userRepo.findByEmployeeId(credentials.employeeId);
    } else if (credentials.email) {
      user = await this.userRepo.findByEmail(credentials.email);
    }

    if (!user) {
      throw new Error('Invalid credentials');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('User account is locked or inactive');
    }

    const isValid = await bcrypt.compare(credentials.passwordPlain, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update lastLoginAt
    await this.userRepo.updateLastLogin(user.id);

    const payload = { userId: user.id, role: user.role.roleName, mustChangePassword: user.mustChangePassword };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role.roleName,
        department: user.department?.departmentName,
        mustChangePassword: user.mustChangePassword
      }
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = verifyRefreshToken(token);
      
      // Optionally verify user still exists and is active
      const user = await this.userRepo.findById(payload.userId);
      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new Error('User not found or inactive');
      }

      const newPayload = { userId: user.id, role: user.role.roleName };
      const newAccessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (e) {
      throw new Error('Invalid refresh token');
    }
  }

  async changePassword(userId: string, oldPasswordPlain: string, newPasswordPlain: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(oldPasswordPlain, user.passwordHash);
    if (!isValid) throw new Error('Incorrect old password');

    const newHash = await bcrypt.hash(newPasswordPlain, 10);
    await this.userRepo.updatePassword(userId, newHash);
  }
}
