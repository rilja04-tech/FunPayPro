/**
 * Компонент карточки статистики
 */

import styles from './StatCard.module.css';

export const StatCard = ({ title, value, icon, color = 'blue' }) => {
    return (
        <div className={`${styles.card} ${styles[color]}`}>
            <h3 className={styles.title}>
                {icon} {title}
            </h3>
            <h2 className={styles.value}>{value}</h2>
        </div>
    );
};
