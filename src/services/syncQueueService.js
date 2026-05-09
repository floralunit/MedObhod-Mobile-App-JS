import { db } from '../db/database';
import { apiClient } from './apiClient';
import NetInfo from '@react-native-community/netinfo';
import { canSync, checkServerHealth, wasServerRecentlyAvailable } from './healthCheckService';

let isSyncing = false;

// Добавление операции в очередь синхронизации
export const addToSyncQueue = (entityName, operation, localId, data) => {
  try {
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
    const result = db.execute(`
      SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC LIMIT 10
    `);
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
  if (isSyncing) {
    console.log('Sync already in progress, skipping');
    return false;
  }
  
  try {
    // Проверяем возможность синхронизации (интернет + сервер)
    const syncCheck = await canSync();
    if (!syncCheck.canSync) {
      console.log(`Cannot sync: ${syncCheck.reason}`);
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
        
        // Перед каждым запросом проверяем сервер
        const isServerHealthy = await checkServerHealth();
        if (!isServerHealthy) {
          console.log('Server became unavailable, stopping sync');
          break;
        }
        
        switch (item.operation) {
          case 'INSERT':
            console.log(`📤 Syncing INSERT ${item.entity_name}:`, data);
            if (item.entity_name === 'appointments') {
              response = await apiClient.post('/Appointments', {
                hospitalizationId: data.hospitalizationId,
                templateId: data.templateId,
                type: data.type,
                name: data.name,
                priority: data.priority,
                durationMin: data.durationMin,
                instructions: data.instructions,
                notes: data.notes,
                schedule: data.schedule,
                medication: data.medication
              });
            } else if (item.entity_name === 'users') {
              response = await apiClient.post('/Auth/users', data);
            } else {
              response = await apiClient.post(`/Sync/${item.entity_name}`, data);
            }
            break;
            
          case 'UPDATE':
            console.log(`📤 Syncing UPDATE ${item.entity_name}: ${item.local_id}`);
            if (item.entity_name === 'users') {
              response = await apiClient.put(`/Auth/users/${item.local_id}/role`, data.newRole);
            } else if (item.entity_name === 'appointments') {
              if (data.status === 'completed') {
                response = await apiClient.put(`/Appointments/${item.local_id}/complete`, data.completedBy);
              }
            } else {
              response = await apiClient.put(`/Sync/${item.entity_name}/${item.local_id}`, data);
            }
            break;
            
          case 'DELETE':
            console.log(`📤 Syncing DELETE ${item.entity_name}: ${item.local_id}`);
            response = await apiClient.delete(`/Auth/${item.entity_name}/${item.local_id}`);
            break;
        }
        
        if (response && (response.success === true || response.statusCode === 200)) {
          removeFromSyncQueue(item.id);
          console.log(`✓ Synced ${item.operation} ${item.entity_name} (${item.local_id})`);
        } else if (response && response.statusCode === 404) {
          console.warn(`Endpoint not found for ${item.entity_name}, removing from queue`);
          removeFromSyncQueue(item.id);
        } else if (response && (response.statusCode === 400 || response.statusCode === 500)) {
          console.error(`✗ Server error for ${item.operation}:`, response.message);
          // Не удаляем из очереди, попробуем позже
        } else {
          console.error(`✗ Failed to sync ${item.operation} ${item.entity_name}:`, response);
        }
        
        await delay(500);
        
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
        if (error.message?.includes('Network') || error.message?.includes('fetch')) {
          console.log('Network error, will retry later');
          break;
        }
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

// Запуск фоновой синхронизации
let syncInterval = null;
let netInfoUnsubscribe = null;

export const startBackgroundSync = () => {
  if (syncInterval) {
    console.log('Background sync already running');
    return;
  }
  
  if (netInfoUnsubscribe) {
    netInfoUnsubscribe();
  }
  
  // Слушаем изменения интернета
  netInfoUnsubscribe = NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {
      // Проверяем доступность сервера перед синхронизацией
      const isServerHealthy = await checkServerHealth();
      if (isServerHealthy) {
        console.log('Internet connected and server available, syncing...');
        setTimeout(() => processSyncQueue(), 2000);
      } else {
        console.log('Internet connected but server unavailable, waiting...');
      }
    }
  });
  
  // Периодическая синхронизация каждые 30 секунд
  syncInterval = setInterval(async () => {
    const netState = await NetInfo.fetch();
    if (netState.isConnected && !isSyncing) {
      const isServerHealthy = await checkServerHealth();
      if (isServerHealthy) {
        await processSyncQueue();
      }
    }
  }, 30 * 1000);
  
  console.log('Background sync started with health check');
};

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