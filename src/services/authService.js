import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './apiClient';
import { syncUsers } from './userSyncService';

export const loginRequest = async (login, password) => {
  try {
    console.log('Attempting login for:', login);
    
    const response = await apiClient.post('/Auth/login', {
      login,
      password,
      deviceId: 'mobile_app',
      deviceName: 'Mobile Device'
    }, false);

    if (response.success && response.data) {
      const data = response.data;
      
      console.log('Login successful for:', login, 'Role:', data.role);
      
      // Сохраняем токены
      await AsyncStorage.setItem('accessToken', data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify({
        id: data.userId,
        login: data.login,
        fullName: data.fullName,
        role: data.role
      }));
      await AsyncStorage.setItem('accessTokenExpiresAt', data.accessTokenExpiresAt);
      
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

export const getCurrentUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    const accessToken = await AsyncStorage.getItem('accessToken');
    
    if (userStr && accessToken) {
      const user = JSON.parse(userStr);
      return {
        id: user.id,
        login: user.login,
        name: user.fullName || user.name,
        role: user.role,
        accessToken: accessToken
      };
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
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('accessTokenExpiresAt');
  }
};

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