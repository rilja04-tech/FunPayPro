/**
 * Таблица заказов
 */

import { useOrders } from '../../hooks';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import styles from './OrdersTable.module.css';

export const OrdersTable = () => {
    const { orders, total, isLoading, skip, limit } = useOrders();

    if (isLoading && orders.length === 0) {
        return <LoadingSpinner message="Загрузка заказов..." />;
    }

    return (
        <div>
            <h3>История заказов</h3>
            <div className={styles.container}>
                {orders.length > 0 ? (
                    <>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Номер заказа</th>
                                    <th>Описание</th>
                                    <th>Покупатель</th>
                                    <th>Статус</th>
                                    <th>Сумма</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id || order.order_id}>
                                        <td>
                                            {order.date
                                                ? new Date(order.date).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td className={styles.orderId}>
                                            {order.order_id || '—'}
                                        </td>
                                        <td>{order.description || '—'}</td>
                                        <td>{order.buyer || '—'}</td>
                                        <td>
                                            <span
                                                className={`${styles.badge} ${
                                                    order.status?.toLowerCase().includes('завершен')
                                                        ? styles.badgeSuccess
                                                        : styles.badgeDefault
                                                }`}
                                            >
                                                {order.status || '—'}
                                            </span>
                                        </td>
                                        <td className={styles.amount}>
                                            {order.amount?.toFixed(2) || 0} ₽
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className={styles.pagination}>
                            <span className={styles.info}>
                                Показано: {orders.length} из {total}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className={styles.emptyState}>
                        <p>Нет заказов</p>
                        <p className={styles.hint}>
                            Нажми "Синхронизировать" чтобы загрузить данные
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
