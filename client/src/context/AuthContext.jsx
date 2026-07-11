import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    console.log('[AuthContext] Reading stored user:', storedUser ? 'Found' : 'Not found');
    console.log('[AuthContext] Reading stored token:', token ? 'Present' : 'MISSING');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (e) {
    console.error('[AuthContext] Error reading stored user:', e);
    localStorage.removeItem('user');
    return null;
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    console.log('[AuthContext] loadUser called, token:', token ? 'Present' : 'MISSING');
    
    if (!token) {
      console.log('[AuthContext] No token found, setting user to null');
      setUser(null);
      setLoading(false);
      return;
    }
    
    try {
      console.log('[AuthContext] Calling authAPI.getMe()...');
      const res = await authAPI.getMe();
      console.log('[AuthContext] getMe response:', res.data);
      setUser(res.data.data);
    } catch (err) {
      console.error('[AuthContext] getMe failed:', err.response?.status, err.response?.data);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    console.log('[AuthContext] Login attempt for:', email);
    const res = await authAPI.login({ email, password });
    const { token, ...userData } = res.data.data;
    console.log('[AuthContext] Login successful, token stored:', token ? 'Yes' : 'NO');
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const register = async (name, email, password) => {
    console.log('[AuthContext] Register attempt for:', email);
    const res = await authAPI.register({ name, email, password });
    const { token, ...userData } = res.data.data;
    console.log('[AuthContext] Register successful, token stored:', token ? 'Yes' : 'NO');
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return res.data;
  };

  const logout = () => {
    console.log('[AuthContext] Logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (data) => {
    const res = await authAPI.updateProfile(data);
    setUser(res.data.data);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;