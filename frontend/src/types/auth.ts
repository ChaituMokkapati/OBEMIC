export type RoleName = 'FACULTY' | 'ADMIN' | 'COORDINATOR' | 'MANAGEMENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  employeeId?: string;
  departmentId?: string;
  mustChangePassword?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}

export interface LoginCredentials {
  email?: string;
  employeeId?: string;
  password: string;
}
