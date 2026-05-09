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
// В функции processSyncQueue, в блоке case 'INSERT':
case 'INSERT':
  console.log(`📤 Syncing INSERT ${item.entity_name}:`, data);
  
  if (item.entity_name === 'appointments') {
    // Используем новый контроллер Appointments
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
  
  if (item.entity_name === 'appointments') {
    // Обновление статуса назначения
    if (data.status === 'completed') {
      response = await apiClient.put(`/Appointments/${item.local_id}/complete`, data.completedBy);
    } else {
      response = await apiClient.put(`/Appointments/${item.local_id}/cancel`, {});
    }
  } else if (item.entity_name === 'users') {
    response = await apiClient.put(`/Auth/users/${item.local_id}/role`, data.newRole);
  } else {
    response = await apiClient.put(`/Sync/${item.entity_name}/${item.local_id}`, data);
  }
  break;
            
          case 'DELETE':
            console.log(`📤 Syncing DELETE ${item.entity_name}: ${item.local_id}`);
            response = await apiClient.delete(`/Auth/${item.entity_name}/${item.local_id}`);
            break;
        }
        
        // Проверяем ответ
        if (response && response.success === true) {
          removeFromSyncQueue(item.id);
          console.log(`✓ Synced ${item.operation} ${item.entity_name} (${item.local_id})`);
        } else if (response && response.statusCode === 400 && response.message?.includes('already exists')) {
          console.log(`User already exists, removing from queue`);
          removeFromSyncQueue(item.id);
        } else if (response && response.statusCode === 404 && item.operation === 'DELETE') {
          console.log(`Entity already deleted, removing from queue`);
          removeFromSyncQueue(item.id);
        } else if (response && response.statusCode === 200 && response.data === true) {
          // Успешный ответ без поля success
          removeFromSyncQueue(item.id);
          console.log(`✓ Synced ${item.operation} ${item.entity_name} (${item.local_id})`);
        } else {
          console.error(`✗ Failed to sync ${item.operation} ${item.entity_name}:`, response);
          // Не удаляем из очереди, попробуем позже
        }
        
        await delay(500);
        
      } catch (error) {
        console.error(`Error syncing item ${item.id}:`, error);
        // Не удаляем из очереди при ошибке сети
        if (error.message?.includes('Network') || error.message?.includes('fetch')) {
          console.log('Network error, will retry later');
          break; // Прерываем синхронизацию при проблемах с сетью
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