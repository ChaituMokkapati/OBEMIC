import { AuthService } from '../../src/services/auth.service';
import { UserRepository } from '../../src/repositories/user.repository';
import bcrypt from 'bcrypt';
import { generateAccessToken, generateRefreshToken } from '../../src/utils/jwt.utils';
import { UserStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../../src/repositories/user.repository');
jest.mock('bcrypt');
jest.mock('../../src/utils/jwt.utils');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
    // @ts-ignore - accessing private property for mocking
    mockUserRepo = authService.userRepo as jest.Mocked<UserRepository>;
  });

  describe('login()', () => {
    const mockUser = {
      id: '1',
      name: 'Test Faculty',
      email: 'faculty@test.com',
      employeeId: '2042',
      passwordHash: 'hashed_password',
      status: UserStatus.ACTIVE,
      role: { roleName: 'FACULTY' },
      department: { departmentName: 'CSE' },
      mustChangePassword: true,
    };

    it('should login with employeeId successfully', async () => {
      mockUserRepo.findByEmployeeId.mockResolvedValue(mockUser as any);
      mockUserRepo.updateLastLogin.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (generateAccessToken as jest.Mock).mockReturnValue('mock_access_token');
      (generateRefreshToken as jest.Mock).mockReturnValue('mock_refresh_token');

      const result = await authService.login({ employeeId: '2042', passwordPlain: 'password' });

      expect(mockUserRepo.findByEmployeeId).toHaveBeenCalledWith('2042');
      expect(mockUserRepo.updateLastLogin).toHaveBeenCalledWith('1');
      expect(result.accessToken).toBe('mock_access_token');
      expect(result.user.employeeId).toBe('2042');
      expect(result.user.mustChangePassword).toBe(true);
    });

    it('should login with email successfully', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(mockUser as any);
      mockUserRepo.updateLastLogin.mockResolvedValue(undefined);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await authService.login({ email: 'faculty@test.com', passwordPlain: 'password' });

      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('faculty@test.com');
      expect(mockUserRepo.findByEmployeeId).not.toHaveBeenCalled();
    });

    it('should throw error on invalid credentials', async () => {
      mockUserRepo.findByEmployeeId.mockResolvedValue(null);
      await expect(authService.login({ employeeId: '9999', passwordPlain: 'wrong' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error if account is locked', async () => {
      mockUserRepo.findByEmployeeId.mockResolvedValue({ ...mockUser, status: UserStatus.LOCKED } as any);
      await expect(authService.login({ employeeId: '2042', passwordPlain: 'pass' }))
        .rejects.toThrow('User account is locked or inactive');
    });
  });
});
