import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Конфигурация
const HEALTH_CHECK_TIMEOUT = 5000; // 5 секунд

let lastServerStatus = null;
let lastCheckTime = null;

// Проверка доступности сервера
export const checkServerHealth = async () => {
  try {
    //console.log('🔍 Checking server health...');
    
    // Проверяем интернет
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      //console.log('❌ No internet connection');
      lastServerStatus = false;
      lastCheckTime = new Date();
      return false;
    }
    
    //console.log('✅ Internet connected');

    // Получаем базовый URL
    let baseUrl;
    try {
      const { apiClient } = require('./apiClient');
      baseUrl = apiClient.baseURL;
    } catch (e) {
      baseUrl = 'http://192.168.137.1:5162/api';
    }
    
    const healthUrl = `${baseUrl}/health`;
    //console.log('📡 Checking health at:', healthUrl);
    
    // Таймаут для запроса
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      //console.log('⏰ Health check timeout!');
      controller.abort();
    }, HEALTH_CHECK_TIMEOUT);
    
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    const isHealthy = response.ok;
    //console.log(`📡 Health check response: ${response.status} - ${isHealthy ? 'OK' : 'FAIL'}`);
    
    if (isHealthy) {
      const data = await response.json();
      //console.log('✅ Server is healthy:', data);
      lastServerStatus = true;
      await AsyncStorage.setItem('last_server_healthy', new Date().toISOString());
    } else {
      //console.log('❌ Server returned error:', response.status);
      lastServerStatus = false;
    }
    
    lastCheckTime = new Date();
    return isHealthy;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ Health check timeout - server not responding');
    } else {
      console.log('❌ Health check error:', error.message);
    }
    lastServerStatus = false;
    lastCheckTime = new Date();
    await AsyncStorage.setItem('last_server_unreachable', new Date().toISOString());
    return false;
  }
};

// ДОБАВИТЬ: Проверка возможности синхронизации
export const canSync = async () => {
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected) {
    return { canSync: false, reason: 'no_internet' };
  }
  
  const isServerHealthy = await checkServerHealth();
  if (!isServerHealthy) {
    return { canSync: false, reason: 'server_unavailable' };
  }
  
  return { canSync: true, reason: null };
};

export const getLastServerStatus = () => lastServerStatus;

export const getLastCheckTime = () => lastCheckTime;

export const manualServerCheck = async () => {
  return await checkServerHealth();
};