import { db } from './database';

export const upsertUsers = (users) => {
  users.forEach(u => {
    db.execute(
      `INSERT OR REPLACE INTO users 
      (id, login, fullName, role, version, updatedAt, isDeleted)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        u.id,
        u.login,
        u.fullName,
        u.role,
        u.version,
        u.updatedAt,
        u.isDeleted ? 1 : 0
      ]
    );
  });
};

export const getUsers = () => {
  const result = db.execute(`SELECT * FROM users WHERE isDeleted = 0`);
  return result.rows._array;
};