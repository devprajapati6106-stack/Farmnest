import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import api from '../api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem('farmhouse_token');

    if (!token) {
      setLoading(false);
      return undefined;
    }

    async function restoreSession() {
      try {
        const response = await api.get('/auth/me');
        if (!cancelled) {
          setUser(response.data.user);
        }
      } catch {
        localStorage.removeItem('farmhouse_token');
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('farmhouse_token', response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (payload) => {
    const response = await api.post('/auth/register', payload);
    localStorage.setItem('farmhouse_token', response.data.token);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = () => {
    localStorage.removeItem('farmhouse_token');
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
