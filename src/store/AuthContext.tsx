import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  name: string;
  email?: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  privileges: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hasPrivilege: (privilege: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('https://backend.youware.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'فشل تسجيل الدخول' }));
        throw new Error(error.error || 'فشل تسجيل الدخول');
      }

      const result = await response.json();
      
      if (!result.success || !result.data?.user) {
        throw new Error(result.error || 'فشل تسجيل الدخول');
      }

      const userData = result.data.user;
      
      // Parse privileges if it's a JSON string
      if (typeof userData.privileges === 'string') {
        try {
          userData.privileges = JSON.parse(userData.privileges);
        } catch {
          userData.privileges = [];
        }
      }
      
      // Ensure privileges is always an array
      if (!Array.isArray(userData.privileges)) {
        userData.privileges = [];
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const hasPrivilege = (privilege: string): boolean => {
    if (!user) return false;
    // Admins have all privileges
    if (user.role === 'admin') return true;
    // Check if user has the specific privilege
    return user.privileges.includes(privilege);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasPrivilege,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
