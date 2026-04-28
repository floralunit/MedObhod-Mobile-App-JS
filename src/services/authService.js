import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.137.1:5162/api/auth';

export const loginRequest = async (login, password) => {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      login,
      password,
      deviceId: 'mobile',
      deviceName: 'RN App'
    })
  });

  if (!res.ok) {
    throw new Error('Login failed');
  }

  const json = await res.json();
  return json.data;
};

export const saveSession = async (session) => {
  await AsyncStorage.setItem('session', JSON.stringify(session));
};

export const getSession = async () => {
  const s = await AsyncStorage.getItem('session');
  return s ? JSON.parse(s) : null;
};

export const clearSession = async () => {
  await AsyncStorage.removeItem('session');
};