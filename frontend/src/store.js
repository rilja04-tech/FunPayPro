/**
 * Глобальное состояние приложения с Zustand
 * Вместо Context или Redux
 */

import { create } from 'zustand';

// ============ AUTH STORE ============

export const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('access_token') || null,
    isLoading: false,
    error: null,

    // Установить пользователя после входа/регистрации
    setUser: (user, token) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('access_token', token);
        set({ user, token, error: null });
    },

    // Очистить при выходе
    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        set({ user: null, token: null });
    },

    // Установить ошибку
    setError: (error) => set({ error }),

    // Установить loading state
    setLoading: (isLoading) => set({ isLoading }),

    // Проверить что пользователь авторизован
    isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!state.token && !!state.user;
    },
}));

// ============ ORDERS STORE ============

export const useOrdersStore = create((set) => ({
    orders: [],
    total: 0,
    skip: 0,
    limit: 100,
    isLoading: false,
    error: null,

    // Установить заказы
    setOrders: (orders, total) => {
        set({ orders, total, error: null });
    },

    // Установить параметры пагинации
    setPagination: (skip, limit) => {
        set({ skip, limit });
    },

    // Установить loading state
    setLoading: (isLoading) => {
        set({ isLoading });
    },

    // Установить ошибку
    setError: (error) => {
        set({ error });
    },

    // Очистить
    clear: () => {
        set({
            orders: [],
            total: 0,
            skip: 0,
            limit: 100,
            error: null,
        });
    },
}));

// ============ STATS STORE ============

export const useStatsStore = create((set) => ({
    stats: {
        total_revenue: 0,
        total_orders: 0,
        avg_order_value: 0,
        last_sync: null,
    },
    isLoading: false,
    error: null,

    // Установить статистику
    setStats: (stats) => {
        set({ stats, error: null });
    },

    // Установить loading state
    setLoading: (isLoading) => {
        set({ isLoading });
    },

    // Установить ошибку
    setError: (error) => {
        set({ error });
    },
}));

// ============ SYNC STORE ============

export const useSyncStore = create((set) => ({
    isSyncing: false,
    syncError: null,
    lastSyncTime: null,
    syncResult: null,

    // Начать синхронизацию
    startSync: () => {
        set({ isSyncing: true, syncError: null });
    },

    // Завершить синхронизацию
    finishSync: (result) => {
        set({
            isSyncing: false,
            syncResult: result,
            lastSyncTime: new Date(),
        });
    },

    // Ошибка при синхронизации
    setSyncError: (error) => {
        set({ syncError: error, isSyncing: false });
    },

    // Очистить
    clear: () => {
        set({
            isSyncing: false,
            syncError: null,
            syncResult: null,
        });
    },
}));
