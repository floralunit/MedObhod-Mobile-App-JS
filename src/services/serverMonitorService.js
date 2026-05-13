import { canSyncNow } from './networkCheckService';
import Toast from 'react-native-toast-message';

let listeners = [];
let currentStatus = null;
let monitorInterval = null;
let initialCheckDone = false;

export const addServerStatusListener = (callback) => {
  listeners.push(callback);
  // Сразу отправляем текущий статус если есть
  if (currentStatus !== null) {
    callback(currentStatus);
  }
  return () => {
    listeners = listeners.filter(cb => cb !== callback);
  };
};

const notifyListeners = (status) => {
  listeners.forEach(callback => {
    try {
      callback(status);
    } catch (e) {
      console.error('Listener error:', e);
    }
  });
};

const showStatusToast = (isHealthy, previousStatus) => {
  if (previousStatus !== null && previousStatus === isHealthy) return;

  console.log('Network status changed:', isHealthy ? '🟢 ONLINE' : '🔴 OFFLINE');

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

const performCheck = async () => {
  const result = await canSyncNow();
  const isHealthy = result.canSync;

  if (currentStatus !== isHealthy) {
    showStatusToast(isHealthy, currentStatus);
    currentStatus = isHealthy;
    notifyListeners(isHealthy);
  }

  initialCheckDone = true;
};

export const startServerMonitoring = () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
  }

  // Первая проверка сразу
  performCheck();

  // Проверка каждые 10 секунд
  monitorInterval = setInterval(performCheck, 10000);
};

export const stopServerMonitoring = () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
};

export const getCurrentServerStatus = () => currentStatus;

export const manualServerCheck = async () => {
  const result = await canSyncNow();
  const isHealthy = result.canSync;

  if (currentStatus !== isHealthy) {
    showStatusToast(isHealthy, currentStatus);
    currentStatus = isHealthy;
    notifyListeners(isHealthy);
  }
  return isHealthy;
};