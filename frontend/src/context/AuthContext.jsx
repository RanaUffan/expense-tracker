import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('checking'); // 'checking' | 'authed' | 'guest'

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus('guest');
      return;
    }
    api
      .me()
      .then(({ user }) => {
        setUser(user);
        setStatus('authed');
      })
      .catch(() => {
        clearToken();
        setStatus('guest');
      });
  }, []);

  const signup = useCallback(async (data) => {
    const { token, user } = await api.signup(data);
    setToken(token);
    setUser(user);
    setStatus('authed');
  }, []);

  const login = useCallback(async (data) => {
    const { token, user } = await api.login(data);
    setToken(token);
    setUser(user);
    setStatus('authed');
  }, []);

  const loginWithGoogle = useCallback(async (credential) => {
    const { token, user } = await api.googleLogin(credential);
    setToken(token);
    setUser(user);
    setStatus('authed');
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setStatus('guest');
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, signup, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
