/**
 * Главная Dashboard страница
 */

import { useEffect, useState } from 'react';
import { GoldenKeyInput } from './Settings/GoldenKeyInput';
import { StatsContainer } from './Stats/StatsContainer';
import { RevenueChart } from './Stats/RevenueChart';
import { OrdersTable } from './Orders/OrdersTable';
import { useOrders, useStats } from '../hooks';
import styles from './Dashboard.module.css';

export const Dashboard = () => {
    const { refetch: refetchOrders } = useOrders();
    const { refetch: refetchStats } = useStats();
    const [syncCount, setSyncCount] = useState(0);

    const handleSync = () => {
        // Рефреш всех данных после синхронизации
        refetchOrders();
        refetchStats();
        setSyncCount((prev) => prev + 1);
    };

    return (
        <main className={styles.main}>
            <div className={styles.container}>
                <h1>FunPay-PRO</h1>

                <GoldenKeyInput onSync={handleSync} />

                <StatsContainer />

                <RevenueChart />

                <OrdersTable />
            </div>
        </main>
    );
};
