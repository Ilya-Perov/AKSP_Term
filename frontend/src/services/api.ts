import { User, TokenResponse, Family, Task, FamilyDetail } from '../types';
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig, AxiosRequestHeaders } from "axios";

const API_URL = process.env.REACT_APP_API_URL || 'http://213.171.30.203:8000';

const getToken = (): string => {
  return localStorage.getItem("token") ?? "";
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken(); // Получаем актуальный токен каждый раз
  if (token) {
    if (!config.headers) {
      config.headers = {} as AxiosRequestHeaders;
    }
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

/* --- AUTH --- */

export const authService = {
  register: async (username: string, email: string, password: string): Promise<TokenResponse> => {
    const response = await api.post('/api/auth/register', { username, email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  login: async (email: string, password: string): Promise<TokenResponse> => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

/* --- FAMILY --- */

export const familyService = {
  createFamily: async (name: string): Promise<Family> => {
    const response = await api.post('/api/families', { name });
    return response.data;
  },

  listFamilies: async (): Promise<Family[]> => {
    const response = await api.get('/api/families');
    return response.data;
  },

  getFamily: async (familyId: number): Promise<FamilyDetail> => {
    const response = await api.get(`/api/families/${familyId}`);
    return response.data;
  },

  addMemberByName: async (familyId: number, username: string): Promise<any> => {
    const response = await api.post(`/api/families/${familyId}/members`, { username });
    return response.data;
  },
};

/* --- TASKS --- */

export const taskService = {
  createTask: async (
    familyId: number,
    title: string,
    description?: string,
    dueDate?: string,
    assignedTo?: number
  ): Promise<Task> => {
    const response = await api.post('/api/tasks', {
      family_id: familyId,
      title,
      description,
      due_date: dueDate,
      assigned_to: assignedTo,
    });
    return response.data;
  },

  listTasks: async (familyId: number): Promise<Task[]> => {
    const response = await api.get(`/api/tasks/family/${familyId}`);
    return response.data;
  },

  getTask: async (taskId: number): Promise<Task> => {
    const response = await api.get(`/api/tasks/${taskId}`);
    return response.data;
  },

  updateTask: async (taskId: number, updates: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/api/tasks/${taskId}`, updates);
    return response.data;
  },

  deleteTask: async (taskId: number): Promise<any> => {
    const response = await api.delete(`/api/tasks/${taskId}`);
    return response.data;
  },
};
