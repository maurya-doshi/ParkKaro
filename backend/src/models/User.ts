/**
 * User model — corresponds to parkshare-users table.
 * Identity/authentication is managed by Cognito.
 * This model stores profile and role information.
 */

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

export interface CreateUserInput {
  userId: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  profileImage?: string;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  profileImage?: string;
}
