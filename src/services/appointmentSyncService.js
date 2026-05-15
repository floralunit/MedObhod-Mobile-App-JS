import { db } from '../db/database';
import { apiClient } from './apiClient';
import { addToSyncQueue } from './syncQueueService';
import { canSyncNow } from './networkCheckService';
import { generateTimeSlots } from '../utils/appointmentUtils';

export const getNurseExecutions = (filters = {}) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    let query = `
      SELECT 
        ae.AppointmentExecution_ID,
        ae.Appointment_ID,
        ae.ScheduledDateTime,
        ae.ExecutedAt,
        ae.Status as execStatus,
        ae.Notes as execNotes,
        COALESCE(a.name, 'Назначение') as appointmentName,
        COALESCE(a.type, 'medication') as type,
        COALESCE(a.priority, 'medium') as priority,
        a.instructions,
        a.notes as appointmentNotes,
        a.medicationData,
        a.scheduleData,
        a.hospitalizationId,
        COALESCE(p.fullName, 'Пациент') as patientName,
        COALESCE(h.room, '?') as room,
        COALESCE(CAST(h.room AS INTEGER), 999) as roomNumber
      FROM AppointmentExecutions ae
      LEFT JOIN appointments a ON ae.Appointment_ID = a.id AND a.isDeleted = 0
      LEFT JOIN hospitalizations h ON a.hospitalizationId = h.id
      LEFT JOIN patients p ON h.patientId = p.id
      WHERE ae.isDeleted = 0 
        AND ae.Status = 'pending'
    `;
    
    const params = [];
    
// Фильтр "Сегодня"
if (filters.today) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  
  query += ` AND ae.ScheduledDateTime > ? AND ae.ScheduledDateTime < ?`;
  params.push(todayStart.toISOString());
  params.push(todayEnd.toISOString());
}
    // Фильтр "Срочные"
    if (filters.urgent) {
      query += ` AND a.priority = 'high'`;
    }
    
    // Фильтр "Ближайшие" (4 часа)
    if (filters.upcoming) {
      query += ` AND ae.ScheduledDateTime > ? AND ae.ScheduledDateTime < ?`;
      params.push(new Date().toISOString());
      params.push(new Date(Date.now() + 4 * 3600000).toISOString());
    }
    
    // Фильтр "Лекарства" - injection + medication
    if (filters.medication) {
      query += ` AND (a.type = 'medication' OR a.type = 'injection')`;
    }
    
    // Фильтр "Процедуры" - всё кроме лекарств
    if (filters.procedures) {
      query += ` AND a.type != 'medication' AND a.type != 'injection'`;
    }
    
    // Сортировка: время → приоритет → палата
    query += ` ORDER BY 
      ae.ScheduledDateTime ASC,
      CASE COALESCE(a.priority, 'medium') 
        WHEN 'high' THEN 1 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 3 
        ELSE 4 
      END,
      roomNumber ASC`;
    
    const result = db.execute(query, params);
    const executions = result.rows?._array || [];
    
    console.log(`Found ${executions.length} executions for filter:`, Object.keys(filters));
    
    return executions.map(ex => {
      const medicationData = ex.medicationData ? JSON.parse(ex.medicationData) : {};
      const scheduleData = ex.scheduleData ? JSON.parse(ex.scheduleData) : {};
      
      return {
        id: ex.AppointmentExecution_ID,
        appointmentId: ex.Appointment_ID,
        scheduledTime: ex.ScheduledDateTime,
        executedAt: ex.ExecutedAt,
        status: ex.execStatus,
        notes: ex.execNotes,
        appointmentName: ex.appointmentName || 'Назначение',
        type: ex.type || 'medication',
        priority: ex.priority || 'medium',
        instructions: ex.instructions || '',
        appointmentNotes: ex.appointmentNotes || '',
        patientName: ex.patientName || 'Пациент',
        room: ex.room || '?',
        medicationName: medicationData?.name || medicationData?.customName || null,
        medicationDosage: medicationData?.dosage || null,
        medicationForm: medicationData?.form || null,
        relationToMeal: scheduleData?.relationToMeal || null,
        frequency: scheduleData?.frequency || null,
      };
    });
  } catch (error) {
    console.error('Failed to get nurse executions:', error);
    return [];
  }
};

// Создать назначение с генерацией Execution'ов

export const createAppointment = async (appointmentData) => {
  const localAppId = `local_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  // Сохраняем ТОЛЬКО назначение, без executions
  db.execute(`
    INSERT INTO appointments 
    (id, hospitalizationId, templateId, type, name, priority, durationMin,
     instructions, notes, status, createdAt, scheduleData, medicationData,
     version, updatedAt, isDeleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    localAppId, appointmentData.hospitalizationId, appointmentData.templateId,
    appointmentData.type, appointmentData.name, appointmentData.priority,
    appointmentData.durationMin, appointmentData.instructions || '', appointmentData.notes || '',
    'pending', now,
    JSON.stringify(appointmentData.schedule),
    appointmentData.medication ? JSON.stringify(appointmentData.medication) : null,
    1, now, 0
  ]);

  // Добавляем в sync_queue
  addToSyncQueue('appointments', 'INSERT', localAppId, {
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

  console.log('Appointment created locally:', localAppId);
  return { id: localAppId };
};

// Отметить выполнение
export const completeExecution = async (executionId, userId) => {
  const now = new Date().toISOString();

  db.execute(`
    UPDATE AppointmentExecutions 
    SET Status = 'completed', ExecutedAt = ?, ExecutedUser_ID = ?, UpdatedDt = ?
    WHERE AppointmentExecution_ID = ? AND IsDeleted = 0
  `, [now, userId, now, executionId]);

  addToSyncQueue('appointmentExecutions', 'UPDATE', executionId, {
    status: 'completed',
    executedAt: now,
    executedUserId: userId
  });

  return true;
};

// Получить назначения пациента
export const getPatientAppointments = (hospitalizationId) => {
  try {
    const result = db.execute(`
      SELECT * FROM appointments
      WHERE hospitalizationId = ? AND isDeleted = 0
      ORDER BY createdAt DESC
    `, [hospitalizationId]);

    return (result.rows?._array || []).map(apt => ({
      ...apt,
      schedule: apt.scheduleData ? JSON.parse(apt.scheduleData) : null,
      medication: apt.medicationData ? JSON.parse(apt.medicationData) : null,
    }));
  } catch (error) {
    console.error('Failed to get patient appointments:', error);
    return [];
  }
};

// Завершить назначение полностью (врач отменяет)

export const completeAppointment = async (appointmentId, userId) => {
  const now = new Date().toISOString();

  try {
    // Завершаем само назначение (используем ТОЛЬКО существующие поля)
    db.execute(`
      UPDATE appointments 
      SET status = 'completed', 
          updatedAt = ?, 
          version = version + 1 
      WHERE id = ?
    `, [now, appointmentId]);

    // Завершаем все невыполненные execution'ы
    db.execute(`
      UPDATE AppointmentExecutions 
      SET Status = 'cancelled', 
          UpdatedDt = ?
      WHERE Appointment_ID = ? AND Status = 'pending' AND IsDeleted = 0
    `, [now, appointmentId]);

    // Добавляем в sync_queue (только существующие поля)
    addToSyncQueue('appointments', 'UPDATE', appointmentId, {
      status: 'completed'
    });

    console.log('Appointment completed:', appointmentId);
    return true;
  } catch (error) {
    console.error('Failed to complete appointment:', error);
    throw error;
  }
};

export const syncAppointments = async (hospitalizationId) => {
  try {
    const syncCheck = await canSyncNow();
    if (!syncCheck.canSync) return false;

    const { processSyncQueue } = require('./syncQueueService');
    await processSyncQueue();

    const response = await apiClient.get(`/Sync/appointments?hospitalizationId=${hospitalizationId || ''}`);

    if (response.success && response.data) {
      for (const item of response.data) {
        const apt = item.appointment;
        const executions = item.executions || [];

        // Сохраняем schedule как JSON
        const scheduleData = apt.schedule ? JSON.stringify(apt.schedule) : null;

        // Сохраняем/обновляем appointment
        const existing = db.execute('SELECT id FROM appointments WHERE id = ?', [apt.id]);

        if (existing.rows?._array?.length === 0) {
          db.execute(`
            INSERT INTO appointments 
            (id, hospitalizationId, templateId, type, name, priority, durationMin,
             instructions, notes, status, createdAt, updatedAt, isDeleted, version,
             scheduleData)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            apt.id, apt.hospitalizationId, apt.templateId, apt.type, apt.name,
            apt.priority, apt.durationMin,
            apt.instructions || '', apt.notes || '',
            apt.status || 'pending',
            apt.createdDt || new Date().toISOString(),
            apt.updatedDt || new Date().toISOString(),
            0, apt.version || 1,
            scheduleData
          ]);
        } else {
          db.execute(`
            UPDATE appointments SET
              status = ?, priority = ?, instructions = ?, notes = ?,
              scheduleData = ?,
              version = ?, updatedAt = ?
            WHERE id = ?
          `, [
            apt.status || 'pending', apt.priority,
            apt.instructions || '', apt.notes || '',
            scheduleData,
            apt.version || 1, apt.updatedDt || new Date().toISOString(), apt.id
          ]);
        }

        // Сохраняем executions
        for (const exec of executions) {
          const existingExec = db.execute(
            'SELECT AppointmentExecution_ID FROM AppointmentExecutions WHERE AppointmentExecution_ID = ?',
            [exec.id]
          );

          if (existingExec.rows?._array?.length === 0) {
            db.execute(`
              INSERT INTO AppointmentExecutions 
              (AppointmentExecution_ID, Appointment_ID, ScheduledDateTime, ExecutedAt,
               ExecutedUser_ID, Status, Notes, CreatedDt, UpdatedDt, IsDeleted, Version)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              exec.id, exec.appointmentId,
              exec.scheduledDateTime, exec.executedAt || null,
              exec.executedUserId || null,
              exec.status || 'pending', exec.notes || '',
              exec.createdDt || new Date().toISOString(),
              exec.updatedDt || new Date().toISOString(),
              0, exec.version || 1
            ]);
          } else {
            db.execute(`
              UPDATE AppointmentExecutions SET
                Status = ?, ExecutedAt = ?, ExecutedUser_ID = ?,
                Notes = ?, Version = ?, UpdatedDt = ?
              WHERE AppointmentExecution_ID = ?
            `, [
              exec.status || 'pending', exec.executedAt || null, exec.executedUserId || null,
              exec.notes || '', exec.version || 1,
              exec.updatedDt || new Date().toISOString(), exec.id
            ]);
          }
        }
      }

      console.log(`Synced appointments with executions`);
      return true;
    }

    return false;
  } catch (error) {
    if (error.message !== 'NETWORK_UNAVAILABLE') {
      console.error('Failed to sync appointments:', error);
    }
    return false;
  }
};

// Синхронизация ВСЕХ appointments (для медсестры)
export const syncAllAppointments = async () => {
  try {
    const syncCheck = await canSyncNow();
    if (!syncCheck.canSync) return false;

    const { processSyncQueue } = require('./syncQueueService');
    await processSyncQueue();

    const response = await apiClient.get('/Sync/appointments');

    if (response.success && response.data) {
      for (const item of response.data) {
        const apt = item.appointment;
        const executions = item.executions || [];

        // Сохраняем schedule как JSON
        const scheduleData = apt.schedule ? JSON.stringify(apt.schedule) : null;

        // Сохраняем/обновляем appointment
        const existing = db.execute('SELECT id FROM appointments WHERE id = ?', [apt.id]);

        if (existing.rows?._array?.length === 0) {
          db.execute(`
            INSERT INTO appointments 
            (id, hospitalizationId, templateId, type, name, priority, durationMin,
             instructions, notes, status, createdAt, updatedAt, isDeleted, version,
             scheduleData)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            apt.id, apt.hospitalizationId, apt.templateId, apt.type, apt.name,
            apt.priority, apt.durationMin,
            apt.instructions || '', apt.notes || '',
            apt.status || 'pending',
            apt.createdDt || new Date().toISOString(),
            apt.updatedDt || new Date().toISOString(),
            0, apt.version || 1,
            scheduleData
          ]);
        } else {
          db.execute(`
            UPDATE appointments SET
              status = ?, priority = ?, instructions = ?, notes = ?,
              scheduleData = ?,
              version = ?, updatedAt = ?
            WHERE id = ?
          `, [
            apt.status || 'pending', apt.priority,
            apt.instructions || '', apt.notes || '',
            scheduleData,
            apt.version || 1, apt.updatedDt || new Date().toISOString(), apt.id
          ]);
        }

        // Сохраняем executions
        for (const exec of executions) {
          const existingExec = db.execute(
            'SELECT AppointmentExecution_ID FROM AppointmentExecutions WHERE AppointmentExecution_ID = ?',
            [exec.id]
          );

          if (existingExec.rows?._array?.length === 0) {
            db.execute(`
              INSERT INTO AppointmentExecutions 
              (AppointmentExecution_ID, Appointment_ID, ScheduledDateTime, ExecutedAt,
               ExecutedUser_ID, Status, Notes, CreatedDt, UpdatedDt, IsDeleted, Version)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              exec.id, exec.appointmentId,
              exec.scheduledDateTime, exec.executedAt || null,
              exec.executedUserId || null,
              exec.status || 'pending', exec.notes || '',
              exec.createdDt || new Date().toISOString(),
              exec.updatedDt || new Date().toISOString(),
              0, exec.version || 1
            ]);
          } else {
            db.execute(`
              UPDATE AppointmentExecutions SET
                Status = ?, ExecutedAt = ?, ExecutedUser_ID = ?,
                Notes = ?, Version = ?, UpdatedDt = ?
              WHERE AppointmentExecution_ID = ?
            `, [
              exec.status || 'pending', exec.executedAt || null, exec.executedUserId || null,
              exec.notes || '', exec.version || 1,
              exec.updatedDt || new Date().toISOString(), exec.id
            ]);
          }
        }
      } 
      console.log('All appointments synced with executions');
      return true;
    }
    return false;
  } catch (error) {
    if (error.message !== 'NETWORK_UNAVAILABLE') {
      console.error('Failed to sync all appointments:', error);
    }
    return false;
  }
};