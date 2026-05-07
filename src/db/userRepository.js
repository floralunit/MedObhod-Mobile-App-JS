import { db } from './database';

// Обновить или вставить пользователей
export const upsertUsers = (users) => {
  try {
    users.forEach(u => {
      db.execute(
        `INSERT OR REPLACE INTO users 
         (id, login, fullName, role, version, updatedAt, isDeleted)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          u.id,
          u.login || u.Login,
          u.fullName || u.FullName,
          u.role || u.Role,
          u.version || u.Version || 1,
          u.updatedDt || u.UpdatedDt || new Date().toISOString(),
          (u.isDeleted || u.IsDeleted) ? 1 : 0
        ]
      );
    });
    console.log(`Upserted ${users.length} users`);
  } catch (error) {
    console.error('Failed to upsert users:', error);
  }
};

// Получить всех пользователей
export const getUsers = () => {
  try {
    const result = db.execute(`SELECT * FROM users WHERE isDeleted = 0 ORDER BY fullName`);
    return result.rows?._array || [];
  } catch (error) {
    console.error('Failed to get users:', error);
    return [];
  }
};

// Получить пользователя по ID
export const getUserById = (userId) => {
  try {
    const result = db.execute(`SELECT * FROM users WHERE id = ? AND isDeleted = 0`, [userId]);
    const users = result.rows?._array || [];
    return users[0] || null;
  } catch (error) {
    console.error('Failed to get user by id:', error);
    return null;
  }
};

// Добавить пользователя (локально и потом синхронизировать)
export const addUser = async (userData, accessToken) => {
  try {
    // Сначала отправляем на сервер
    const response = await fetch('http://your-server:5162/api/Auth/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (data.success && data.data) {
      // Сохраняем в локальную БД
      upsertUsers([data.data]);
      return data.data;
    }
    
    throw new Error(data.message || 'Failed to create user');
  } catch (error) {
    console.error('Failed to add user:', error);
    throw error;
  }
};

// Обновить роль пользователя
export const updateUserRole = async (userId, newRole, accessToken) => {
  try {
    const response = await fetch(`http://your-server:5162/api/Auth/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(newRole)
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Обновляем локально
      db.execute(
        `UPDATE users SET role = ?, updatedAt = ? WHERE id = ?`,
        [newRole, new Date().toISOString(), userId]
      );
      return true;
    }
    
    throw new Error(data.message || 'Failed to update user role');
  } catch (error) {
    console.error('Failed to update user role:', error);
    throw error;
  }
};

// Удалить пользователя
export const deleteUser = async (userId, accessToken) => {
  try {
    const response = await fetch(`http://your-server:5162/api/Auth/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Помечаем как удалённого локально
      db.execute(
        `UPDATE users SET isDeleted = 1, updatedAt = ? WHERE id = ?`,
        [new Date().toISOString(), userId]
      );
      return true;
    }
    
    throw new Error(data.message || 'Failed to delete user');
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
};

// Получить статистику пользователей
export const getUserStats = () => {
  try {
    const doctorsResult = db.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'doctor' AND isDeleted = 0`);
    const nursesResult = db.execute(`SELECT COUNT(*) as count FROM users WHERE role = 'nurse' AND isDeleted = 0`);
    
    return {
      doctors: doctorsResult.rows?._array?.[0]?.count || 0,
      nurses: nursesResult.rows?._array?.[0]?.count || 0,
      total: getUsers().length
    };
  } catch (error) {
    console.error('Failed to get user stats:', error);
    return { doctors: 0, nurses: 0, total: 0 };
  }
};