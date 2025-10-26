import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { GuestLoginForm } from '../components/auth/GuestLoginForm';

type AuthMode = 'login' | 'register' | 'guest';

export const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {authMode === 'login' && (
          <LoginForm 
            onToggleMode={() => setAuthMode('register')}
            onGuestMode={() => setAuthMode('guest')}
          />
        )}
        {authMode === 'register' && (
          <RegisterForm onToggleMode={() => setAuthMode('login')} />
        )}
        {authMode === 'guest' && (
          <GuestLoginForm onBack={() => setAuthMode('login')} />
        )}
      </div>
    </div>
  );
};