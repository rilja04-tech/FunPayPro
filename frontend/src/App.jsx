import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = "http://localhost:8001/api";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' или 'register'
  const [currentUser, setCurrentUser] = useState(null);
  
  // Поля для авторизации
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  // Поля для синхронизации
  const [goldenKey, setGoldenKey] = useState('');
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total_revenue: 0, total_orders: 0, avg_order_value: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Загрузка данных
  const fetchData = async () => {
    try {
      const resStats = await axios.get(`${API_URL}/stats`);
      setStats(resStats.data);
      
      const resOrders = await axios.get(`${API_URL}/orders`);
      const sortedOrders = resOrders.data.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      });
      
      setOrders(sortedOrders);
      setError('');
    } catch (error) {
      console.error("Ошибка при загрузке данных", error);
      setError('Не удалось загрузить данные');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // Регистрация
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!username || !email || !password || !passwordConfirm) {
      setAuthError('Заполни все поля');
      return;
    }
    
    if (password !== passwordConfirm) {
      setAuthError('Пароли не совпадают');
      return;
    }
    
    if (password.length < 6) {
      setAuthError('Пароль должен быть минимум 6 символов');
      return;
    }
    
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });
      
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);
      
      // Очищаем форму
      setUsername('');
      setEmail('');
      setPassword('');
      setPasswordConfirm('');
      
      alert(`✅ ${response.data.message}`);
    } catch (error) {
      if (error.response) {
        const detail = error.response.data.detail;
        const errorMsg = Array.isArray(detail) ? detail.map(e => e.msg).join(', ') : detail || 'Ошибка';
        setAuthError(errorMsg);
      } else {
        setAuthError('Ошибка соединения с сервером');
      }
    }
    
    setAuthLoading(false);
  };

  // Логин
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      setAuthError('Введи имя пользователя и пароль');
      return;
    }
    
    setAuthLoading(true);
    setAuthError('');
    
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });
      
      setCurrentUser(response.data.user);
      setIsAuthenticated(true);
      
      // Очищаем форму
      setUsername('');
      setPassword('');
      
      alert(`✅ ${response.data.message}`);
    } catch (error) {
      if (error.response) {
        const detail = error.response.data.detail;
        const errorMsg = Array.isArray(detail) ? detail.map(e => e.msg).join(', ') : detail || 'Ошибка';
        setAuthError(errorMsg);
      } else {
        setAuthError('Ошибка соединения с сервером');
      }
    }
    
    setAuthLoading(false);
  };

  // Выход
  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setOrders([]);
    setStats({ total_revenue: 0, total_orders: 0, avg_order_value: 0 });
  };

  // Синхронизация
  const handleSync = async () => {
    if (!goldenKey) {
      alert("Введи golden_key!");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/sync`, { 
        golden_key: goldenKey
      });
      
      alert(`Успешно! Добавлено заказов: ${response.data.synced_count}`);
      fetchData();
    } catch (error) {
      console.error("Ошибка:", error);
      if (error.response) {
        alert(`Ошибка: ${error.response.data.detail || 'Неизвестная ошибка'}`);
      } else {
        alert('Ошибка соединения с сервером');
      }
    }
    
    setLoading(false);
  };

  const chartData = [...orders].reverse().map((order, index) => ({
    name: order.date ? new Date(order.date).toLocaleDateString() : `Заказ ${index + 1}`,
    Сумма: order.amount || 0
  }));

  // Если не авторизован - показываем форму входа/регистрации
  if (!isAuthenticated) {
    return (
      <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', maxWidth: '600px', margin: '50px auto' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>FunPay-PRO</h1>
        
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '12px', 
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '12px',
                background: authMode === 'login' ? '#0d6efd' : '#e9ecef',
                color: authMode === 'login' ? 'white' : '#495057',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Вход
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              style={{
                flex: 1,
                padding: '12px',
                background: authMode === 'register' ? '#0d6efd' : '#e9ecef',
                color: authMode === 'register' ? 'white' : '#495057',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Имя пользователя
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введи имя пользователя"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {authMode === 'register' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Введи email"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введи пароль"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {authMode === 'register' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Подтвердить пароль
                </label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Повтори пароль"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {authError && (
              <div style={{ 
                marginBottom: '15px', 
                padding: '12px',
                background: '#f8d7da',
                color: '#721c24',
                borderRadius: '8px',
                fontSize: '14px'
              }}>
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: '100%',
                padding: '12px',
                background: authLoading ? '#6c757d' : '#0d6efd',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: authLoading ? 'wait' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {authLoading ? 'Загрузка...' : (authMode === 'login' ? 'Войти' : 'Зарегистрироваться')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Если авторизован - показываем основное приложение
  return (
    <div style={{ padding: '30px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>FunPay-PRO</h1>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 5px 0', color: '#6c757d' }}>👤 {currentUser?.username}</p>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Выход
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '20px', padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #dee2e6' }}>
        <h3>Настройки интеграции</h3>
        <p style={{color: '#6c757d', fontSize: '14px'}}>
          Вставь cookie <strong>golden_key</strong> из браузера
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Введите golden_key..."
            value={goldenKey}
            onChange={(e) => setGoldenKey(e.target.value)}
            style={{ 
              padding: '12px', 
              width: '450px', 
              borderRadius: '8px', 
              border: '1px solid #ccc',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
          <button 
            onClick={handleSync} 
            disabled={loading} 
            style={{ 
              padding: '12px 30px', 
              background: loading ? '#6c757d' : '#0d6efd', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: loading ? 'wait' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Парсинг...' : '🔄 Синхронизировать'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: '10px', color: '#dc3545', fontSize: '14px' }}>
            ⚠️ {error}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div style={{ padding: '25px', background: '#d1e7dd', borderRadius: '12px', flex: 1, minWidth: '200px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0f5132', fontSize: '14px' }}>Общая выручка</h3>
          <h2 style={{ margin: 0, color: '#0f5132', fontSize: '32px' }}>{stats.total_revenue?.toFixed(2) || 0} ₽</h2>
        </div>
        <div style={{ padding: '25px', background: '#cfe2ff', borderRadius: '12px', flex: 1, minWidth: '200px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#084298', fontSize: '14px' }}>Всего заказов</h3>
          <h2 style={{ margin: 0, color: '#084298', fontSize: '32px' }}>{stats.total_orders || 0}</h2>
        </div>
        <div style={{ padding: '25px', background: '#fff3cd', borderRadius: '12px', flex: 1, minWidth: '200px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#997404', fontSize: '14px' }}>Средний чек</h3>
          <h2 style={{ margin: 0, color: '#997404', fontSize: '32px' }}>{stats.avg_order_value?.toFixed(2) || 0} ₽</h2>
        </div>
      </div>

      <h3>Динамика доходов</h3>
      <div style={{ height: '300px', width: '100%', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #dee2e6', marginBottom: '30px' }}>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} ₽`, 'Сумма']} />
              <Line type="monotone" dataKey="Сумма" stroke="#0d6efd" strokeWidth={3} dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6c757d' }}>
            Нет данных для графика
          </div>
        )}
      </div>

      <h3>История заказов</h3>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #dee2e6', overflow: 'auto' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8f9fa' }}>
            <tr>
              <th style={{ padding: '15px' }}>Дата</th>
              <th style={{ padding: '15px' }}>Номер заказа</th>
              <th style={{ padding: '15px' }}>Описание</th>
              <th style={{ padding: '15px' }}>Покупатель</th>
              <th style={{ padding: '15px' }}>Статус</th>
              <th style={{ padding: '15px' }}>Сумма</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order.id || order.order_id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '15px' }}>{order.date ? new Date(order.date).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '15px', fontWeight: '500' }}>{order.order_id || '—'}</td>
                  <td style={{ padding: '15px' }}>{order.description || '—'}</td>
                  <td style={{ padding: '15px' }}>{order.buyer || '—'}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ 
                      background: order.status?.toLowerCase().includes('завершен') ? '#d1e7dd' : '#e9ecef',
                      color: order.status?.toLowerCase().includes('завершен') ? '#0f5132' : '#495057',
                      padding: '5px 10px', 
                      borderRadius: '20px', 
                      fontSize: '12px'
                    }}>
                      {order.status || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#198754' }}>{order.amount?.toFixed(2) || 0} ₽</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#6c757d' }}>
                  Нет заказов. Нажми "Синхронизировать" чтобы загрузить данные.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
