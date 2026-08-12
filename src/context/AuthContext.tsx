import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { createContext, ReactNode, useEffect, useRef, useState } from 'react';
import apiClient from '../api/client';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface User {
  id: number;
  name: string;
  email: string;
  role?: 'admin' | 'lawyer';
}

interface AuthContextData {
  user: User | null;
  setUser: (user: User | null) => void;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({
  user: null,
  setUser: () => {},
  token: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

// Decode JWT payload to check expiry
const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<{exp?: number}>(token);
    if (!decoded.exp) return false;
    // exp is in seconds, Date.now() is in milliseconds
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true; // If we can't decode it, treat as expired
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const logoutRef = useRef<(() => Promise<void>) | null>(null);

  const logout = async () => {
    setToken(null);
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem('@auth_token');
    await AsyncStorage.removeItem('@auth_user');
  };

  // Keep logoutRef current so the interceptor always calls the latest logout
  logoutRef.current = logout;

  useEffect(() => {
    loadStorageData();

    // Response interceptor: auto-logout on 401 (invalid/expired token)
    const interceptorId = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          console.warn('Received 401 — token invalid/expired. Logging out.');
          await logoutRef.current?.();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(interceptorId);
    };
  }, []);

  const loadStorageData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('@auth_token');
      const storedUser = await AsyncStorage.getItem('@auth_user');

      if (storedToken && storedUser) {
        // Check if token is still valid before restoring session
        if (isTokenExpired(storedToken)) {
          console.warn('Stored token is expired. Clearing auth data.');
          await AsyncStorage.removeItem('@auth_token');
          await AsyncStorage.removeItem('@auth_user');
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      }
    } catch (e) {
      console.error('Failed to load auth data', e);
    } finally {
      setLoading(false);
    }
  };

  // Push Notifications
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    if (user && token && expoPushToken) {
      // Send the token to the backend
      apiClient.post('/profile/push-token', { token: expoPushToken })
        .catch(err => console.log('Failed to register push token:', err));
    }
  }, [user, token, expoPushToken]);

  const login = async (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    await AsyncStorage.setItem('@auth_token', newToken);
    await AsyncStorage.setItem('@auth_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

