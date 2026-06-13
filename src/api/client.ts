import axios from 'axios';
import { Platform } from 'react-native';

// For Android emulator, use 10.0.2.2. For iOS/Web use localhost or local IP.
const baseURL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach tokens if needed
apiClient.interceptors.request.use(
  async (config) => {
    // You can attach auth token here
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
