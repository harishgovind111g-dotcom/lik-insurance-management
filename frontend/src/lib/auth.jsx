import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearToken, getToken, onUnauthorized, setToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Restore the session from a saved token.
  useEffect(() => {
    onUnauthorized(() => { clearToken(); setUser(null); });
    if (!getToken()) { setReady(true); return; }
    api.get('/auth/me')
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setReady(true));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (form) => {
    const res = await api.post('/auth/register', form);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const value = useMemo(() => ({
    user, ready, login, register, logout, setUser,
    isAdmin: user?.role === 'admin'
  }), [user, ready, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
