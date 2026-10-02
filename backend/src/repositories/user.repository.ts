import prisma from '../database';
import { User, UserStatus } from '@prisma/client';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email, isDeleted: false },
      include: { role: true, department: true }
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id, isDeleted: false },
      include: { role: true, department: true }
    });
  }

  async findByEmployeeId(employeeId: string) {
    return prisma.user.findUnique({
      where: { employeeId, isDeleted: false },
      include: { role: true, department: true }
    });
  }

  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { 
        passwordHash,
        mustChangePassword: false,
        passwordChangedAt: new Date()
      }
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() }
    });
  }
}
