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
  
  console.log('DB initialized');
};