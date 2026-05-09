import { checkServerHealth } from './healthCheckService';
import Toast from 'react-native-toast-message';

let listeners = [];
let currentStatus = null;
let monitorInterval = null;

// Добавить слушателя
export const addServerStatusListener = (callback) => {
  listeners.push(callback);
  if (currentStatus !== null) {
    callback(currentStatus);
  }
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
};

const notifyListeners = (status) => {
  listeners.forEach(callback => callback(status));
};

const showStatusToast = (isHealthy, previousStatus) => {
  // Всегда показываем при изменении статуса
  if (previousStatus !== null && previousStatus === isHealthy) return;
  
  console.log('Showing toast for status change:', isHealthy ? 'online' : 'offline');
  
  if (isHealthy) {
    Toast.show({
      type: 'success',
      text1: '🟢 Сервер доступен',
      text2: 'Соединение установлено. Данные синхронизируются.',
      visibilityTime: 4000,
      position: 'top',
      topOffset: 50,
    });
  } else {
    Toast.show({
      type: 'error',
      text1: '🔴 Сервер недоступен',
      text2: 'Изменения сохранятся локально и синхронизируются позже.',
      visibilityTime: 5000,
      position: 'top',
      topOffset: 50,
    });
  }
};

// Запуск мониторинга
export const startServerMonitoring = () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
  }
  
  // Первая проверка сразу
  const performCheck = async () => {
    //console.log('Performing server health check...');
    const isHealthy = await checkServerHealth();
    //console.log('Server health check result:', isHealthy);
    
    if (currentStatus !== isHealthy) {
      showStatusToast(isHealthy, currentStatus);
      currentStatus = isHealthy;
      notifyListeners(isHealthy);
    }
  };
  
  performCheck();
  
  // Проверка каждые 10 секунд (вместо 30)
  monitorInterval = setInterval(performCheck, 10000);
  
  console.log('Server monitoring started (check every 10 seconds)');
};

export const stopServerMonitoring = () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
};

export const getCurrentServerStatus = () => currentStatus;

// Ручная проверка
export const manualServerCheck = async () => {
  console.log('Manual server check...');
  const isHealthy = await checkServerHealth();
  if (currentStatus !== isHealthy) {
    showStatusToast(isHealthy, currentStatus);
    currentStatus = isHealthy;
    notifyListeners(isHealthy);
  }
  return isHealthy;
};