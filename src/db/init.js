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
  
  // Индекс для быстрого поиска
  db.execute(`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);`);
  db.execute(`CREATE INDEX IF NOT EXISTS idx_users_isDeleted ON users(isDeleted);`);
  
  console.log('DB initialized');
};