/**
 * Контейнер со статистикой
 */

import { useStats } from '../../hooks';
import { StatCard } from './StatCard';
import styles from './StatsContainer.module.css';

export const StatsContainer = () => {
    const { stats } = useStats();

    return (
        <div className={styles.container}>
            <StatCard
                title="Общая выручка"
                value={`${stats.total_revenue?.toFixed(2) || 0} ₽`}
                color="green"
            />
            <StatCard
                title="Всего заказов"
                value={stats.total_orders || 0}
                color="blue"
            />
            <StatCard
                title="Средний чек"
                value={`${stats.avg_order_value?.toFixed(2) || 0} ₽`}
                color="yellow"
            />
        </div>
    );
};
