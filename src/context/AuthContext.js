import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext({});
 
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }, []);

  // Fetch current authenticated user
  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data?.user) {
        setUser(response.data.user);
      } else {
        console.warn('No user data in /auth/me response');
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      if (error.response?.status === 401) {
        logout(); // Token invalid or expired
      }
    } finally {
      setLoading(false);
    }
  }, [token, logout]);

  // Set token and headers when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token, fetchUser]);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      const { success, token: newToken, user: loggedInUser, message } = response.data;

      if (!success || !newToken) {
        return { success: false, message: message || 'Login failed' };
      }

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(loggedInUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true, user: loggedInUser };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid email or password'
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);

      const { success, token: newToken, user: newUser, message } = response.data;

      if (success && newToken && newUser) {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(newUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        return { success: true, user: newUser };
      }

      // If registration succeeded but no auto-login
      return { success: true, message: message || 'Registration successful! Please log in.' };
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Update user profile (e.g., after uploading avatar)
  const updateProfile = async (updatedData) => {
    try {
      const response = await api.put('/auth/profile', updatedData);
      if (response.data?.user) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  // Manually refresh user data (useful after profile changes elsewhere)
  const refreshUser = async () => {
    await fetchUser();
  };

  // Check if current user is admin
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value = {
    user,
    setUser,
    loading,
    token,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
