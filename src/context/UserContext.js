import React, { createContext, useState, useContext } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState({
//     role: 'nurse', // По умолчанию медсестра для тестирования
//     name: 'Петрова Анна Сергеевна',
//     login: 'nurse1'
//   });
    const [user, setUser] = useState();

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null); // Устанавливаем в null при выходе
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};