/**
 * API сервис для работы с FunPay Analytics API
 * Все запросы к серверу централизованы здесь
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

// Создаем axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Добавляем токен к каждому запросу если он есть
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Обработчик ошибок
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Токен истек - очищаем и перенаправляем на логин
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        }
        return Promise.reject(error);
    }
);

// ============ AUTH SERVICES ============

export const authService = {
    /**
     * Зарегистрировать нового пользователя
     */
    register: async (username, email, password) => {
        const response = await api.post('/auth/register', {
            username,
            email,
            password,
        });
        return response.data;
    },

    /**
     * Вход пользователя
     */
    login: async (username, password) => {
        const response = await api.post('/auth/login', {
            username,
            password,
        });
        return response.data;
    },

    /**
     * Получить информацию о текущем пользователе
     */
    getMe: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    /**
     * Выход пользователя
     */
    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
    },
};

// ============ ORDER SERVICES ============

export const orderService = {
    /**
     * Получить список заказов
     */
    getOrders: async (skip = 0, limit = 100) => {
        const response = await api.get('/orders', {
            params: { skip, limit },
        });
        return response.data;
    },

    /**
     * Получить статистику
     */
    getStats: async () => {
        const response = await api.get('/stats');
        return response.data;
    },

    /**
     * Синхронизировать заказы с FunPay
     */
    sync: async (goldenKey) => {
        const response = await api.post('/sync', {
            golden_key: goldenKey,
        });
        return response.data;
    },

    /**
     * Очистить дубликаты
     */
    cleanDuplicates: async () => {
        const response = await api.delete('/orders/clean-duplicates');
        return response.data;
    },
};

export default api;
