import { db } from '../db/database';
import { addToSyncQueue } from './syncQueueService';
import { getLocalPatients } from './patientSyncService';
import { getLatestNEWS } from './vitalSignsSyncService';

const getAge = (birthDate) => {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const now = new Date();

  let age = now.getFullYear() - birth.getFullYear();

  const m = now.getMonth() - birth.getMonth();

  if (
    m < 0 ||
    (m === 0 && now.getDate() < birth.getDate())
  ) {
    age--;
  }

  return age;
};

export const getActiveRoundFromLocalDB = (
  doctorId
) => {
  try {
    const today =
      new Date().toISOString().split('T')[0];

    const result = db.execute(
      `
      SELECT *
      FROM DoctorRounds
      WHERE Doctor_ID = ?
        AND IsDeleted = 0
        AND Status = 'in_progress'
        AND date(StartTime) = ?
      ORDER BY StartTime DESC
      LIMIT 1
    `,
      [doctorId, today]
    );

    const round =
      result.rows?._array?.[0];

    if (!round) return null;

    const items =
      getRoundItemsFromLocalDB(
        round.DoctorRound_ID
      );

    return {
      id: round.DoctorRound_ID,
      doctorId: round.Doctor_ID,
      startTime: round.StartTime,
      endTime: round.EndTime,
      status: round.Status,
      items
    };
  } catch (error) {
    console.error(
      'Failed get active round',
      error
    );
    return null;
  }
};

export const getRoundItemsFromLocalDB = (roundId) => {
  try {
    const result = db.execute(
      `
      SELECT
        dri.*,

        p.fullName AS patientName,
        p.birthDate,

        h.room,
        h.bed,
        h.status AS hospitalizationStatus,
        h.admissionDate,

        d.name AS diagnosis,

        (
          SELECT vs.newsScore
          FROM VitalSigns vs
          WHERE vs.hospitalizationId = dri.Hospitalization_ID
            AND vs.isDeleted = 0
          ORDER BY datetime(vs.createdDt) DESC
          LIMIT 1
        ) AS newsScore

      FROM DoctorRoundItems dri

      LEFT JOIN hospitalizations h
        ON h.id = dri.Hospitalization_ID

      LEFT JOIN patients p
        ON p.id = h.patientId

      LEFT JOIN patientDiagnoses pd
        ON pd.hospitalizationId = h.id
        AND pd.isPrimary = 1
        AND pd.isDeleted = 0

      LEFT JOIN diagnoses d
        ON d.id = pd.diagnosisId

      WHERE dri.Round_ID = ?
        AND dri.IsDeleted = 0

      ORDER BY dri.OrderIndex ASC
      `,
      [roundId]
    );

    const items = result.rows?._array || [];

    return items.map(item => {
      let age = null;

      if (item.birthDate) {
        const birth = new Date(item.birthDate);
        const today = new Date();

        age = today.getFullYear() - birth.getFullYear();

        const monthDiff =
          today.getMonth() - birth.getMonth();

        if (
          monthDiff < 0 ||
          (
            monthDiff === 0 &&
            today.getDate() < birth.getDate()
          )
        ) {
          age--;
        }
      }

      return {
        ...item,
        patientName:
          item.patientName || 'Пациент',

        room:
          item.room || '?',

        diagnosis:
          item.diagnosis || 'Не указан',

        newsScore:
          item.newsScore || 0,

        age
      };
    });
  } catch (error) {
    console.error(
      'Failed get round items',
      error
    );

    return [];
  }
};

export const createRoundLocally = (
  doctorId,
  patients
) => {
  const roundId =
    `round_${Date.now()}`;

  const now =
    new Date().toISOString();

  db.execute(
    `
    INSERT INTO DoctorRounds (
      DoctorRound_ID,
      Doctor_ID,
      StartTime,
      Status,
      CreatedDt,
      UpdatedDt,
      IsDeleted,
      Version
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      roundId,
      doctorId,
      now,
      'in_progress',
      now,
      now,
      0,
      1
    ]
  );

  patients.forEach(
    (patient, index) => {
      const itemId =
        `rounditem_${Date.now()}_${index}`;

      db.execute(
        `
        INSERT INTO DoctorRoundItems (
          DoctorRoundItem_ID,
          Round_ID,
          Hospitalization_ID,
          OrderIndex,
          Status,
          CreatedDt,
          UpdatedDt,
          IsDeleted,
          Version
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          itemId,
          roundId,
          patient.hospitalizationId,
          index,
          'pending',
          now,
          now,
          0,
          1
        ]
      );
    }
  );

  console.log(
    `Round created ${roundId}`
  );

  return { id: roundId };
};

export const completeRoundItemLocally =
  (roundItemId) => {
    const now =
      new Date().toISOString();

    db.execute(
      `
      UPDATE DoctorRoundItems
      SET
        Status = 'completed',
        EndVisitTime = ?,
        UpdatedDt = ?
      WHERE DoctorRoundItem_ID = ?
    `,
      [now, now, roundItemId]
    );
  };

export const completeRoundLocally =
  async (roundId) => {

    const now =
      new Date().toISOString();

    db.execute(
      `
      UPDATE DoctorRounds
      SET
        Status = 'completed',
        EndTime = ?,
        UpdatedDt = ?
      WHERE DoctorRound_ID = ?
    `,
      [now, now, roundId]
    );

    const round =
      db.execute(
        `
        SELECT *
        FROM DoctorRounds
        WHERE DoctorRound_ID = ?
      `,
        [roundId]
      ).rows._array[0];

    const items =
      db.execute(
        `
        SELECT *
        FROM DoctorRoundItems
        WHERE Round_ID = ?
        ORDER BY OrderIndex
      `,
        [roundId]
      ).rows._array;

    addToSyncQueue(
      'doctorRounds',
      'INSERT',
      roundId,
      {
        DoctorId:
          round.Doctor_ID,

        StartTime:
          round.StartTime,

        EndTime:
          now,

        Status:
          'completed',

        Items: items.map(
          item => ({
            HospitalizationId:
              item.Hospitalization_ID,

            OrderIndex:
              item.OrderIndex,

            PlannedTime:
              item.PlannedTime_Dt,

            StartVisitTime:
              item.StartVisitTime,

            EndVisitTime:
              item.EndVisitTime,

            Status:
              item.Status
          })
        )
      }
    );

    console.log(
      `Round ${roundId} saved locally and queued`
    );
  };

export const getPatientsForRound =
  async (doctorId) => {

    const patients =
      await getLocalPatients();

    const myPatients =
      patients.filter(
        x =>
          x.doctorId === doctorId &&
          x.hospitalizationId
      );

    const enriched =
      myPatients.map(p => {

        const news =
          getLatestNEWS(
            p.hospitalizationId
          );

        const lastVisit =
          db.execute(
            `
            SELECT MAX(dr.EndTime)
            as LastVisitedAt
            FROM DoctorRoundItems dri
            INNER JOIN DoctorRounds dr
            ON dr.DoctorRound_ID =
               dri.Round_ID
            WHERE dri.Hospitalization_ID = ?
            AND dri.Status = 'completed'
          `,
            [p.hospitalizationId]
          ).rows._array?.[0]
            ?.LastVisitedAt;

        return {
          ...p,
          newsScore:
            news.newsScore || 0,
          lastVisit
        };
      });

    return enriched.sort((a, b) => {

      // 1 критические
      if (
        a.newsScore >= 7 &&
        b.newsScore < 7
      ) return -1;

      if (
        b.newsScore >= 7 &&
        a.newsScore < 7
      ) return 1;

      // 2 warning
      if (
        a.newsScore >= 5 &&
        b.newsScore < 5
      ) return -1;

      if (
        b.newsScore >= 5 &&
        a.newsScore < 5
      ) return 1;

      // 3 давно не посещали
      const aVisit =
        a.lastVisit
          ? new Date(a.lastVisit)
          : new Date(0);

      const bVisit =
        b.lastVisit
          ? new Date(b.lastVisit)
          : new Date(0);

      if (aVisit < bVisit)
        return -1;

      if (aVisit > bVisit)
        return 1;

      // 4 палата
      return (
        (parseInt(a.room) || 0) -
        (parseInt(b.room) || 0)
      );
    });
  };

  // Очистка старых обходов
export const cleanupStaleRoundsLocally = (
  doctorId
) => {
  try {
    const today =
      new Date()
        .toISOString()
        .split('T')[0];

    const now =
      new Date().toISOString();

    // Закрываем незавершённые обходы
    // не сегодняшнего дня
    db.execute(
      `
      UPDATE DoctorRounds
      SET
        Status = 'completed',
        EndTime = ?,
        UpdatedDt = ?
      WHERE Doctor_ID = ?
        AND IsDeleted = 0
        AND Status IN (
          'pending',
          'in_progress'
        )
        AND date(StartTime) < date(?)
    `,
      [
        now,
        now,
        doctorId,
        today,
      ]
    );

    // Закрываем items
    db.execute(
      `
      UPDATE DoctorRoundItems
      SET
        Status = 'completed',
        EndVisitTime = ?,
        UpdatedDt = ?
      WHERE Round_ID IN (
        SELECT DoctorRound_ID
        FROM DoctorRounds
        WHERE Doctor_ID = ?
          AND date(StartTime)
              < date(?)
      )
      AND Status IN (
        'pending',
        'in_progress'
      )
    `,
      [
        now,
        now,
        doctorId,
        today,
      ]
    );

    console.log(
      'Old rounds cleaned'
    );
  } catch (error) {
    console.error(
      'cleanupStaleRoundsLocally error:',
      error
    );
  }
};