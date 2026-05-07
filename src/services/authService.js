import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';
import { syncUsers } from './userSyncService';

export const loginRequest = async (login, password) => {
  try {
    const response = await apiClient.post('/Auth/login', {
      login,
      password,
      deviceId: 'mobile_app',
      deviceName: 'Mobile Device'
    }, false); // false = не требует авторизации
    
    if (response.success && response.data) {
      const data = response.data;
      
      // Сохраняем токены
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify({
        id: data.userId,
        login: data.login,
        fullName: data.fullName,
        role: data.role
      }));
      
      // Если пользователь - заведующий, синхронизируем список сотрудников
      if (data.role === 'head') {
        await syncUsers();
      }
      
      return data;
    }
    
    throw new Error(response.message || 'Login failed');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// ДОБАВЬТЕ ЭТУ ФУНКЦИЮ ↓
export const getSession = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    if (userStr && accessToken) {
      return {
        user: JSON.parse(userStr),
        accessToken,
        refreshToken,
        isAuthenticated: true
      };
    }
    
    return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
  } catch (error) {
    console.error('Failed to get session:', error);
    return { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
  }
};

export const getCurrentUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

export const logout = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (refreshToken) {
      await apiClient.post('/Auth/logout', refreshToken);
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
  }
};