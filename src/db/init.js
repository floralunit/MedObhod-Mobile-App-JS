import { db } from './database';

export const initDB = () => {
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

  console.log('DB initialized');
};