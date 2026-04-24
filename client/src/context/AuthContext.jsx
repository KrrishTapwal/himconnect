import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hc_user')); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('hc_token'));

  // Always sync fresh user data (including role) from server on load
  useEffect(() => {
    if (!token) return;
    api.get('/users/me').then(({ data }) => {
      localStorage.setItem('hc_user', JSON.stringify(data));
      setUser(data);
    }).catch(() => {});
  }, [token]);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('hc_token', data.token);
    localStorage.setItem('hc_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/signup', { name, email, password });
    localStorage.setItem('hc_token', data.token);
    localStorage.setItem('hc_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    // return full response so caller can read isFoundingMember + memberNumber
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hc_token');
    localStorage.removeItem('hc_user');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      localStorage.setItem('hc_user', JSON.stringify(data));
      setUser(data);
      return data;
    } catch {}
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
