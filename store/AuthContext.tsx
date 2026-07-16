import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, LoginCredentials } from '../types/auth';
import { loadUsers, authenticate, createSession, loadSession, clearSession, initDefaultUsers } from './auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: async () => ({ success: false, error: '未初始化' }),
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化：加载 session
  useEffect(() => {
    const init = async () => {
      await initDefaultUsers();

      const session = loadSession();
      if (session) {
        const users = loadUsers();
        const found = users.find((u) => u.id === session.userId);
        if (found) {
          setUser(found);
        } else {
          clearSession();
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authenticate(credentials);
    if (result.success && result.user) {
      createSession(result.user.id);
      setUser(result.user);
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
