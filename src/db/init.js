import { db } from './database';

export const initDB = () => {
  // Таблица users с полем для офлайн-работы
  db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      login TEXT,
      fullName TEXT,
      role TEXT,
      version INTEGER,
      updatedAt TEXT,
      isDeleted INTEGER
    );
  `);

   // Таблица sync_queue для офлайн-синхронизации
 db.execute(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity_name TEXT NOT NULL,
      operation TEXT NOT NULL,
      local_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      synced_at TEXT,
      retry_count INTEGER DEFAULT 0,
      last_error TEXT
    );
  `);
  
  // Индексы
  db.execute(`CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);`);
  db.execute(`CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(created_at);`);
  
  // Индекс для быстрого поиска
  db.execute(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
  db.execute(`CREATE INDEX IF NOT EXISTS idx_users_isDeleted ON users(isDeleted);`);

    // Таблица patients
  db.execute(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      fullName TEXT,
      birthDate TEXT,
      gender TEXT,
      version INTEGER,
      updatedAt TEXT,
      isDeleted INTEGER,
      lastSyncAt TEXT
    );
  `);
  
  // Таблица hospitalizations (госпитализации)
db.execute(`
    CREATE TABLE IF NOT EXISTS hospitalizations (
      id TEXT PRIMARY KEY,
      patientId TEXT,
      admissionDate TEXT,
      dischargeDate TEXT,
      room TEXT,
      bed TEXT,
      attendingDoctorId TEXT,
      status TEXT,
      version INTEGER,
      updatedAt TEXT,
      isDeleted INTEGER,
      FOREIGN KEY (patientId) REFERENCES patients(id)
    );
  `);
  
  // Таблица vitalSigns (показатели)
  db.execute(`
    CREATE TABLE IF NOT EXISTS vitalSigns (
      id TEXT PRIMARY KEY,
      hospitalizationId TEXT,
      measuredAt TEXT,
      temperature REAL,
      pulse INTEGER,
      systolicBP INTEGER,
      diastolicBP INTEGER,
      spo2 INTEGER,
      respiratoryRate INTEGER,
      newsScore INTEGER,
      userId TEXT,
      version INTEGER,
      updatedAt TEXT,
      isDeleted INTEGER,
      FOREIGN KEY (hospitalizationId) REFERENCES hospitalizations(id)
    );
  `);

  db.execute(`CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(isDeleted);`);
  db.execute(`CREATE INDEX IF NOT EXISTS idx_hospitalizations_patient ON hospitalizations(patientId);`);
  db.execute(`CREATE INDEX IF NOT EXISTS idx_vitals_hospitalization ON vitalSigns(hospitalizationId);`);

  // Таблица appointments
  db.execute(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      hospitalizationId TEXT,
      templateId TEXT,
      type TEXT,
      name TEXT,
      priority TEXT,
      durationMin INTEGER,
      instructions TEXT,
      notes TEXT,
      status TEXT,
      createdAt TEXT,
      completedAt TEXT,
      completedBy TEXT,
      scheduleData TEXT,
      medicationData TEXT,
      version INTEGER,
      updatedAt TEXT,
      isDeleted INTEGER,
      FOREIGN KEY (hospitalizationId) REFERENCES hospitalizations(id)
    );
  `);

// Таблица appointmentTemplates
db.execute(`
  CREATE TABLE IF NOT EXISTS appointmentTemplates (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT,
    durationMin INTEGER,
    requiresMedication INTEGER,
    color TEXT,
    version INTEGER,
    updatedAt TEXT,
    isDeleted INTEGER
  );
`);

// Таблица medications
db.execute(`
  CREATE TABLE IF NOT EXISTS medications (
    id TEXT PRIMARY KEY,
    name TEXT,
    form TEXT,
    defaultDosage TEXT,
    category TEXT,
    version INTEGER,
    updatedAt TEXT,
    isDeleted INTEGER
  );
`);

// Таблица diagnoses
db.execute(`
  CREATE TABLE IF NOT EXISTS diagnoses (
    id TEXT PRIMARY KEY,
    name TEXT,
    code TEXT,
    version INTEGER,
    updatedAt TEXT,
    isDeleted INTEGER
  );
`);

// Таблица patientDiagnoses (связь пациент-диагноз)
db.execute(`
  CREATE TABLE IF NOT EXISTS patientDiagnoses (
    id TEXT PRIMARY KEY,
    hospitalizationId TEXT,
    diagnosisId TEXT,
    isPrimary INTEGER,
    version INTEGER,
    updatedAt TEXT,
    isDeleted INTEGER,
    FOREIGN KEY (hospitalizationId) REFERENCES hospitalizations(id),
    FOREIGN KEY (diagnosisId) REFERENCES diagnoses(id)
  );
`);

// Таблица doctorNotes
db.execute(`
  CREATE TABLE IF NOT EXISTS doctorNotes (
    id TEXT PRIMARY KEY,
    hospitalizationId TEXT,
    doctorId TEXT,
    complaints TEXT,
    generalCondition TEXT,
    mentalStatus TEXT,
    temperature REAL,
    pulse INTEGER,
    bp TEXT,
    respiratoryRate INTEGER,
    examinationSummary TEXT,
    treatmentEffectiveness TEXT,
    planNote TEXT,
    version INTEGER,
    updatedAt TEXT,
    isDeleted INTEGER,
    createdAt TEXT,
    FOREIGN KEY (hospitalizationId) REFERENCES hospitalizations(id),
    FOREIGN KEY (doctorId) REFERENCES users(id)
  );
`);


  console.log('DB initialized');
};