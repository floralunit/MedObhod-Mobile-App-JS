import { db } from '../db/database';
import { apiClient } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// Получение заметок врача для пациента
export const getDoctorNotes = (hospitalizationId) => {
  try {
    const result = db.execute(`
      SELECT 
        dn.id as noteId,
        dn.hospitalizationId,
        dn.doctorId,
        dn.complaints,
        dn.generalCondition,
        dn.mentalStatus,
        dn.temperature,
        dn.pulse,
        dn.bp,
        dn.respiratoryRate,
        dn.examinationSummary,
        dn.treatmentEffectiveness,
        dn.planNote,
        dn.createdAt,
        dn.updatedAt,
        u.fullName as doctorName
      FROM doctorNotes dn
      LEFT JOIN users u ON dn.doctorId = u.id
      WHERE dn.hospitalizationId = ? AND dn.isDeleted = 0
      ORDER BY dn.createdAt DESC
      LIMIT 1
    `, [hospitalizationId]);
    
    const notes = result.rows?._array || [];
    if (notes.length > 0) {
      const note = notes[0];
      // Формируем текст заметки из доступных полей
      let noteText = '';
      if (note.examinationSummary) noteText += note.examinationSummary + '\n';
      if (note.planNote) noteText += note.planNote;
      if (!noteText && note.complaints) noteText = note.complaints;
      if (!noteText && note.treatmentEffectiveness) noteText = note.treatmentEffectiveness;
      
      return {
        ...note,
        noteText: noteText.trim() || 'Нет заметок'
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to get doctor notes:', error);
    return null;
  }
};

// Синхронизация заметок врача с сервера
export const syncDoctorNotes = async (hospitalizationId) => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No internet, using cached doctor notes');
      return false;
    }

    const response = await apiClient.get('/Sync/doctorNotes');
    
    if (response.success && response.data && response.data.length > 0) {
      for (const note of response.data) {
        // Проверяем, относится ли заметка к текущей госпитализации
        if (hospitalizationId && note.hospitalizationId !== hospitalizationId) {
          continue;
        }
        
        db.execute(`
          INSERT OR REPLACE INTO doctorNotes 
          (id, hospitalizationId, doctorId, complaints, generalCondition, mentalStatus,
           temperature, pulse, bp, respiratoryRate, examinationSummary, 
           treatmentEffectiveness, planNote, version, updatedAt, isDeleted, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          note.id, note.hospitalizationId, note.doctorId, note.complaints,
          note.generalCondition, note.mentalStatus, note.temperature, note.pulse,
          note.bp, note.respiratoryRate, note.examinationSummary,
          note.treatmentEffectiveness, note.planNote,
          note.version || 1, note.updatedDt || new Date().toISOString(),
          note.isDeleted ? 1 : 0, note.updatedDt || new Date().toISOString()
        ]);
      }
      console.log(`Synced ${response.data.length} doctor notes`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to sync doctor notes:', error);
    return false;
  }
};

// Получение всех заметок для всех госпитализаций
export const syncAllDoctorNotes = async () => {
  try {
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      console.log('No internet, using cached doctor notes');
      return false;
    }

    const response = await apiClient.get('/Sync/doctorNotes');
    
    if (response.success && response.data && response.data.length > 0) {
      for (const note of response.data) {
        db.execute(`
          INSERT OR REPLACE INTO doctorNotes 
          (id, hospitalizationId, doctorId, complaints, generalCondition, mentalStatus,
           temperature, pulse, bp, respiratoryRate, examinationSummary, 
           treatmentEffectiveness, planNote, version, updatedAt, isDeleted, createdAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          note.id, note.hospitalizationId, note.doctorId, note.complaints,
          note.generalCondition, note.mentalStatus, note.temperature, note.pulse,
          note.bp, note.respiratoryRate, note.examinationSummary,
          note.treatmentEffectiveness, note.planNote,
          note.version || 1, note.updatedDt || new Date().toISOString(),
          note.isDeleted ? 1 : 0, note.updatedDt || new Date().toISOString()
        ]);
      }
      console.log(`Synced ${response.data.length} doctor notes`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to sync doctor notes:', error);
    return false;
  }
};