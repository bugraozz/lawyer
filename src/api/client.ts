import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// Prefer an explicit env var when provided. For Android emulator use 10.0.2.2.
// For a physical device on the same network, set EXPO_PUBLIC_API_URL to your computer IP.
const baseURL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android'
  ? 'http://10.0.2.2:3000/api'
  : 'http://localhost:3000/api');

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach auth token from AsyncStorage
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
