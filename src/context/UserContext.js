import React, { createContext, useState, useContext, useEffect } from 'react';
import { getSession, saveSession, clearSession } from '../services/authService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restore();
  }, []);

  const restore = async () => {
    const session = await getSession();

    if (session) {
      setUser(session.user);
    }

    setLoading(false);
  };

  const login = async (sessionData) => {
    await saveSession(sessionData);
    setUser(sessionData.user);
  };

  const logout = async () => {
    await clearSession();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);