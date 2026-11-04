/**
 * Компонент спинера загрузки
 */

import styles from './LoadingSpinner.module.css';

export const LoadingSpinner = ({ message = 'Загрузка...' }) => {
    return (
        <div className={styles.container}>
            <div className={styles.spinner}></div>
            {message && <p className={styles.message}>{message}</p>}
        </div>
    );
};
