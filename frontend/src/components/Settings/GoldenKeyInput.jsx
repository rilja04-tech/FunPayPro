/**
 * Компонент для ввода golden_key и синхронизации
 */

import { useState } from 'react';
import { useSync } from '../../hooks';
import { ErrorAlert } from '../Common/ErrorAlert';
import styles from './GoldenKeyInput.module.css';

export const GoldenKeyInput = ({ onSync }) => {
    const [goldenKey, setGoldenKey] = useState('');
    const [localError, setLocalError] = useState('');
    const { isSyncing, syncError, sync } = useSync();

    const handleSync = async () => {
        setLocalError('');

        if (!goldenKey.trim()) {
            setLocalError('Пожалуйста, введите golden_key');
            return;
        }

        try {
            const result = await sync(goldenKey);
            alert(`✅ Успешно! Добавлено заказов: ${result.synced_count}`);
            setGoldenKey('');
            onSync?.();
        } catch (err) {
            // Ошибка уже установлена в hook
        }
    };

    const displayError = localError || syncError;

    return (
        <div className={styles.container}>
            <h3>Настройки интеграции</h3>
            <p className={styles.description}>
                Вставь cookie <strong>golden_key</strong> из браузера
            </p>

            <div className={styles.inputGroup}>
                <input
                    type="password"
                    placeholder="Введите golden_key..."
                    value={goldenKey}
                    onChange={(e) => setGoldenKey(e.target.value)}
                    disabled={isSyncing}
                    className={styles.input}
                />
                <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={styles.button}
                >
                    {isSyncing ? 'Парсинг...' : '🔄 Синхронизировать'}
                </button>
            </div>

            {displayError && (
                <ErrorAlert
                    message={displayError}
                    onDismiss={() => {
                        setLocalError('');
                    }}
                />
            )}
        </div>
    );
};
