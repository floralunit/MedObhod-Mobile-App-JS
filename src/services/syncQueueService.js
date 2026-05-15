import { db } from '../db/database';
import { apiClient } from './apiClient';
import NetInfo from '@react-native-community/netinfo';
import { canSyncNow, invalidateCanSyncCache } from './networkCheckService';

let isSyncing = false;
let syncPromise = null; // Для предотвращения параллельных вызовов
const syncingIds = new Set();
const syncedIds = new Set(); // Кэш уже синхронизированных ID

const SYNC_ENDPOINTS = {
  doctorNotes: {
    insert: { method: 'POST', url: '/Sync/doctorNotes' },
    update: { method: 'PUT', url: '/Sync/doctorNotes/' },
    delete: { method: 'DELETE', url: '/Sync/doctorNotes/' },
    table: 'DoctorNotes',
    idField: 'DoctorNote_ID'
  },
appointments: {
    insert: { method: 'POST', url: '/Sync/appointments' },
    update: { method: 'PUT', url: '/Sync/appointments/' },
    table: 'appointments',
    idField: 'id'
},
  appointmentExecutions: {
    update: { method: 'PUT', url: '/Sync/appointmentExecutions/' },    table: 'AppointmentExecutions',
    idField: 'AppointmentExecution_ID'
  },
  users: {
    insert: { method: 'POST', url: '/Auth/users' },
    update: { method: 'PUT', url: '/Auth/users/' },
    delete: { method: 'DELETE', url: '/Auth/users/' },
    table: 'users',
    idField: 'id'
  },
  vitalSigns: {
    insert: { method: 'POST', url: '/Sync/vitalSigns' },
    update: { method: 'PUT', url: '/Sync/vitalSigns/' },
    delete: { method: 'DELETE', url: '/Sync/vitalSigns/' },
    table: 'vitalSigns',
    idField: 'id'
  },
  doctorRounds: {
    insert: {
      method: 'POST',
      url: '/Sync/doctorRounds/complete'
    },
    table: 'DoctorRounds',
    idField: 'DoctorRound_ID'
  }
};

// Очистка кэша синхронизированных ID (вызывать периодически)
const cleanupSyncedCache = () => {
  if (syncedIds.size > 100) {
    syncedIds.clear();
  }
};

export const addToSyncQueue = (entityName, operation, localId, data) => {
  try {
    const syncKey = `${entityName}_${localId}_${operation}`;

    // ПРОВЕРКА: может уже есть в очереди?
    const existing = db.execute(
      `SELECT id FROM sync_queue WHERE entity_name = ? AND local_id = ? AND operation = ? AND synced = 0`,
      [entityName, localId, operation]
    );

    if (existing.rows?._array?.length > 0) {
      console.log(`⚠️ Already in queue: ${syncKey}, updating data`);
      // Обновляем данные существующей записи
      db.execute(
        `UPDATE sync_queue SET data = ?, created_at = ? WHERE entity_name = ? AND local_id = ? AND operation = ? AND synced = 0`,
        [JSON.stringify(data), new Date().toISOString(), entityName, localId, operation]
      );
      return; // ВЫХОДИМ, не создаем дубликат
    }

    // ПРОВЕРКА: может уже синхронизировано?
    if (syncedIds.has(syncKey)) {
      console.log(`⚠️ Already synced: ${syncKey}, skipping`);
      return;
    }

    // Добавляем новую запись
    db.execute(
      `INSERT INTO sync_queue (id, entity_name, operation, local_id, data, created_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        entityName, operation, localId,
        JSON.stringify(data), new Date().toISOString(), 0
      ]
    );

    console.log(`✅ Added to sync queue: ${syncKey}`);
  } catch (error) {
    console.error('Failed to add to sync queue:', error);
  }
};

export const getPendingSyncItems = () => {
  try {
    const result = db.execute(
      `SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC LIMIT 5`
    );
    return result.rows?._array || [];
  } catch (error) {
    console.error('Failed to get pending sync items:', error);
    return [];
  }
};

export const removeFromSyncQueue = (id) => {
  try {
    db.execute(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  } catch (error) {
    console.error('Failed to remove from sync queue:', error);
  }
};

const updateLocalId = (table, idField, oldId, newId) => {
  if (oldId === newId) return;

  if (oldId.startsWith('local_') ||
    oldId.startsWith('note_') ||
    oldId.startsWith('vital_') ||
    oldId.startsWith('round_') ||
    oldId.startsWith('rounditem_') ||
    oldId.startsWith('psh_') ||
    oldId.startsWith('local_vital_') ||
    oldId.startsWith('local_app_')) {
    try {
      db.execute(`UPDATE ${table} SET ${idField} = ? WHERE ${idField} = ?`, [newId, oldId]);

      // Для DoctorRounds - обновляем Round_ID в DoctorRoundItems
      if (table === 'DoctorRounds' || idField === 'DoctorRound_ID') {
        const itemsResult = db.execute(
          `SELECT DoctorRoundItem_ID FROM DoctorRoundItems WHERE Round_ID = ?`,
          [oldId]
        );
        const items = itemsResult.rows?._array || [];

        items.forEach(item => {
          db.execute(
            `UPDATE DoctorRoundItems SET Round_ID = ? WHERE DoctorRoundItem_ID = ?`,
            [newId, item.DoctorRoundItem_ID]
          );
        });
        console.log(`Updated ${items.length} round items with new Round_ID: ${newId}`);
      }

      console.log(`✅ ID updated in ${table}: ${oldId} -> ${newId}`);
    } catch (error) {
      console.error(`Failed to update ID in ${table}:`, error);
    }
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const syncSingleItem = async (item) => {
  const data = JSON.parse(item.data);
  const config = SYNC_ENDPOINTS[item.entity_name];

  if (!config) return false;

  const syncKey = `${item.entity_name}_${item.local_id}_${item.operation}`;

  // ЖЕСТКАЯ ПРОВЕРКА: не синхронизируется ли уже
  if (syncingIds.has(syncKey)) {
    console.log(`BLOCKED: ${syncKey} - already syncing`);
    return false;
  }

  // ЖЕСТКАЯ ПРОВЕРКА: не синхронизирован ли уже
  if (syncedIds.has(syncKey)) {
    console.log(`BLOCKED: ${syncKey} - already synced`);
    // Удаляем из очереди, раз уже синхронизирован
    removeFromSyncQueue(item.id);
    return true;
  }

  // ЖЕСТКАЯ ПРОВЕРКА: существует ли еще в очереди
  const stillInQueue = db.execute(
    'SELECT id FROM sync_queue WHERE id = ? AND synced = 0',
    [item.id]
  );

  if (stillInQueue.rows?._array?.length === 0) {
    console.log(`BLOCKED: ${item.id} - already removed from queue`);
    return false;
  }

  // БЛОКИРУЕМ ДО ВЫПОЛНЕНИЯ
  syncingIds.add(syncKey);

  try {
    let method, url, body;

    switch (item.operation) {
      case 'INSERT':
        method = config.insert.method;
        url = config.insert.url;
        body = data;
        break;
      case 'UPDATE':
          method = config.update.method;
          url = config.update.url + item.local_id;
          body = data;
        break;
      case 'DELETE':
        method = config.delete.method;
        url = config.delete.url + item.local_id;
        body = null;
        break;
      default:
        return false;
    }

    // console.log(`📤 SENDING ${item.operation} ${item.entity_name}`);
    // console.log(`   Method: ${method}`);
    // console.log(`   URL: ${url}`);
    // console.log(`   Local ID: ${item.local_id}`);
    // console.log(`   Body: ${JSON.stringify(body).substring(0, 300)}`);

    const response = await apiClient.request(method, url, body);

    console.log(`📥 SERVER RESPONSE for ${item.operation} ${item.entity_name}:`, JSON.stringify(response).substring(0, 300));

    // Проверяем успех
    let isSuccess = false;
    let serverId = null;

    if (response?.success === true && !response?.errors) {
      isSuccess = true;
      serverId = response.data?.id || response.id;
    } else if (response?.statusCode === 200 || response?.statusCode === 201) {
      isSuccess = true;
      serverId = response.data?.id || response.id;
    } else if (response && !response.message && !response.error) {
      // Пустой ответ или ответ без ошибок - считаем успехом
      isSuccess = true;
    }

    if (isSuccess) {
      syncedIds.add(syncKey);

      // ЕСЛИ ЭТО INSERT И СЕРВЕР ВЕРНУЛ ID - ОБНОВЛЯЕМ ЛОКАЛЬНЫЙ ID
      if (item.operation === 'INSERT' && serverId) {
        console.log(`🔄 Updating local ID: ${item.local_id} -> ${serverId}`);

        // 1. Обновляем основной объект
        db.execute(
          `UPDATE ${config.table}
     SET ${config.idField} = ?
     WHERE ${config.idField} = ?`,
          [serverId, item.local_id]
        );
      }

      removeFromSyncQueue(item.id);
      console.log(`✅ DONE: ${syncKey}`);
      return true;
    }

    console.log(`❌ FAILED: ${syncKey}`);
    return false;
  } catch (error) {
    console.error(`Error: ${syncKey}`, error.message);
    throw error;
  } finally {
    // Удаляем из syncingIds только после завершения
    syncingIds.delete(syncKey);
  }
};

// ГЛАВНАЯ функция синхронизации - только один экземпляр одновременно
export const processSyncQueue = async () => {
  if (isSyncing) {
    console.log('⏳ Sync in progress, waiting...');
    return syncPromise || false;
  }

  isSyncing = true;

  try {
    const syncCheck = await canSyncNow();
    if (!syncCheck.canSync) {
      console.log(`Sync skipped - ${syncCheck.reason}`);
      return false;
    }

    const items = getPendingSyncItems();
    if (items.length === 0) {
      return true;
    }

    isSyncing = true;

    // Берем ТОЛЬКО ПЕРВЫЙ элемент
    const item = items[0];

    try {

      const syncCheck = await canSyncNow();
      if (!syncCheck.canSync) {
        isSyncing = false;
        return false;
      }

      const success = await syncSingleItem(item);

      if (success) {
        // Удаляем из очереди
        removeFromSyncQueue(item.id);
        console.log(`✅ Removed from queue: ${item.id}`);
      }

      // Задержка 1 секунда перед следующим элементом
      await delay(1000);

    } catch (error) {
      console.error('Sync error:', error);
      invalidateCanSyncCache();
      return false;
    } finally {
      isSyncing = false;
      syncPromise = null;
    }

    // Если остались элементы - запускаем снова через 2 секунды
    const remaining = getPendingSyncItems();
    if (remaining.length > 0) {
      setTimeout(() => {
        isSyncing = false;
        syncPromise = null;
        processSyncQueue();
      }, 2000);
    }

    return true;
  } catch (error) {
    console.error('Sync error:', error);
    return false;
  } finally {
    isSyncing = false;
    syncPromise = null;
  }
};
// Фоновая синхронизация
let syncInterval = null;
let netInfoUnsubscribe = null;

export const startBackgroundSync = () => {
  if (syncInterval) return;

  netInfoUnsubscribe = NetInfo.addEventListener(async (state) => {
    if (state.isConnected) {

      const syncCheck = await canSyncNow();
      if (syncCheck.canSync) {
        setTimeout(() => processSyncQueue(), 3000);
      }
    }
  });

  // Периодическая синхронизация раз в минуту
  syncInterval = setInterval(async () => {
    const netState = await NetInfo.fetch();
    if (netState.isConnected && !isSyncing) {

      const syncCheck = await canSyncNow();
      if (syncCheck.canSync) {
        await processSyncQueue();
      }
    }
  }, 60000);
};

export const stopBackgroundSync = () => {
  if (syncInterval) { clearInterval(syncInterval); syncInterval = null; }
  if (netInfoUnsubscribe) { netInfoUnsubscribe(); netInfoUnsubscribe = null; }
};