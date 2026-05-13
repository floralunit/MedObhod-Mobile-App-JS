import NetInfo from '@react-native-community/netinfo';

// Кэш последнего состояния сети
let lastNetworkState = {
  isConnected: false,
  checkedAt: 0
};

// Кэш для canSync
let canSyncCache = null;
let canSyncCacheTime = 0;
const CACHE_DURATION_OFFLINE = 5000;  // 5 секунд кэшируем офлайн
const CACHE_DURATION_ONLINE = 2000;   // 2 секунды кэшируем онлайн

// URL для health check
const getHealthCheckUrl = () => {
  try {
    const { apiClient } = require('./apiClient');
    // apiClient.baseURL = 'http://192.168.137.1:5162/api'
    const baseUrl = apiClient.baseURL || 'http://192.168.137.1:5162/api';
    // Просто добавляем /health к baseURL (уже содержит /api)
    return `${baseUrl}/health`;
  } catch {
    return 'http://192.168.137.1:5162/api/health';
  }
};

// Инициализация слушателя сети
export const initNetworkListener = () => {
  NetInfo.addEventListener(state => {
    const wasDisconnected = !lastNetworkState.isConnected;
    const isNowConnected = state.isConnected ?? false;

    lastNetworkState = {
      isConnected: isNowConnected,
      checkedAt: Date.now()
    };

    // При восстановлении соединения - сбрасываем кэш
    if (wasDisconnected && isNowConnected) {
      console.log('🟢 Network connection restored!');
      invalidateCanSyncCache();
    }

    if (!isNowConnected) {
      console.log('🔴 Network disconnected');
      canSyncCache = false;
      canSyncCacheTime = Date.now();
    }
  });
};

// Проверка возможности синхронизации

export const canSyncNow = async () => {
  const now = Date.now();

  const cacheDuration = canSyncCache === false ? CACHE_DURATION_OFFLINE : CACHE_DURATION_ONLINE;

  if (canSyncCache !== null && (now - canSyncCacheTime) < cacheDuration) {
    return {
      canSync: canSyncCache,
      reason: canSyncCache ? null : 'cached_offline'
    };
  }

  // Шаг 1: Проверяем сеть
  try {
    const state = await NetInfo.fetch();
    lastNetworkState = {
      isConnected: state.isConnected ?? false,
      checkedAt: now
    };

    if (!state.isConnected) {
      console.log('📡 No network connection');
      canSyncCache = false;
      canSyncCacheTime = now;
      return { canSync: false, reason: 'no_internet' };
    }
  } catch {
    // Продолжаем даже если NetInfo упал
  }

  // Шаг 2: Health check
  try {
    const healthUrl = getHealthCheckUrl();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      //console.log('⏰ Health check timeout (2s)');
      controller.abort();
    }, 2000);

    const response = await fetch(healthUrl, {
      method: 'GET', 
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    clearTimeout(timeoutId);

    const isHealthy = response.ok;

    // if (isHealthy) {
    //   // Пробуем прочитать ответ чтобы убедиться
    //   try {
    //     const data = await response.json();
    //     console.log('✅ Server healthy:', data.status || 'OK');
    //   } catch {
    //     console.log('✅ Server responded OK');
    //   }
    // } else {
    //   console.log(`❌ Server returned status: ${response.status}`);
    // }

    canSyncCache = isHealthy;
    canSyncCacheTime = now;

    return {
      canSync: isHealthy,
      reason: isHealthy ? null : 'server_unavailable'
    };

  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timeout' : error.message;
    //console.log(`❌ Health check failed: ${reason}`);

    canSyncCache = false;
    canSyncCacheTime = now;
    return { canSync: false, reason: 'server_unreachable' };
  }
};

// Инвалидация кэша
export const invalidateCanSyncCache = () => {
  console.log('🔄 Invalidating sync cache');
  canSyncCache = null;
  canSyncCacheTime = 0;
};

// Принудительный сброс
export const resetNetworkCache = () => {
  canSyncCache = null;
  canSyncCacheTime = 0;
  lastNetworkState = {
    isConnected: false,
    checkedAt: 0
  };
};