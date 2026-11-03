import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/auth/me').then((r) => setUser(r.data.data)).catch(() => {}).finally(() => setLoading(false)); }, []);
  const login = useCallback(async (body) => { const r = await api.post('/auth/login', body); setUser(r.data.data); return r.data.data; }, []);
  const register = useCallback(async (body) => { const r = await api.post('/auth/register', body); setUser(r.data.data); return r.data.data; }, []);
  const logout = useCallback(async () => { await api.post('/auth/logout'); setUser(null); }, []);
  return <Ctx.Provider value={{ user, setUser, loading, login, register, logout, isStaff: ['admin', 'staff'].includes(user?.role) }}>{children}</Ctx.Provider>;
}
