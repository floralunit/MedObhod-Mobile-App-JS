import { db } from '../db/database';
import { apiClient } from './apiClient';
import { addToSyncQueue, processSyncQueue } from './syncQueueService';
import { canSyncNow, invalidateCanSyncCache } from './networkCheckService';

// Расчет NEWS-2
const calculateNEWS = (vital) => {
  let score = 0;
  if (vital.temperature <= 35.0) score += 3;
  else if (vital.temperature < 36.0) score += 1;
  else if (vital.temperature <= 38.0) score += 0;
  else if (vital.temperature <= 39.0) score += 1;
  else score += 2;

  if (vital.pulse <= 40) score += 3;
  else if (vital.pulse <= 50) score += 1;
  else if (vital.pulse <= 90) score += 0;
  else if (vital.pulse <= 110) score += 1;
  else if (vital.pulse <= 130) score += 2;
  else score += 3;

  if (vital.spo2 <= 91) score += 3;
  else if (vital.spo2 <= 93) score += 2;
  else if (vital.spo2 <= 95) score += 1;

  if (vital.respiratoryRate <= 8) score += 3;
  else if (vital.respiratoryRate <= 11) score += 1;
  else if (vital.respiratoryRate <= 20) score += 0;
  else if (vital.respiratoryRate <= 24) score += 2;
  else score += 3;

  if (vital.systolicBP <= 90) score += 3;
  else if (vital.systolicBP <= 100) score += 2;
  else if (vital.systolicBP <= 110) score += 1;
  else if (vital.systolicBP <= 219) score += 0;
  else score += 2;

  return score;
};

export const getStatusByNEWS = (newsScore) => {
  if (newsScore >= 7) return 'critical';
  if (newsScore >= 5) return 'warning';
  return 'stable';
};

export const getVitalSigns = (hospitalizationId) => {
  try {
    const result = db.execute(`
      SELECT 
        id,
        hospitalizationId,
        temperature,
        pulse,
        systolicBP,
        diastolicBP,
        spo2,
        respiratoryRate,
        newsScore,
        userId,
        createdDt as createdAt,
        updatedDt,
        (SELECT fullName FROM users WHERE id = userId) as recordedBy
      FROM VitalSigns
      WHERE hospitalizationId = ? AND isDeleted = 0
      ORDER BY createdDt DESC
    `, [hospitalizationId]);

    const rows = result.rows?._array || [];

    return rows.map(v => ({
      id: v.id,
      time: v.createdAt,
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

export const getLatestVitals = (hospitalizationId) => {
  try {
    const result = db.execute(`
      SELECT * FROM VitalSigns
      WHERE hospitalizationId = ? AND isDeleted = 0
      ORDER BY createdDt DESC LIMIT 1
    `, [hospitalizationId]);

    const rows = result.rows?._array || [];
    if (rows.length === 0) return null;

    const v = rows[0];
    return {
      measuredAt: v.createdDt,
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

export const getLatestNEWS = (hospitalizationId) => {
  const latest = getLatestVitals(hospitalizationId);
  if (!latest) return { newsScore: 0, status: 'stable' };
  return {
    newsScore: latest.newsScore || 0,
    status: getStatusByNEWS(latest.newsScore || 0)
  };
};

export const addVitalSign = async (vitalData) => {
  const localId = `vital_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newsScore = calculateNEWS(vitalData);
  const now = new Date().toISOString();

  console.log(`📝 Creating vital sign: NEWS=${newsScore}, Status=${getStatusByNEWS(newsScore)}`);

  // ТОЛЬКО сохраняем показатели, НЕ трогаем hospitalization
  db.execute(`
    INSERT INTO VitalSigns 
    (id, hospitalizationId, temperature, pulse, systolicBP, diastolicBP,
     spo2, respiratoryRate, newsScore, userId, createdDt, updatedDt, isDeleted, version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    localId, vitalData.hospitalizationId,
    vitalData.temperature, vitalData.pulse,
    vitalData.systolicBP, vitalData.diastolicBP,
    vitalData.spo2, vitalData.respiratoryRate,
    newsScore, vitalData.userId,
    now, now, 0, 1
  ]);

  // Добавляем в очередь синхронизации
  addToSyncQueue('vitalSigns', 'INSERT', localId, {
    hospitalizationId: vitalData.hospitalizationId,
    temperature: vitalData.temperature,
    pulse: vitalData.pulse,
    systolicBP: vitalData.systolicBP,
    diastolicBP: vitalData.diastolicBP,
    spo2: vitalData.spo2,
    respiratoryRate: vitalData.respiratoryRate
  });

  return { id: localId, newsScore, status: getStatusByNEWS(newsScore) };
};

export const syncVitalSigns = async (hospitalizationId = null) => {
  try {
    // 1. Сначала отправляем локальные изменения
    await processSyncQueue();

    // 2. Проверяем сеть
    const syncCheck = await canSyncNow();
    if (!syncCheck.canSync) {
      return false;
    }

    // 3. Загружаем с сервера
    let url = '/Sync/vitalSigns';
    if (hospitalizationId) {
      url += `?hospitalizationId=${hospitalizationId}`;
    }

    const response = await apiClient.get(url);

    if (response.success && response.data?.length > 0) {
      for (const v of response.data) {
        // Проверяем существование записи - ТОЧНО КАК В DOCTORNOTES
        const existing = db.execute(
          'SELECT id, version FROM VitalSigns WHERE id = ?',
          [v.id]
        );

        if (existing.rows?._array?.length === 0) {
          // Новая запись - вставляем
          db.execute(`
            INSERT INTO VitalSigns 
            (id, hospitalizationId, temperature, pulse, systolicBP, diastolicBP,
             spo2, respiratoryRate, newsScore, userId, createdDt, updatedDt, isDeleted, version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            v.id, v.hospitalizationId,
            v.temperature, v.pulse, v.systolicBP, v.diastolicBP,
            v.spo2, v.respiratoryRate, v.newsScore || v.NEWSScore || 0,
            v.insUserId,
            v.createdDt || new Date().toISOString(),
            v.updatedDt || new Date().toISOString(),
            v.isDeleted ? 1 : 0,
            v.version || 1
          ]);
        } else {
          // Существующая запись - ОБНОВЛЯЕМ
          const localVersion = existing.rows._array[0].version || 0;
          const serverVersion = v.version || 0;

          if (serverVersion > localVersion) {
            db.execute(`
              UPDATE VitalSigns SET
                temperature = ?, pulse = ?, systolicBP = ?, diastolicBP = ?,
                spo2 = ?, respiratoryRate = ?, newsScore = ?,
                isDeleted = ?, version = ?, updatedDt = ?
              WHERE id = ?
            `, [
              v.temperature, v.pulse, v.systolicBP, v.diastolicBP,
              v.spo2, v.respiratoryRate, v.newsScore || v.NEWSScore || 0,
              v.isDeleted ? 1 : 0, serverVersion,
              v.updatedDt || new Date().toISOString(), v.id
            ]);
          }
        }
      }

      console.log(`Synced ${response.data.length} vital signs`);
      return true;
    }

    return false;
  } catch (error) {
    if (error.message !== 'NETWORK_UNAVAILABLE') {
      console.error('Failed to sync vital signs:', error);
    }
    return false;
  }
};