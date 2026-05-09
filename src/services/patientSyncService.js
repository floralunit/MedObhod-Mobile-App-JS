import { db } from '../db/database';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Получение текущего пользователя
const getCurrentUser = async () => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

// Расчёт возраста
const calculateAge = (birthDate) => {
  if (!birthDate) return 0;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Получение пациентов в зависимости от роли
// Получение пациентов в зависимости от роли
export const getLocalPatients = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return [];
    
    let query = `
      SELECT 
        p.id,
        p.fullName,
        p.birthDate,
        p.gender,
        p.version,
        h.id as hospitalizationId,
        h.room,
        h.bed,
        h.status,
        h.admissionDate,
        h.dischargeDate,
        u.fullName as doctorName,
        u.id as doctorId,
        (
          SELECT d.name
          FROM patientDiagnoses pd
          JOIN diagnoses d ON pd.diagnosisId = d.id
          WHERE pd.hospitalizationId = h.id AND pd.isPrimary = 1 AND (pd.isDeleted = 0 OR pd.isDeleted IS NULL)
          LIMIT 1
        ) as diagnosis,
        (
          SELECT vs.newsScore 
          FROM vitalSigns vs 
          WHERE vs.hospitalizationId = h.id 
          ORDER BY vs.measuredAt DESC 
          LIMIT 1
        ) as newsScore
      FROM patients p
      LEFT JOIN hospitalizations h ON p.id = h.patientId AND (h.isDeleted = 0 OR h.isDeleted IS NULL) AND h.dischargeDate IS NULL
      LEFT JOIN users u ON h.attendingDoctorId = u.id
      WHERE p.isDeleted = 0 OR p.isDeleted IS NULL
    `;
    
    if (currentUser.role !== 'head') {
      query += ` AND h.attendingDoctorId = '${currentUser.id}'`;
    }
    
    query += ` ORDER BY 
      CASE h.status 
        WHEN 'critical' THEN 1 
        WHEN 'warning' THEN 2 
        ELSE 3 
      END,
      p.fullName`;
    
    const result = db.execute(query);
    const patients = result.rows?._array || [];
    
    return patients.map(p => ({
      id: p.id,
      name: p.fullName,
      age: calculateAge(p.birthDate),
      room: p.room,
      diagnosis: p.diagnosis || 'Диагноз не указан',
      status: p.status || 'stable',
      newsScore: p.newsScore || 0,
      hospitalizationId: p.hospitalizationId,
      doctorName: p.doctorName,
      doctorId: p.doctorId
    }));
  } catch (error) {
    console.error('Failed to get local patients:', error);
    return [];
  }
};

// Получение всех пациентов (только для заведующего)
export const getAllPatients = () => {
  try {
    const result = db.execute(`
      SELECT 
        p.id,
        p.fullName,
        p.birthDate,
        h.room,
        h.status,
        u.fullName as doctorName,
        u.id as doctorId
      FROM patients p
      LEFT JOIN hospitalizations h ON p.id = h.patientId AND (h.isDeleted = 0 OR h.isDeleted IS NULL) AND h.dischargeDate IS NULL
      LEFT JOIN users u ON h.attendingDoctorId = u.id
      WHERE p.isDeleted = 0 OR p.isDeleted IS NULL
      ORDER BY u.fullName, p.fullName
    `);
    return result.rows?._array || [];
  } catch (error) {
    console.error('Failed to get all patients:', error);
    return [];
  }
};

// Получение пациента по ID
export const getPatientById = (patientId) => {
  try {
    const result = db.execute(`
      SELECT p.*, h.id as hospitalizationId, h.room, h.bed, h.status
      FROM patients p
      LEFT JOIN hospitalizations h ON p.id = h.patientId AND (h.isDeleted = 0 OR h.isDeleted IS NULL)
      WHERE p.id = ? AND (p.isDeleted = 0 OR p.isDeleted IS NULL)
    `, [patientId]);
    return result.rows?._array?.[0] || null;
  } catch (error) {
    console.error('Failed to get patient by id:', error);
    return null;
  }
};

// Обновление пациентов в локальной БД
export const upsertPatients = (patients) => {
  try {
    patients.forEach(p => {
      db.execute(
        `INSERT OR REPLACE INTO patients 
         (id, fullName, birthDate, gender, version, updatedAt, isDeleted, lastSyncAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.fullName,
          p.birthDt,
          p.gender,
          p.version || 1,
          p.updatedDt || new Date().toISOString(),
          p.isDeleted ? 1 : 0,
          new Date().toISOString()
        ]
      );
    });
    console.log(`Upserted ${patients.length} patients`);
  } catch (error) {
    console.error('Failed to upsert patients:', error);
  }
};

// Обновление госпитализаций
export const upsertHospitalizations = (hospitalizations) => {
  try {
    hospitalizations.forEach(h => {
      db.execute(
        `INSERT OR REPLACE INTO hospitalizations 
         (id, patientId, admissionDate, dischargeDate, room, bed, attendingDoctorId, status, version, updatedAt, isDeleted)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          h.id,
          h.patientId,
          h.admissionDt,
          h.dischargeDt,
          h.room,
          h.bed,
          h.attendingDoctorId,
          h.status,
          h.version || 1,
          h.updatedDt || new Date().toISOString(),
          h.isDeleted ? 1 : 0
        ]
      );
    });
    console.log(`Upserted ${hospitalizations.length} hospitalizations`);
  } catch (error) {
    console.error('Failed to upsert hospitalizations:', error);
  }
};

// Синхронизация связей пациент-диагноз
export const syncPatientDiagnoses = async () => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No internet, using cached patient diagnoses');
      return false;
    }

    const lastSync = await AsyncStorage.getItem('last_patient_diagnoses_sync_time');
    const response = await apiClient.get(`/Sync/patientDiagnoses?since=${lastSync || ''}`);
    
    if (response.success && response.data && response.data.length > 0) {
      for (const pd of response.data) {
        db.execute(`
          INSERT OR REPLACE INTO patientDiagnoses 
          (id, hospitalizationId, diagnosisId, isPrimary, version, updatedAt, isDeleted)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          pd.id, pd.hospitalizationId, pd.diagnosisId, 
          pd.isPrimary ? 1 : 0, 
          pd.version || 1, 
          pd.updatedDt || new Date().toISOString(), 
          pd.isDeleted ? 1 : 0
        ]);
      }
      await AsyncStorage.setItem('last_patient_diagnoses_sync_time', new Date().toISOString());
      console.log(`Synced ${response.data.length} patient diagnoses`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to sync patient diagnoses:', error);
    return false;
  }
};

// Синхронизация диагнозов из справочника
export const syncDiagnoses = async () => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No internet, using cached diagnoses');
      return false;
    }

    const response = await apiClient.get('/Dictionary/diagnoses', false);
    
    if (response.success && response.data) {
      for (const d of response.data) {
        db.execute(`
          INSERT OR REPLACE INTO diagnoses 
          (id, name, code, version, updatedAt, isDeleted)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          d.id, d.name, d.code,
          d.version || 1,
          d.updatedDt || new Date().toISOString(),
          d.isDeleted ? 1 : 0
        ]);
      }
      console.log(`Synced ${response.data.length} diagnoses`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to sync diagnoses:', error);
    return false;
  }
};

// Обновите syncPatients - добавьте синхронизацию диагнозов
export const syncPatients = async () => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No internet, using cached patients');
      return false;
    }

    const lastSync = await AsyncStorage.getItem('last_patient_sync_time');
    
    // Синхронизируем пациентов
    const patientsResponse = await apiClient.get(`/Sync/patients?since=${lastSync || ''}`);
    if (patientsResponse.success && patientsResponse.data) {
      upsertPatients(patientsResponse.data);
    }
    
    // Синхронизируем госпитализации
    const hospitalizationsResponse = await apiClient.get(`/Sync/hospitalizations?since=${lastSync || ''}`);
    if (hospitalizationsResponse.success && hospitalizationsResponse.data) {
      upsertHospitalizations(hospitalizationsResponse.data);
    }
    
    // Синхронизируем справочник диагнозов
    await syncDiagnoses();
    
    // Синхронизируем связи пациент-диагноз
    await syncPatientDiagnoses();
    
    await AsyncStorage.setItem('last_patient_sync_time', new Date().toISOString());
    console.log('Patients synced successfully');
    
    return true;
  } catch (error) {
    console.error('Failed to sync patients:', error);
    return false;
  }
};

// Получение врачей для назначения
export const getDoctorsForAssignment = () => {
  try {
    const result = db.execute(`
      SELECT id, fullName, login
      FROM users 
      WHERE role = 'doctor' AND (isDeleted = 0 OR isDeleted IS NULL)
      ORDER BY fullName
    `);
    return result.rows?._array || [];
  } catch (error) {
    console.error('Failed to get doctors:', error);
    return [];
  }
};

// Назначение пациента врачу
export const assignPatientToDoctor = async (patientId, doctorId, hospitalizationId) => {
  try {
    db.execute(
      `UPDATE hospitalizations SET attendingDoctorId = ?, updatedAt = ?, version = version + 1 
       WHERE id = ?`,
      [doctorId, new Date().toISOString(), hospitalizationId]
    );
    
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      // Отправляем на сервер (через sync или прямой запрос)
      await apiClient.put(`/Sync/hospitalizations/${hospitalizationId}`, { attendingDoctorId: doctorId });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to assign patient:', error);
    throw error;
  }
};