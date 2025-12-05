import React from 'react';
import { AuthProvider, useAuth } from './services/auth';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import './styles/index.css';

const AppContent: React.FC = () => {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login onSuccess={() => {}} />;
  }

  return <Dashboard onLogout={logout} />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};
