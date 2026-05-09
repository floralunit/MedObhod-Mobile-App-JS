import { db } from '../db/database';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Получение назначений пациента из локальной БД
export const getPatientAppointments = (hospitalizationId) => {
  try {
    const result = db.execute(`
      SELECT 
        a.id,
        a.hospitalizationId,
        a.templateId,
        a.type,
        a.name,
        a.priority,
        a.durationMin,
        a.instructions,
        a.notes,
        a.status,
        a.createdAt,
        a.scheduleData,
        a.medicationData
      FROM appointments a
      WHERE a.hospitalizationId = ? AND a.isDeleted = 0
      ORDER BY a.createdAt DESC
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

// Создание назначения
export const createAppointment = async (appointmentData) => {
  const localId = `local_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const localAppointment = {
    id: localId,
    hospitalizationId: appointmentData.hospitalizationId,
    templateId: appointmentData.templateId,
    type: appointmentData.type,
    name: appointmentData.name,
    priority: appointmentData.priority,
    durationMin: appointmentData.durationMin,
    instructions: appointmentData.instructions || '',
    notes: appointmentData.notes || '',
    status: 'pending',
    createdAt: new Date().toISOString(),
    scheduleData: JSON.stringify(appointmentData.schedule),
    medicationData: appointmentData.medication ? JSON.stringify(appointmentData.medication) : null,
    version: 1,
    updatedAt: new Date().toISOString(),
    isDeleted: 0
  };
  
  // Сохраняем локально
  db.execute(`
    INSERT INTO appointments 
    (id, hospitalizationId, templateId, type, name, priority, durationMin, 
     instructions, notes, status, createdAt, scheduleData, medicationData, 
     version, updatedAt, isDeleted)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    localAppointment.id, localAppointment.hospitalizationId, localAppointment.templateId,
    localAppointment.type, localAppointment.name, localAppointment.priority,
    localAppointment.durationMin, localAppointment.instructions, localAppointment.notes,
    localAppointment.status, localAppointment.createdAt, localAppointment.scheduleData,
    localAppointment.medicationData, localAppointment.version, localAppointment.updatedAt,
    localAppointment.isDeleted
  ]);
  
  // Отправляем на сервер
  const netState = await NetInfo.fetch();
  if (netState.isConnected) {
    try {
      const response = await apiClient.post('/Appointments', {
        hospitalizationId: appointmentData.hospitalizationId,
        templateId: appointmentData.templateId,
        type: appointmentData.type,
        name: appointmentData.name,
        priority: appointmentData.priority,
        durationMin: appointmentData.durationMin,
        instructions: appointmentData.instructions,
        notes: appointmentData.notes,
        schedule: appointmentData.schedule,
        medication: appointmentData.medication
      });
      
      if (response.success && response.data) {
        // Обновляем локальный ID на серверный
        db.execute(`UPDATE appointments SET id = ? WHERE id = ?`, [response.data.id, localId]);
        console.log('Appointment synced to server');
      }
    } catch (error) {
      console.error('Failed to sync appointment to server:', error);
    }
  }
  
  return localAppointment;
};

// Отметка выполнения назначения
export const completeAppointment = async (appointmentId, userId) => {
  try {
    // Обновляем локально
    db.execute(`
      UPDATE appointments 
      SET status = 'completed', 
          completedAt = ?, 
          completedBy = ?,
          updatedAt = ?,
          version = version + 1
      WHERE id = ?
    `, [new Date().toISOString(), userId, new Date().toISOString(), appointmentId]);
    
    // Отправляем на сервер
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      try {
        await apiClient.put(`/Appointments/${appointmentId}/complete`, userId);
        console.log('Appointment completion synced to server');
      } catch (error) {
        console.error('Failed to sync completion to server:', error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Failed to complete appointment:', error);
    throw error;
  }
};

// Синхронизация назначений с сервера (pull)
export const syncAppointments = async (hospitalizationId) => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No internet, using cached appointments');
      return false;
    }
    
    const response = await apiClient.get(`/Appointments/patient/${hospitalizationId}`);
    
    if (response.success && response.data) {
      const serverAppointments = response.data;
      
      if (serverAppointments.length > 0) {
        for (const apt of serverAppointments) {
          const existing = db.execute(`SELECT id FROM appointments WHERE id = ?`, [apt.id]);
          
          if (existing.rows?._array?.length === 0) {
            db.execute(`
              INSERT INTO appointments 
              (id, hospitalizationId, templateId, type, name, priority, durationMin,
               instructions, notes, status, createdAt, version, updatedAt, isDeleted)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              apt.id, apt.hospitalizationId, apt.templateId, apt.type, apt.name,
              apt.priority, apt.durationMin, apt.instructions, apt.notes, apt.status,
              apt.createdAt, apt.version || 1, apt.updatedAt || new Date().toISOString(), 0
            ]);
          } else if (apt.updatedAt && apt.updatedAt > existing.rows?._array?.[0]?.updatedAt) {
            // Обновляем существующую запись
            db.execute(`
              UPDATE appointments SET 
                status = ?, instructions = ?, notes = ?, updatedAt = ?, version = version + 1
              WHERE id = ?
            `, [apt.status, apt.instructions, apt.notes, apt.updatedAt, apt.id]);
          }
        }
        
        console.log(`Synced ${serverAppointments.length} appointments`);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to sync appointments:', error);
    return false;
  }
};

// Получение назначений для медсестры на сегодня
export const getNurseTodaysAppointments = async () => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      // Офлайн - берем из локальной БД
      const result = db.execute(`
        SELECT * FROM appointments 
        WHERE status = 'pending' AND isDeleted = 0
        ORDER BY priority DESC, createdAt ASC
        LIMIT 20
      `);
      return result.rows?._array || [];
    }
    
    const response = await apiClient.get('/Appointments/nurse/today');
    if (response.success && response.data) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    console.error('Failed to get nurse appointments:', error);
    return [];
  }
};