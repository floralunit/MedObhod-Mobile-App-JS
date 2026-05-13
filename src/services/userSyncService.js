import { db } from '../db/database';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToSyncQueue } from './syncQueueService';
import NetInfo from '@react-native-community/netinfo';
import { canSyncNow, invalidateCanSyncCache } from './networkCheckService';

export const getLocalUsers = () => {
  try {
    const result = db.execute('SELECT * FROM users WHERE isDeleted = 0 ORDER BY fullName');
    return result.rows?._array || [];
  } catch (error) {
    console.error('Failed to get local users:', error);
    return [];
  }
};

export const getDoctors = () => getLocalUsers().filter(u => u.role === 'doctor');
export const getNurses = () => getLocalUsers().filter(u => u.role === 'nurse');

export const getUserById = (userId) => {
  try {
    const result = db.execute('SELECT * FROM users WHERE id = ? AND isDeleted = 0', [userId]);
    return result.rows?._array?.[0] || null;
  } catch (error) {
    console.error('Failed to get user by id:', error);
    return null;
  }
};

export const upsertUsers = (users) => {
  try {
    users.forEach(u => {
      db.execute(
        `INSERT OR REPLACE INTO users 
         (id, login, fullName, role, version, updatedAt, isDeleted)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.login, u.fullName, u.role, u.version || 1, u.updatedDt || new Date().toISOString(), u.isDeleted ? 1 : 0]
      );
    });
  } catch (error) {
    console.error('Failed to upsert users:', error);
  }
};

export const addUser = async (userData) => {
  const existingLocal = getLocalUsers().find(u => u.login === userData.login);
  if (existingLocal && !existingLocal.id.toString().startsWith('local_')) {
    return existingLocal;
  }

  const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  upsertUsers([{ id: localId, ...userData, version: 1, updatedDt: new Date().toISOString(), isDeleted: false }]);

  addToSyncQueue('users', 'INSERT', localId, userData);

  const netState = await NetInfo.fetch();
  if (netState.isConnected) {
    await processSyncQueue();
  }

  return getUserById(localId);
};

export const updateUserRole = async (userId, newRole) => {
  const user = getUserById(userId);
  if (!user || user.role === newRole) return true;

  db.execute(
    'UPDATE users SET role = ?, updatedAt = ?, version = version + 1 WHERE id = ?',
    [newRole, new Date().toISOString(), userId]
  );

  addToSyncQueue('users', 'UPDATE', userId, { newRole });

  const netState = await NetInfo.fetch();
  if (netState.isConnected) {
    await processSyncQueue();
  }

  return true;
};

export const deleteUser = async (userId) => {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');

  const isLocalId = user.id.toString().startsWith('local_');

  if (isLocalId) {
    db.execute('DELETE FROM users WHERE id = ?', [userId]);
    db.execute('DELETE FROM sync_queue WHERE local_id = ?', [userId]);
  } else {
    db.execute(
      'UPDATE users SET isDeleted = 1, updatedAt = ?, version = version + 1 WHERE id = ?',
      [new Date().toISOString(), userId]
    );
    addToSyncQueue('users', 'DELETE', userId, { id: userId });
  }

  const netState = await NetInfo.fetch();
  if (netState.isConnected) {
    await processSyncQueue();
  }

  return true;
};

export const syncUsers = async () => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) return false;

    await processSyncQueue();

    const lastSync = await AsyncStorage.getItem('last_user_sync_time');
    const response = await apiClient.get(`/Sync/users?since=${lastSync || ''}`);

    if (response.success && response.data?.length > 0) {
      upsertUsers(response.data);
      await AsyncStorage.setItem('last_user_sync_time', new Date().toISOString());
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to sync users:', error);
    return false;
  }
};

export const getUserStats = () => {
  try {
    const doctorsResult = db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'doctor' AND isDeleted = 0");
    const nursesResult = db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'nurse' AND isDeleted = 0");

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