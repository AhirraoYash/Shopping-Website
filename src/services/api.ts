import axios from 'axios';
import { Category, Product, Config } from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  // Public
  getCategories: async () => (await api.get<Category[]>('/categories')).data,
  getProducts: async () => (await api.get<Product[]>('/products')).data,
  getConfig: async () => (await api.get<Config>('/config')).data,
  
  // Auth
  login: async (username: string, password: string) => {
    const res = await api.post<{ token: string }>('/login', { username, password });
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
    }
  },
  logout: () => {
    localStorage.removeItem('token');
  },

  // Admin
  createCategory: async (data: Omit<Category, 'id'>) => (await api.post<Category>('/categories', data)).data,
  updateCategory: async (id: string, data: Partial<Category>) => (await api.put<Category>(`/categories/${id}`, data)).data,
  deleteCategory: async (id: string) => (await api.delete(`/categories/${id}`)).data,

  createProduct: async (data: Omit<Product, 'id'>) => (await api.post<Product>('/products', data)).data,
  updateProduct: async (id: string, data: Partial<Product>) => (await api.put<Product>(`/products/${id}`, data)).data,
  deleteProduct: async (id: string) => (await api.delete(`/products/${id}`)).data,
  
  updateConfig: async (config: Config) => (await api.put('/config', config)).data,
};
