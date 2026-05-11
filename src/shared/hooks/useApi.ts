import { useCallback } from 'react';
import axios, { type AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function useApi() {
  const get = useCallback((url: string) => apiClient.get(url), []);
  const post = useCallback((url: string, data?: any) => apiClient.post(url, data), []);
  const put = useCallback((url: string, data?: any) => apiClient.put(url, data), []);
  const patch = useCallback((url: string, data?: any) => apiClient.patch(url, data), []);
  const del = useCallback((url: string) => apiClient.delete(url), []);

  return { get, post, put, patch, del };
}

export default apiClient;
