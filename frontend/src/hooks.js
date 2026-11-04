/**
 * Пользовательские React hooks для работы с API
 */

import { useEffect, useCallback } from 'react';
import { useOrdersStore, useStatsStore, useSyncStore } from './store';
import { orderService } from './services/api';

// ============ useOrders ============

export const useOrders = (skip = 0, limit = 100) => {
    const { orders, total, isLoading, error, setOrders, setLoading, setError } = useOrdersStore();

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await orderService.getOrders(skip, limit);
            setOrders(data.orders, data.total);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to load orders';
            setError(errorMsg);
            console.error('Failed to load orders:', err);
        } finally {
            setLoading(false);
        }
    }, [skip, limit, setOrders, setLoading, setError]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return { orders, total, isLoading, error, refetch: fetchOrders };
};

// ============ useStats ============

export const useStats = () => {
    const { stats, isLoading, error, setStats, setLoading, setError } = useStatsStore();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await orderService.getStats();
            setStats(data);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to load stats';
            setError(errorMsg);
            console.error('Failed to load stats:', err);
        } finally {
            setLoading(false);
        }
    }, [setStats, setLoading, setError]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, isLoading, error, refetch: fetchStats };
};

// ============ useSync ============

export const useSync = () => {
    const { isSyncing, syncError, syncResult, startSync, finishSync, setSyncError } = useSyncStore();

    const sync = useCallback(async (goldenKey) => {
        if (!goldenKey || goldenKey.length < 10) {
            setSyncError('Golden key должен быть минимум 10 символов');
            return;
        }

        startSync();

        try {
            const data = await orderService.sync(goldenKey);
            finishSync(data);
            return data;
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Sync failed';
            setSyncError(errorMsg);
            throw err;
        }
    }, [startSync, finishSync, setSyncError]);

    return { isSyncing, syncError, syncResult, sync };
};
