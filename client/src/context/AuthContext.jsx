import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('kauth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      if (token) {
        try {
          const base = import.meta.env.VITE_API_URL || '';
await axios.get(`${base}/api/auth/verify`, { headers: { Authorization: `Bearer ${token}` } });
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    verify();
  }, []);

  const login = async (username, password) => {
    const res = await axios.post('/api/auth/login', { username, password });
    const { token: t } = res.data;
    localStorage.setItem('kauth_token', t);
    setToken(t);
    axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('kauth_token');
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuth: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
