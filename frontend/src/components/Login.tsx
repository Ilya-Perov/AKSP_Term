import React, { useState } from 'react';
import { useAuth } from '../services/auth';

interface LoginProps {
  onSuccess?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(email, password);
      }
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось войти');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Все дома</h1>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div style={styles.formGroup}>
              <label>Имя пользователя</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите имя пользователя"
                required
              />
            </div>
          )}

          <div style={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите email"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.button} disabled={isLoading}>
            {isLoading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>

          <button
            type="button"
            style={styles.toggleButton}
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Уже есть аккаунт? Войти' : "Еще нет аккаунта? Зарегистрироваться"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
  } as React.CSSProperties,
  card: {
    background: 'white',
    padding: '3rem',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
  } as React.CSSProperties,
  title: {
    textAlign: 'center',
    marginBottom: '2rem',
    color: '#2563eb',
    fontSize: '2rem',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  error: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.875rem',
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '0.75rem',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    marginBottom: '1rem',
  } as React.CSSProperties,
  toggleButton: {
    width: '100%',
    padding: '0.75rem',
    background: 'transparent',
    color: '#2563eb',
    border: '1px solid #2563eb',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: '500',
  } as React.CSSProperties,
};
