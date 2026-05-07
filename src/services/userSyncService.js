import { db } from '../db/database';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Получение пользователей из локальной БД
export const getLocalUsers = () => {
  try {
    const result = db.execute(`SELECT * FROM users WHERE isDeleted = 0 ORDER BY fullName`);
    return result.rows?._array || [];
  } catch (error) {
    console.error('Failed to get local users:', error);
    return [];
  }
};

// Получение врачей
export const getDoctors = () => {
  const users = getLocalUsers();
  return users.filter(u => u.role === 'doctor');
};

// Получение медсестер
export const getNurses = () => {
  const users = getLocalUsers();
  return users.filter(u => u.role === 'nurse');
};

// Обновление пользователей в локальной БД
export const upsertUsers = (users) => {
  try {
    users.forEach(u => {
      db.execute(
        `INSERT OR REPLACE INTO users 
         (id, login, fullName, role, version, updatedAt, isDeleted)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          u.id,
          u.login,
          u.fullName,
          u.role,
          u.version || 1,
          u.updatedDt || new Date().toISOString(),
          u.isDeleted ? 1 : 0
        ]
      );
    });
    console.log(`Upserted ${users.length} users`);
  } catch (error) {
    console.error('Failed to upsert users:', error);
  }
};

// Синхронизация пользователей с сервером
export const syncUsers = async () => {
  try {
    // Проверяем интернет
    const NetInfo = require('@react-native-community/netinfo').default;
    const netState = await NetInfo.fetch();
    
    if (!netState.isConnected) {
      console.log('No internet, using cached users');
      return false;
    }

    // Получаем время последней синхронизации
    const lastSync = await AsyncStorage.getItem('last_user_sync_time');
    
    // Запрос к серверу через apiClient
    const response = await apiClient.get(`/Sync/users?since=${lastSync || ''}`);
    
    if (response.success && response.data) {
      const serverUsers = response.data;
      
      if (serverUsers.length > 0) {
        upsertUsers(serverUsers);
        await AsyncStorage.setItem('last_user_sync_time', new Date().toISOString());
        console.log(`Synced ${serverUsers.length} users`);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to sync users:', error);
    return false;
  }
};

// Добавление пользователя
export const addUser = async (userData) => {
  try {
    const response = await apiClient.post('/Auth/users', userData);
    
    if (response.success && response.data) {
      upsertUsers([response.data]);
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to create user');
  } catch (error) {
    console.error('Failed to add user:', error);
    throw error;
  }
};

// Обновление роли пользователя
export const updateUserRole = async (userId, newRole) => {
  try {
    const response = await apiClient.put(`/Auth/users/${userId}/role`, newRole);
    
    if (response.success) {
      db.execute(
        `UPDATE users SET role = ?, updatedAt = ? WHERE id = ?`,
        [newRole, new Date().toISOString(), userId]
      );
      return true;
    }
    
    throw new Error(response.message || 'Failed to update user role');
  } catch (error) {
    console.error('Failed to update user role:', error);
    throw error;
  }
};

// Удаление пользователя
export const deleteUser = async (userId) => {
  try {
    const response = await apiClient.delete(`/Auth/users/${userId}`);
    
    if (response.success) {
      db.execute(
        `UPDATE users SET isDeleted = 1, updatedAt = ? WHERE id = ?`,
        [new Date().toISOString(), userId]
      );
      return true;
    }
    
    throw new Error(response.message || 'Failed to delete user');
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
};

// Получение статистики пользователей
export const getUserStats = () => {
  try {
    const doctorsResult = db.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'doctor' AND isDeleted = 0`);
    const nursesResult = db.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'nurse' AND isDeleted = 0`);
    
    return {
      doctors: doctorsResult.rows?._array?.[0]?.count || 0,
      nurses: nursesResult.rows?._array?.[0]?.count || 0,
      total: getLocalUsers().length
    };
  } catch (error) {
    console.error('Failed to get user stats:', error);
    return { doctors: 0, nurses: 0, total: 0 };
  }
};