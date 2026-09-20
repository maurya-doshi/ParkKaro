import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/user';
import { DEMO_USERS } from '../api/mockData';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  login: (role?: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'parkshare_auth_user';
const AUTH_TOKEN_KEY = 'parkshare_auth_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(AUTH_USER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.userId === 'user_driver1') return DEMO_USERS.driver;
        if (parsed.userId === 'user_host1') return DEMO_USERS.host;
        if (parsed.userId === 'user_admin1') return DEMO_USERS.admin;
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }
    return DEMO_USERS.driver;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_TOKEN_KEY) || 'mock_cognito_jwt_token_demo';
  });

  const role: UserRole = user?.role || 'DRIVER';

  useEffect(() => {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, [token]);

  const switchRole = (newRole: UserRole) => {
    if (newRole === 'DRIVER') setUser(DEMO_USERS.driver);
    else if (newRole === 'HOST') setUser(DEMO_USERS.host);
    else if (newRole === 'ADMIN') setUser(DEMO_USERS.admin);
  };

  const login = (loginRole: UserRole = 'DRIVER') => {
    switchRole(loginRole);
    setToken(`mock_cognito_jwt_${loginRole.toLowerCase()}_token`);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
