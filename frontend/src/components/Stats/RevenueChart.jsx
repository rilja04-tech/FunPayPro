import { useState, useMemo, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useOrders } from '../../hooks';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import styles from './RevenueChart.module.css';

const MONTHS = [
    'Январь','Февраль','Март','Апрель','Май','Июнь',
    'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'
];

export const RevenueChart = () => {
    const { orders, isLoading } = useOrders();
    const [mode, setMode] = useState('month'); // 'month' | 'year'
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11

    // Собираем список доступных годов из заказов
    const availableYears = useMemo(() => {
        const years = new Set();
        orders.forEach(o => {
            if (o.date) years.add(new Date(o.date).getFullYear());
        });
        return [...years].sort((a, b) => b - a);
    }, [orders]);

    // Автоматически выбираем первый доступный год
    useEffect(() => {
        if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
            setSelectedYear(availableYears[0]);
        }
    }, [availableYears]);

    // Данные для графика по МЕСЯЦУ (каждый день)
    const monthData = useMemo(() => {
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => ({
            name: `${i + 1}`,
            Сумма: 0,
        }));

        orders.forEach(order => {
            if (!order.date || !order.amount) return;
            const d = new Date(order.date);
            if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
                const day = d.getDate() - 1;
                days[day].Сумма = +(days[day].Сумма + order.amount).toFixed(2);
            }
        });

        return days;
    }, [orders, selectedYear, selectedMonth]);

    // Данные для графика по ГОДУ (каждый месяц)
    const yearData = useMemo(() => {
        const months = MONTHS.map(name => ({ name, Сумма: 0 }));

        orders.forEach(order => {
            if (!order.date || !order.amount) return;
            const d = new Date(order.date);
            if (d.getFullYear() === selectedYear) {
                months[d.getMonth()].Сумма = +(months[d.getMonth()].Сумма + order.amount).toFixed(2);
            }
        });

        return months;
    }, [orders, selectedYear]);

    if (isLoading) return <LoadingSpinner message="Загрузка графика..." />;

    const chartData = mode === 'month' ? monthData : yearData;
    const hasData = chartData.some(d => d.Сумма > 0);
    const totalSum = chartData.reduce((s, d) => s + d.Сумма, 0).toFixed(2);

    return (
        <div className={styles.wrapper}>
            <div className={styles.header}>
                <h3>Динамика доходов</h3>

                {/* Переключатель режима */}
                <div className={styles.controls}>
                    <div className={styles.modeSwitch}>
                        <button
                            className={mode === 'month' ? styles.active : ''}
                            onClick={() => setMode('month')}
                        >
                            По месяцу
                        </button>
                        <button
                            className={mode === 'year' ? styles.active : ''}
                            onClick={() => setMode('year')}
                        >
                            По году
                        </button>
                    </div>

                    {/* Выбор года */}
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(+e.target.value)}
                        className={styles.select}
                    >
                        {availableYears.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    {/* Выбор месяца (только в режиме "По месяцу") */}
                    {mode === 'month' && (
                        <select
                            value={selectedMonth}
                            onChange={e => setSelectedMonth(+e.target.value)}
                            className={styles.select}
                        >
                            {MONTHS.map((m, i) => (
                                <option key={i} value={i}>{m}</option>
                            ))}
                        </select>
                    )}

                    {/* Итог за период */}
                    <span className={styles.total}>
                        Итого: <strong>{totalSum} ₽</strong>
                    </span>
                </div>
            </div>

            <div className={styles.container}>
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        {mode === 'month' ? (
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(v) => [`${v} ₽`, 'Сумма']} />
                                <Line
                                    type="monotone"
                                    dataKey="Сумма"
                                    stroke="#0d6efd"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        ) : (
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(v) => [`${v} ₽`, 'Сумма']} />
                                <Bar dataKey="Сумма" fill="#0d6efd" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                ) : (
                    <div className={styles.emptyState}>
                        <p>Нет данных за выбранный период</p>
                    </div>
                )}
            </div>
        </div>
    );
};