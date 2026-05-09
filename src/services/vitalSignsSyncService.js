import { db } from '../db/database';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addToSyncQueue, processSyncQueue } from './syncQueueService';
import NetInfo from '@react-native-community/netinfo';

// Расчет NEWS-2 (National Early Warning Score)
const calculateNEWS = (vital) => {
  let score = 0;
  
  // Температура
  if (vital.temperature <= 35.0) score += 3;
  else if (vital.temperature < 36.0) score += 1;
  else if (vital.temperature <= 38.0) score += 0;
  else if (vital.temperature <= 39.0) score += 1;
  else score += 2;
  
  // Пульс
  if (vital.pulse <= 40) score += 3;
  else if (vital.pulse <= 50) score += 1;
  else if (vital.pulse <= 90) score += 0;
  else if (vital.pulse <= 110) score += 1;
  else if (vital.pulse <= 130) score += 2;
  else score += 3;
  
  // Сатурация
  if (vital.spo2 <= 91) score += 3;
  else if (vital.spo2 <= 93) score += 2;
  else if (vital.spo2 <= 95) score += 1;
  else score += 0;
  
  // ЧДД
  if (vital.respiratoryRate <= 8) score += 3;
  else if (vital.respiratoryRate <= 11) score += 1;
  else if (vital.respiratoryRate <= 20) score += 0;
  else if (vital.respiratoryRate <= 24) score += 2;
  else score += 3;
  
  // АД (систолическое)
  if (vital.systolicBP <= 90) score += 3;
  else if (vital.systolicBP <= 100) score += 2;
  else if (vital.systolicBP <= 110) score += 1;
  else if (vital.systolicBP <= 219) score += 0;
  else score += 2;
  
  return score;
};

// Получение показателей пациента из локальной БД
export const getVitalSigns = (hospitalizationId) => {
  try {
    const result = db.execute(`
      SELECT 
        vs.id,
        vs.hospitalizationId,
        vs.measuredAt,
        vs.temperature,
        vs.pulse,
        vs.systolicBP,
        vs.diastolicBP,
        vs.spo2,
        vs.respiratoryRate,
        vs.newsScore,
        vs.userId,
        u.fullName as recordedBy
      FROM vitalSigns vs
      LEFT JOIN users u ON vs.userId = u.id
      WHERE vs.hospitalizationId = ?
      ORDER BY vs.measuredAt DESC
    `, [hospitalizationId]);
    
    const vitals = result.rows?._array || [];
    
    // Преобразуем для совместимости с UI
    return vitals.map(v => ({
      id: v.id,
      time: v.measuredAt,
      temp: v.temperature,
      pulse: v.pulse,
      bp: `${v.systolicBP || 0}/${v.diastolicBP || 0}`,
      systolicBP: v.systolicBP,
      diastolicBP: v.diastolicBP,
      spo2: v.spo2,
      rr: v.respiratoryRate,
      newsScore: v.newsScore,
      recordedBy: v.recordedBy
    }));
  } catch (error) {
    console.error('Failed to get vital signs:', error);
    return [];
  }
};

// Получение последних показателей пациента
export const getLatestVitals = (hospitalizationId) => {
  try {
    const result = db.execute(`
      SELECT 
        measuredAt,
        temperature,
        pulse,
        systolicBP,
        diastolicBP,
        spo2,
        respiratoryRate,
        newsScore
      FROM vitalSigns
      WHERE hospitalizationId = ?
      ORDER BY measuredAt DESC
      LIMIT 1
    `, [hospitalizationId]);
    
    const vitals = result.rows?._array || [];
    if (vitals.length === 0) return null;
    
    const v = vitals[0];
    return {
      measuredAt: v.measuredAt,
      temperature: v.temperature,
      pulse: v.pulse,
      systolicBP: v.systolicBP,
      diastolicBP: v.diastolicBP,
      spo2: v.spo2,
      respiratoryRate: v.respiratoryRate,
      newsScore: v.newsScore
    };
  } catch (error) {
    console.error('Failed to get latest vitals:', error);
    return null;
  }
};

// Добавление показателей
export const addVitalSign = async (vitalData) => {
  const localId = `local_vital_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newsScore = calculateNEWS(vitalData);
  
  const localVital = {
    id: localId,
    hospitalizationId: vitalData.hospitalizationId,
    measuredAt: vitalData.measuredAt || new Date().toISOString(),
    temperature: vitalData.temperature || null,
    pulse: vitalData.pulse || null,
    systolicBP: vitalData.systolicBP || null,
    diastolicBP: vitalData.diastolicBP || null,
    spo2: vitalData.spo2 || null,
    respiratoryRate: vitalData.respiratoryRate || null,
    newsScore: newsScore,
    userId: vitalData.userId,
    version: 1,
    updatedAt: new Date().toISOString(),
    isDeleted: 0
  };
  
  // Сохраняем локально
  db.execute(`
    INSERT INTO vitalSigns 
    (id, hospitalizationId, measuredAt, temperature, pulse, systolicBP, diastolicBP,
     spo2, respiratoryRate, newsScore, userId, version, updatedAt, isDeleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    localVital.id, localVital.hospitalizationId, localVital.measuredAt,
    localVital.temperature, localVital.pulse, localVital.systolicBP, localVital.diastolicBP,
    localVital.spo2, localVital.respiratoryRate, localVital.newsScore,
    localVital.userId, localVital.version, localVital.updatedAt, localVital.isDeleted
  ]);
  
  // Обновляем статус госпитализации на основе NEWS
  let status = 'stable';
  if (newsScore >= 7) status = 'critical';
  else if (newsScore >= 5) status = 'warning';
  
  db.execute(`
    UPDATE hospitalizations 
    SET status = ?, updatedAt = ?, version = version + 1 
    WHERE id = ?
  `, [status, new Date().toISOString(), vitalData.hospitalizationId]);
  
  // Добавляем в очередь синхронизации
  addToSyncQueue('vitalSigns', 'INSERT', localId, vitalData);
  
  // Пробуем синхронизировать сразу
  const netState = await NetInfo.fetch();
  if (netState.isConnected) {
    await processSyncQueue();
  }
  
  return localVital;
};

// Синхронизация показателей с сервера
export const syncVitalSigns = async (hospitalizationId) => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No internet, using cached vital signs');
      return false;
    }
    
    const lastSync = await AsyncStorage.getItem(`last_vitals_sync_${hospitalizationId}`);
    const response = await apiClient.get(`/Sync/vitalSigns?hospitalizationId=${hospitalizationId}&since=${lastSync || ''}`);
    
    if (response.success && response.data && response.data.length > 0) {
      for (const v of response.data) {
        // Проверяем, существует ли уже запись
        const existing = db.execute(`SELECT id FROM vitalSigns WHERE id = ?`, [v.id]);
        
        if (existing.rows?._array?.length === 0) {
          db.execute(`
            INSERT INTO vitalSigns 
            (id, hospitalizationId, measuredAt, temperature, pulse, systolicBP, diastolicBP,
             spo2, respiratoryRate, newsScore, userId, version, updatedAt, isDeleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            v.id, v.hospitalizationId, v.measuredDt, v.temperature, v.pulse,
            v.systolicBP, v.diastolicBP, v.spo2, v.respiratoryRate, v.newsScore,
            v.insUserId, v.version || 1, v.updatedDt || new Date().toISOString(), 0
          ]);
        }
      }
      
      await AsyncStorage.setItem(`last_vitals_sync_${hospitalizationId}`, new Date().toISOString());
      console.log(`Synced ${response.data.length} vital signs`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to sync vital signs:', error);
    return false;
  }
};