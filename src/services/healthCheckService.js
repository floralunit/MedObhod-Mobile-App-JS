import NetInfo from '@react-native-community/netinfo';
import { canSyncNow } from './networkCheckService';

let lastServerStatus = null;
let lastCheckTime = null;

export const checkServerHealth = async () => {
  const result = await canSyncNow();
  lastServerStatus = result.canSync;
  lastCheckTime = new Date();
  return result.canSync;
};

export const canSync = async () => {
  return await canSyncNow();
};

export const getLastServerStatus = () => lastServerStatus;
export const getLastCheckTime = () => lastCheckTime;