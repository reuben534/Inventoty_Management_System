import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { api, setToken, getToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  demoUsers: User[];
  defaultPassword: string;
  darkMode: boolean;
  toggleDarkMode: () => void;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoUser: (userOrRole: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [defaultPassword, setDefaultPassword] = useState('Password123!');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('inv_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('inv_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('inv_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Load demo accounts list
  useEffect(() => {
    api
      .getDemoUsers()
      .then((data) => {
        setDemoUsers(data.users || []);
        if (data.defaultPassword) setDefaultPassword(data.defaultPassword);
      })
      .catch((err) => console.error('Error fetching demo users:', err));
  }, []);

  // Check existing session
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    api
      .getProfile()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password = defaultPassword) => {
    const res = await api.login({ email, password });
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const switchDemoUser = async (roleOrEmail: string) => {
    setIsLoading(true);
    try {
      let targetUser = demoUsers.find((u) => u.email.toLowerCase() === roleOrEmail.toLowerCase());
      if (!targetUser) {
        targetUser = demoUsers.find((u) => u.role === roleOrEmail);
      }
      if (!targetUser && demoUsers.length > 0) {
        targetUser = demoUsers[0];
      }

      if (targetUser) {
        await login(targetUser.email, defaultPassword);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getProfile();
      setUser(res.user);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        loading: isLoading,
        demoUsers,
        defaultPassword,
        darkMode,
        toggleDarkMode,
        login,
        logout,
        switchDemoUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
