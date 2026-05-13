import { db } from '../db/database';
import { apiClient } from './apiClient';
import { addToSyncQueue } from './syncQueueService';
import NetInfo from '@react-native-community/netinfo';
import { canSyncNow, invalidateCanSyncCache } from './networkCheckService';

export const getPatientAppointments = (hospitalizationId) => {
  try {
    const result = db.execute(`
      SELECT * FROM appointments
      WHERE hospitalizationId = ? AND isDeleted = 0
      ORDER BY createdAt DESC
    `, [hospitalizationId]);

    const appointments = result.rows?._array || [];

    return appointments.map(apt => ({
      ...apt,
      schedule: apt.scheduleData ? JSON.parse(apt.scheduleData) : null,
      medication: apt.medicationData ? JSON.parse(apt.medicationData) : null
    }));
  } catch (error) {
    console.error('Failed to get patient appointments:', error);
    return [];
  }
};

export const createAppointment = async (appointmentData) => {
  const localId = `local_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  // Сохраняем локально
  db.execute(`
    INSERT INTO appointments 
    (id, hospitalizationId, templateId, type, name, priority, durationMin,
     instructions, notes, status, createdAt, scheduleData, medicationData,
     version, updatedAt, isDeleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    localId, appointmentData.hospitalizationId, appointmentData.templateId,
    appointmentData.type, appointmentData.name, appointmentData.priority,
    appointmentData.durationMin, appointmentData.instructions || '', appointmentData.notes || '',
    'pending', now,
    JSON.stringify(appointmentData.schedule),
    appointmentData.medication ? JSON.stringify(appointmentData.medication) : null,
    1, now, 0
  ]);

  // Добавляем в очередь (только добавляем, не синхронизируем сразу)
  addToSyncQueue('appointments', 'INSERT', localId, {
    hospitalizationId: appointmentData.hospitalizationId,
    templateId: appointmentData.templateId,
    type: appointmentData.type,
    name: appointmentData.name,
    priority: appointmentData.priority,
    durationMin: appointmentData.durationMin,
    instructions: appointmentData.instructions || '',
    notes: appointmentData.notes || '',
    schedule: appointmentData.schedule,
    medication: appointmentData.medication || null
  });

  console.log('Appointment created locally:', localId);
  return { id: localId };
};

export const completeAppointment = async (appointmentId, userId) => {
  const now = new Date().toISOString();

  db.execute(
    `UPDATE appointments SET status = 'completed', completedAt = ?, completedBy = ?,
     updatedAt = ?, version = version + 1 WHERE id = ?`,
    [now, userId, now, appointmentId]
  );

  addToSyncQueue('appointments', 'UPDATE', appointmentId, {
    status: 'completed',
    completedBy: userId,
    completedAt: now
  });

  return true;
};

export const syncAppointments = async (hospitalizationId) => {
  try {

    const syncCheck = await canSyncNow();
    if (!syncCheck.canSync) {
      return false;
    }

    const response = await apiClient.get(`/Appointments/patient/${hospitalizationId}`);

    if (response.success && response.data) {
      let insertedCount = 0;
      let updatedCount = 0;

      for (const apt of response.data) {
        // Проверяем, не локальный ли это ID (еще не синхронизированный)
        const existing = db.execute(
          'SELECT id, version, status FROM appointments WHERE id = ?',
          [apt.id]
        );

        if (existing.rows?._array?.length === 0) {
          // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: ищем по scheduleData чтобы избежать дублей
          const duplicate = db.execute(
            `SELECT id FROM appointments 
             WHERE hospitalizationId = ? AND name = ? AND type = ? 
             AND createdAt LIKE ? AND isDeleted = 0
             LIMIT 1`,
            [hospitalizationId, apt.name, apt.type, apt.createdAt?.substring(0, 10) + '%']
          );

          if (duplicate.rows?._array?.length > 0) {
            // Это дубликат - обновляем ID вместо вставки
            db.execute(
              `UPDATE appointments SET id = ?, version = ?, updatedAt = ? WHERE id = ?`,
              [apt.id, apt.version || 1, apt.updatedAt || new Date().toISOString(), duplicate.rows._array[0].id]
            );
            updatedCount++;
            continue;
          }
          // Вставляем только если нет дубликата
          db.execute(`
            INSERT INTO appointments 
            (id, hospitalizationId, templateId, type, name, priority, durationMin,
             instructions, notes, status, createdAt, scheduleData, medicationData,
             version, updatedAt, isDeleted)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            apt.id, apt.hospitalizationId, apt.templateId, apt.type, apt.name,
            apt.priority, apt.durationMin,
            apt.instructions || '', apt.notes || '',
            apt.status || 'pending',
            apt.createdAt || new Date().toISOString(),
            null, null, // scheduleData и medicationData не приходят при pull
            apt.version || 1,
            apt.updatedAt || new Date().toISOString(),
            0
          ]);
          insertedCount++;
        } else {
          const localVersion = existing.rows._array[0].version || 0;
          const serverVersion = apt.version || 0;

          if (serverVersion > localVersion) {
            db.execute(`
              UPDATE appointments SET
                status = ?, instructions = ?, notes = ?,
                version = ?, updatedAt = ?
              WHERE id = ?
            `, [
              apt.status || 'pending', apt.instructions || '', apt.notes || '',
              serverVersion, apt.updatedAt || new Date().toISOString(), apt.id
            ]);
            updatedCount++;
          }
        }
      }

      console.log(`Sync appointments: ${insertedCount} new, ${updatedCount} updated`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to sync appointments:', error);
    return false;
  }
};