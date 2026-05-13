import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Загрузка сессии при запуске приложения
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const accessToken = await AsyncStorage.getItem('accessToken');
      const expiresAt = await AsyncStorage.getItem('accessTokenExpiresAt');

      // Проверяем, не истёк ли токен
      if (expiresAt && new Date(expiresAt) < new Date()) {
        console.log('Token expired, trying to refresh...');
        // Пробуем обновить токен
        const { apiClient } = require('../services/apiClient');
        const newToken = await apiClient._refreshToken();

        if (!newToken) {
          console.log('Token refresh failed, clearing session');
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          await AsyncStorage.removeItem('accessTokenExpiresAt');
          setUser(null);
          setLoading(false);
          return;
        }
      }

      if (userStr && accessToken) {
        const userData = JSON.parse(userStr);
        setUser({
          id: userData.id,
          login: userData.login,
          name: userData.fullName || userData.name,
          role: userData.role,
          accessToken: accessToken
        });
        console.log('Session loaded for user:', userData.role);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      console.log('Login user data:', userData);

      const userToStore = {
        id: userData.user.id,
        login: userData.user.login,
        fullName: userData.user.name,
        name: userData.user.name,
        role: userData.user.role
      };

      // Сохраняем пользователя и токены
      await AsyncStorage.setItem('user', JSON.stringify(userToStore));
      await AsyncStorage.setItem('accessToken', userData.accessToken);
      await AsyncStorage.setItem('refreshToken', userData.refreshToken);
      await AsyncStorage.setItem('accessTokenExpiresAt', userData.accessTokenExpiresAt);

      setUser({
        id: userData.user.id,
        login: userData.user.login,
        name: userData.user.name,
        role: userData.user.role,
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken
      });

      console.log('User logged in:', userData.user.role);
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('accessTokenExpiresAt');

      setUser(null);
      console.log('User logged out');
    } catch (error) {
      console.error('Failed to clear session:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};