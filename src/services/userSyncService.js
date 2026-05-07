import { db } from '../db/database';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToSyncQueue, processSyncQueue } from './syncQueueService';
import NetInfo from '@react-native-community/netinfo';

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

// Получение пользователя по ID
export const getUserById = (userId) => {
  try {
    const result = db.execute(`SELECT * FROM users WHERE id = ? AND isDeleted = 0`, [userId]);
    return result.rows?._array?.[0] || null;
  } catch (error) {
    console.error('Failed to get user by id:', error);
    return null;
  }
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

// Добавление пользователя
export const addUser = async (userData) => {
  // Проверяем, нет ли уже пользователя с таким логином локально
  const existingLocal = getLocalUsers().find(u => u.login === userData.login);
  if (existingLocal && !existingLocal.id.toString().startsWith('local_')) {
    console.log('User already exists locally');
    return existingLocal;
  }
  
  // Генерируем временный локальный ID
  const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Создаем объект пользователя
  const localUser = {
    id: localId,
    login: userData.login,
    fullName: userData.fullName,
    role: userData.role,
    version: 1,
    updatedDt: new Date().toISOString(),
    isDeleted: false
  };
  
  // Сохраняем локально
  upsertUsers([localUser]);
  
  // Добавляем в очередь синхронизации
  addToSyncQueue('users', 'INSERT', localId, userData);
  
  // Пробуем синхронизировать сразу
  const netState = await NetInfo.fetch();
  if (netState.isConnected) {
    await processSyncQueue();
  }
  
  // Получаем обновленного пользователя (возможно, уже с серверным ID)
  return getUserById(localId) || localUser;
};

// Обновление роли пользователя
export const updateUserRole = async (userId, newRole) => {
  // Получаем текущего пользователя
  const user = getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Проверяем, не та ли же роль
  if (user.role === newRole) {
    console.log('Role is already the same, skipping');
    return true;
  }
  
  // Обновляем локально
  db.execute(
    `UPDATE users SET role = ?, updatedAt = ?, version = version + 1 WHERE id = ?`,
    [newRole, new Date().toISOString(), userId]
  );
  
  // Проверяем, нет ли уже такой операции в очереди
  const existingInQueue = db.execute(
    `SELECT * FROM sync_queue WHERE entity_name = 'users' AND local_id = ? AND operation = 'UPDATE' AND synced = 0`,
    [userId]
  );
  
  if (existingInQueue.rows?._array?.length === 0) {
    // Добавляем в очередь только если нет такой же
    addToSyncQueue('users', 'UPDATE', userId, { newRole: newRole });
  } else {
    console.log('Update already in queue, skipping duplicate');
  }
  
  // Пробуем синхронизировать сразу (только если не идет синхронизация)
  const netState = await NetInfo.fetch();
  if (netState.isConnected && !isSyncing) {
    setTimeout(() => processSyncQueue(), 1000);
  }
  
  return true;
};

// Удаление пользователя
export const deleteUser = async (userId) => {
  // Получаем пользователя
  const user = getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  
  // Проверяем, не local ли это ID (еще не синхронизирован)
  const isLocalId = user.id.toString().startsWith('local_');
  
  if (isLocalId) {
    // Если пользователь еще не синхронизирован - просто удаляем локально
    db.execute(`DELETE FROM users WHERE id = ?`, [userId]);
    // Удаляем из очереди, если есть
    db.execute(`DELETE FROM sync_queue WHERE local_id = ?`, [userId]);
    console.log(`Deleted unsynced user ${user.fullName} locally`);
  } else {
    // Помечаем как удаленного локально
    db.execute(
      `UPDATE users SET isDeleted = 1, updatedAt = ?, version = version + 1 WHERE id = ?`,
      [new Date().toISOString(), userId]
    );
    
    // Добавляем в очередь синхронизации
    addToSyncQueue('users', 'DELETE', userId, { id: userId });
    
    // Пробуем синхронизировать сразу
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      await processSyncQueue();
    }
  }
  
  return true;
};

// Синхронизация пользователей с сервера (pull)
export const syncUsers = async () => {
  try {
    const netState = await NetInfo.fetch();
    
    if (!netState.isConnected) {
      console.log('No internet, using cached users');
      return false;
    }

    const lastSync = await AsyncStorage.getItem('last_user_sync_time');
    const response = await apiClient.get(`/Sync/users?since=${lastSync || ''}`);
    
    if (response.success && response.data) {
      const serverUsers = response.data;
      
      if (serverUsers.length > 0) {
        // Обновляем локальных пользователей
        serverUsers.forEach(serverUser => {
          const localUser = getLocalUsers().find(u => u.id === serverUser.id);
          
          if (!localUser || serverUser.version > localUser.version) {
            upsertUsers([serverUser]);
          }
        });
        
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