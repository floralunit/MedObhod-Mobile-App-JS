import { db } from '../db/database';
import { apiClient } from './apiClient';
import { addToSyncQueue, processSyncQueue } from './syncQueueService';
import NetInfo from '@react-native-community/netinfo';
import { canSyncNow, invalidateCanSyncCache } from './networkCheckService';

export const getDoctorNotes = (hospitalizationId) => {
  try {
    const result = db.execute(`
      SELECT 
        DoctorNote_ID as id,
        Hospitalization_ID as hospitalizationId,
        Doctor_ID as doctorId,
        Complaints as complaints,
        ExaminationSummary as examinationSummary,
        TreatmentEffectiveness as treatmentEffectiveness,
        PlanNote as planNote,
        Notes as notes,
        CreatedDt as createdAt,
        (SELECT fullName FROM users WHERE id = Doctor_ID) as doctorName
      FROM DoctorNotes
      WHERE Hospitalization_ID = ? AND IsDeleted = 0
      ORDER BY CreatedDt DESC
    `, [hospitalizationId]);

    const rows = result.rows?._array || [];

    return rows.map(row => {
      let noteText = '';
      if (row.examinationSummary) noteText += `Осмотр: ${row.examinationSummary}\n`;
      if (row.notes) noteText += `${row.notes}\n`;
      if (!noteText && row.planNote) noteText = row.planNote;

      return {
        id: row.id,
        doctorId: row.doctorId,
        doctorName: row.doctorName || 'Врач',
        complaints: row.complaints || '',
        examinationSummary: row.examinationSummary || '',
        treatmentEffectiveness: row.treatmentEffectiveness || '',
        planNote: row.planNote || '',
        notes: row.notes || '',
        createdAt: row.createdAt,
        noteText: noteText.trim() || 'Нет заметок'
      };
    });
  } catch (error) {
    console.error('Failed to get doctor notes:', error);
    return [];
  }
};

export const addDoctorNote = async (hospitalizationId, doctorId, noteData) => {
  const localId = `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();

  // Сохраняем локально
  db.execute(`
    INSERT INTO DoctorNotes 
    (DoctorNote_ID, Hospitalization_ID, Doctor_ID, Complaints, ExaminationSummary,
     TreatmentEffectiveness, Notes, CreatedDt, UpdatedDt, IsDeleted, Version)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    localId, hospitalizationId, doctorId,
    noteData.complaints || '',
    noteData.examination || '',
    noteData.treatmentChanges || '',
    noteData.notes || '',
    now, now, 0, 1
  ]);

  // Добавляем в очередь синхронизации
  addToSyncQueue('doctorNotes', 'INSERT', localId, {
    hospitalizationId: hospitalizationId,
    doctorId: doctorId,
    complaints: noteData.complaints || '',
    examinationSummary: noteData.examination || '',
    treatmentEffectiveness: noteData.treatmentChanges || '',
    notes: noteData.notes || ''
  });

  // НЕ делаем немедленную синхронизацию - этим займется фоновая очередь
  // Это предотвращает дублирование

  return { id: localId };
};

// Синхронизация заметок с сервера - ТЕПЕРЬ ОБНОВЛЯЕТ СУЩЕСТВУЮЩИЕ
export const syncDoctorNotes = async (hospitalizationId = null) => {
  try {
    // Сначала отправляем локальные изменения
    await processSyncQueue();

    const syncCheck = await canSyncNow();
    if (!syncCheck.canSync) {
      return false;
    }

    let url = '/Sync/doctorNotes';
    if (hospitalizationId) {
      url += `?hospitalizationId=${hospitalizationId}`;
    }

    const response = await apiClient.get(url);

    if (response.success && response.data?.length > 0) {
      for (const note of response.data) {
        const existing = db.execute(
          'SELECT DoctorNote_ID, Version FROM DoctorNotes WHERE DoctorNote_ID = ?',
          [note.id]
        );

        if (existing.rows?._array?.length === 0) {
          // Новая запись - вставляем
          db.execute(`
            INSERT INTO DoctorNotes 
            (DoctorNote_ID, Hospitalization_ID, Doctor_ID, Complaints, ExaminationSummary,
             TreatmentEffectiveness, Notes, CreatedDt, UpdatedDt, IsDeleted, Version)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            note.id, note.hospitalizationId, note.doctorId,
            note.complaints || '', note.examinationSummary || '',
            note.treatmentEffectiveness || '', note.notes || '',
            note.createdDt || new Date().toISOString(),
            note.updatedDt || new Date().toISOString(),
            note.isDeleted ? 1 : 0,
            note.version || 1
          ]);
        } else {
          // Существующая запись - ОБНОВЛЯЕМ (включая isDeleted и version)
          const localVersion = existing.rows._array[0].Version || 0;
          const serverVersion = note.version || 0;

          // Обновляем только если версия сервера новее
          if (serverVersion > localVersion) {
            db.execute(`
              UPDATE DoctorNotes SET
                Complaints = ?,
                ExaminationSummary = ?,
                TreatmentEffectiveness = ?,
                Notes = ?,
                IsDeleted = ?,
                Version = ?,
                UpdatedDt = ?
              WHERE DoctorNote_ID = ?
            `, [
              note.complaints || '',
              note.examinationSummary || '',
              note.treatmentEffectiveness || '',
              note.notes || '',
              note.isDeleted ? 1 : 0,
              serverVersion,
              note.updatedDt || new Date().toISOString(),
              note.id
            ]);
            console.log(`Updated note ${note.id}, isDeleted: ${note.isDeleted}, version: ${serverVersion}`);
          }
        }
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