export type UserRole = 'DRIVER' | 'HOST' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface User {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  role: UserRole;
}
