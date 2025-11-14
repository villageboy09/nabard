import axios from 'axios';
import type { Field, RiskScore, Alert, WeatherData, SatelliteData, DashboardSummary, FieldWithRisk } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API Services
export const riskApi = {
  getDashboard: async (): Promise<{ summary: DashboardSummary; fields: FieldWithRisk[] }> => {
    const response = await api.get('/risks/dashboard');
    return response.data.data;
  },

  calculateFieldRisk: async (fieldId: string, forecastDate: string): Promise<{ risk: RiskScore; analysis: any }> => {
    const response = await api.get(`/risks/field/${fieldId}/calculate`, {
      params: { forecastDate },
    });
    return response.data.data;
  },

  getFieldRiskScores: async (fieldId: string, params?: any): Promise<RiskScore[]> => {
    const response = await api.get(`/risks/field/${fieldId}`, { params });
    return response.data.data;
  },
};

export const fieldApi = {
  getFields: async (): Promise<Field[]> => {
    const response = await api.get('/fields');
    return response.data.data;
  },

  getFieldDetails: async (fieldId: string): Promise<Field & {
    riskScores: RiskScore[];
    weatherData: WeatherData[];
    satelliteData: SatelliteData[];
    soilData: any[];
  }> => {
    const response = await api.get(`/fields/${fieldId}`);
    return response.data.data;
  },

  getWeatherForecast: async (fieldId: string, days?: number): Promise<{
    forecast: WeatherData[];
    extremeEvents: any[];
  }> => {
    const response = await api.get(`/fields/${fieldId}/weather`, { params: { days } });
    return response.data.data;
  },

  getSatelliteData: async (fieldId: string, days?: number): Promise<{
    satelliteData: SatelliteData[];
    trend: any;
  }> => {
    const response = await api.get(`/fields/${fieldId}/satellite`, { params: { days } });
    return response.data.data;
  },

  createField: async (data: Partial<Field>): Promise<Field> => {
    const response = await api.post('/fields', data);
    return response.data.data;
  },

  updateField: async (fieldId: string, data: Partial<Field>): Promise<Field> => {
    const response = await api.patch(`/fields/${fieldId}`, data);
    return response.data.data;
  },
};

export const alertApi = {
  getAlerts: async (params?: any): Promise<{ alerts: Alert[]; unreadCount: number }> => {
    const response = await api.get('/alerts', { params });
    return response.data.data;
  },

  markAsRead: async (alertId: string): Promise<Alert> => {
    const response = await api.patch(`/alerts/${alertId}/read`);
    return response.data.data;
  },

  getAlertStats: async (): Promise<any> => {
    const response = await api.get('/alerts/stats');
    return response.data.data;
  },
};

export default api;
