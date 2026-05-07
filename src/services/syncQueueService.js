import { db } from '../db/database';
import { apiClient } from './apiClient';
import NetInfo from '@react-native-community/netinfo';

// Флаг для предотвращения одновременной синхронизации
let isSyncing = false;

// Добавление операции в очередь синхронизации
export const addToSyncQueue = (entityName, operation, localId, data) => {
  try {
    // Проверяем, нет ли уже такой записи в очереди
    const existing = db.execute(
      `SELECT * FROM sync_queue WHERE entity_name = ? AND local_id = ? AND operation = ? AND synced = 0`,
      [entityName, localId, operation]
    );
    
    if (existing.rows?._array?.length > 0) {
      console.log(`Item ${localId} already in queue, skipping`);
      return;
    }
    
    db.execute(
      `INSERT INTO sync_queue 
       (id, entity_name, operation, local_id, data, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Math.random().toString(36).substr(2, 9),
        entityName,
        operation,
        localId,
        JSON.stringify(data),
        new Date().toISOString(),
        0
      ]
    );
    console.log(`Added to sync queue: ${operation} ${entityName} (${localId})`);
  } catch (error) {
    console.error('Failed to add to sync queue:', error);
  }
};

// Получение всех несинхронизированных записей
export const getPendingSyncItems = () => {
  try {
    const result = db.execute(
      `SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC LIMIT 10`
    );
    return result.rows?._array || [];
  } catch (error) {
    console.error('Failed to get pending sync items:', error);
    return [];
  }
};

// Удалить запись из очереди
export const removeFromSyncQueue = (id) => {
  try {
    db.execute(`DELETE FROM sync_queue WHERE id = ?`, [id]);
    console.log(`Removed from sync queue: ${id}`);
  } catch (error) {
    console.error('Failed to remove from sync queue:', error);
  }
};

// Задержка между запросами
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Синхронизация всех ожидающих записей
export const processSyncQueue = async () => {
  // Предотвращаем одновременную синхронизацию
  if (isSyncing) {
    console.log('Sync already in progress, skipping');
    return false;
  }
  
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No internet, skipping sync');
      return false;
    }

    const pendingItems = getPendingSyncItems();
    
    if (pendingItems.length === 0) {
      return true;
    }

    isSyncing = true;
    console.log(`Processing ${pendingItems.length} pending sync items`);

    for (const item of pendingItems) {
      try {
        let response;
        const data = JSON.parse(item.data);
        
        switch (item.operation) {
          case 'INSERT':
            console.log(`📤 Syncing INSERT user: ${data.login}`);
            response = await apiClient.post('/Auth/users', data);
            if (response.success && response.data) {
              // Обновляем локальный ID на серверный
              db.execute(
                `UPDATE users SET id = ? WHERE id = ?`,
                [response.data.id, item.local_id]
              );
            }
            break;
            
          case 'UPDATE':
            console.log(`📤 Syncing UPDATE user role: ${item.local_id} -> ${data.newRole}`);
            response = await apiClient.put(`/Auth/users/${item.local_id}/role`, data.newRole);
            break;
            
          case 'DELETE':
            console.log(`📤 Syncing DELETE user: ${item.local_id}`);
            response = await apiClient.delete(`/Auth/users/${item.local_id}`);
            break;
        }
        
        if (response && response.success) {
          // Успешно - удаляем из очереди
          removeFromSyncQueue(item.id);
          console.log(`✓ Synced ${item.operation} ${item.entity_name} (${item.local_id})`);
        } else if (response && response.statusCode === 400 && response.message?.includes('already exists')) {
          console.log(`User already exists, removing from queue`);
          removeFromSyncQueue(item.id);
        } else if (response && response.statusCode === 404 && item.operation === 'DELETE') {
          console.log(`User already deleted on server, removing from queue`);
          removeFromSyncQueue(item.id);
        } else {
          console.error(`✗ Failed to sync ${item.operation}:`, response?.message);
        }
        
        // Небольшая задержка между запросами
        await delay(500);
        
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to process sync queue:', error);
    return false;
  } finally {
    isSyncing = false;
  }
};

// Запуск фоновой синхронизации (только один раз)
let syncInterval = null;
let netInfoUnsubscribe = null;

export const startBackgroundSync = () => {
  if (syncInterval) {
    console.log('Background sync already running');
    return;
  }
  
  // Отписываемся от предыдущего слушателя, если есть
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
  }
  
  // Слушаем изменения интернета
  netInfoUnsubscribe = NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {
      console.log('Internet connected, syncing...');
      // Задержка, чтобы не конфликтовать с другими операциями
      setTimeout(() => processSyncQueue(), 2000);
    }
  });
  
  // Периодическая синхронизация каждые 30 секунд (увеличил интервал)
  syncInterval = setInterval(async () => {
    const netState = await NetInfo.fetch();
    if (netState.isConnected && !isSyncing) {
      await processSyncQueue();
    }
  }, 30 * 1000);
  
  console.log('Background sync started');
};

// Остановка синхронизации
export const stopBackgroundSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
    netInfoUnsubscribe = null;
  }
  console.log('Background sync stopped');
};