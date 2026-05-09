import AsyncStorage from '@react-native-async-storage/async-storage';

//const API_BASE_URL = 'http://10.0.2.2:5162/api'; // Для Android эмулятора
// const API_BASE_URL = 'http://localhost:5162/api'; // Для iOS
const API_BASE_URL = 'http://192.168.137.1:5162/api'; // Для реального устройства

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async _getAccessToken() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        console.log('? Token found, length:', token.length);
      } else {
        console.warn('?? No access token found');
      }
      return token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  async _refreshToken() {
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      const response = await fetch(`${this.baseURL}/Auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        await AsyncStorage.setItem('accessToken', data.data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
        return data.data.accessToken;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return null;
    }
  }

  async request(method, endpoint, data = null, requiresAuth = true) {
  const url = `${this.baseURL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    let token = await this._getAccessToken();
    if (!token) {
      token = await this._refreshToken();
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const config = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    const text = await response.text();
    
    console.log(`?? ${method} ${endpoint} -> Status: ${response.status}`);
    
    // Если ответ пустой
    if (!text || text.trim() === '') {
      // Для успешных ответов без тела (204 No Content)
      if (response.status === 204 || response.status === 200) {
        return { success: true, statusCode: response.status };
      }
      console.warn(`Empty response from ${endpoint}`);
      return { success: false, message: 'Empty response from server', statusCode: response.status };
    }
    
    const result = JSON.parse(text);

    if (response.status === 401 && requiresAuth) {
      const newToken = await this._refreshToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryResponse = await fetch(url, config);
        const retryText = await retryResponse.text();
        return retryText ? JSON.parse(retryText) : { success: false };
      }
    }

    return result;
  } catch (error) {
    console.error(`API ${method} ${endpoint} error:`, error);
    throw error;
  }
}

  get(endpoint, requiresAuth = true) {
    return this.request('GET', endpoint, null, requiresAuth);
  }

  post(endpoint, data, requiresAuth = true) {
    return this.request('POST', endpoint, data, requiresAuth);
  }

  put(endpoint, data, requiresAuth = true) {
    return this.request('PUT', endpoint, data, requiresAuth);
  }

  delete(endpoint, requiresAuth = true) {
    return this.request('DELETE', endpoint, null, requiresAuth);
  }
}

export const apiClient = new ApiClient();