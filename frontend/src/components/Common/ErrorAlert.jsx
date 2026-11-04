/**
 * Компонент для отображения ошибок
 */

import styles from './ErrorAlert.module.css';

export const ErrorAlert = ({ message, onDismiss }) => {
    if (!message) return null;

    return (
        <div className={styles.alert}>
            <span>⚠️ {message}</span>
            {onDismiss && (
                <button onClick={onDismiss} className={styles.closeBtn}>
                    ✕
                </button>
            )}
        </div>
    );
};
