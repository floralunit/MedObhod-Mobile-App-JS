import { db } from '../db/database';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { canSyncNow } from './networkCheckService';

// Получение шаблонов из локальной БД
export const getAppointmentTemplates = () => {
  try {
    const result = db.execute(`
      SELECT 
        id,
        name,
        type,
        durationMin,
        requiresMedication,
        color
      FROM appointmentTemplates
      WHERE isDeleted = 0
      ORDER BY name
    `);
    return result.rows?._array || [];
  } catch (error) {
    console.error('Failed to get templates:', error);
    return [];
  }
};

// Получение лекарств из локальной БД
export const getMedications = () => {
  try {
    const result = db.execute(`
      SELECT 
        id,
        name,
        form,
        defaultDosage as dosage,
        category
      FROM medications
      WHERE isDeleted = 0
      ORDER BY name
    `);
    return result.rows?._array || [];
  } catch (error) {
    console.error('Failed to get medications:', error);
    return [];
  }
};

// Обновление шаблонов в локальной БД
const upsertTemplates = (templates) => {
  try {
    templates.forEach(t => {
      db.execute(`
        INSERT OR REPLACE INTO appointmentTemplates 
        (id, name, type, durationMin, requiresMedication, color, version, updatedAt, isDeleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        t.id, t.name, t.type, t.durationMin,
        t.requiresMedication ? 1 : 0,
        t.color || '#007aff',
        t.version || 1,
        t.updatedDt || new Date().toISOString(),
        t.isDeleted ? 1 : 0
      ]);
    });
    console.log(`Upserted ${templates.length} templates`);
  } catch (error) {
    console.error('Failed to upsert templates:', error);
  }
};

// Обновление лекарств в локальной БД
const upsertMedications = (medications) => {
  try {
    medications.forEach(m => {
      db.execute(`
        INSERT OR REPLACE INTO medications 
        (id, name, form, defaultDosage, category, version, updatedAt, isDeleted)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        m.id, m.name, m.form, m.defaultDosage, m.category,
        m.version || 1,
        m.updatedDt || new Date().toISOString(),
        m.isDeleted ? 1 : 0
      ]);
    });
    console.log(`Upserted ${medications.length} medications`);
  } catch (error) {
    console.error('Failed to upsert medications:', error);
  }
};

// Синхронизация шаблонов с сервера
export const syncTemplates = async () => {
  try {
    const syncCheck = await canSyncNow();
    if (!syncCheck.canSync) {
      console.log('No internet, using cached templates');
      return false;
    }

    const response = await apiClient.get('/Dictionary/templates', false);

    if (response.success && response.data) {
      upsertTemplates(response.data);
      await AsyncStorage.setItem('last_templates_sync', new Date().toISOString());
      console.log(`Synced ${response.data.length} templates`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to sync templates:', error);
    return false;
  }
};

// Синхронизация лекарств с сервера
export const syncMedications = async () => {
  try {
    const syncCheck = await canSyncNow();
    if (!syncCheck.canSync) {
      console.log('No internet, using cached medications');
      return false;
    }

    const response = await apiClient.get('/Dictionary/medications', false);

    if (response.success && response.data) {
      upsertMedications(response.data);
      await AsyncStorage.setItem('last_medications_sync', new Date().toISOString());
      console.log(`Synced ${response.data.length} medications`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to sync medications:', error);
    return false;
  }
};

// Полная синхронизация справочников
export const syncDictionary = async () => {
  await Promise.all([
    syncTemplates(),
    syncMedications()
  ]);
};