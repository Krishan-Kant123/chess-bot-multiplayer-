import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './components/home/HomePage';
import { GameRoom } from './components/game/GameRoom';
// console.log(import.meta.env.VITE_BACKEND_URI)

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
 <div 
  className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-black"
>
  <div style={{ position: 'relative', width: '6rem', height: '6rem', marginBottom: '1.5rem' }}>
    {/* Knight rotating clockwise */}
    <div 
      style={{
        position: 'absolute',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '2rem',
        color: 'white',
        animation: 'spinClockwise 6s linear infinite'
      }}
    >
      ♞
    </div>

    {/* Rook rotating counter-clockwise */}
    <div 
      style={{
        position: 'absolute',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '2rem',
        color: 'white',
        animation: 'spinCounter 6s linear infinite'
      }}
    >
      ♜
    </div>

    {/* Inline animation keyframes */}
    <style>
      {`
        @keyframes spinClockwise {
          0% { transform: translateX(-50%) rotate(0deg); }
          100% { transform: translateX(-50%) rotate(360deg); }
        }
        @keyframes spinCounter {
          0% { transform: translateX(-50%) rotate(360deg); }
          100% { transform: translateX(-50%) rotate(0deg); }
        }
      `}
    </style>
  </div>

  <p style={{ color: '#E0E0E0', fontFamily: 'monospace', fontSize: '1.25rem', letterSpacing: '2px' }}>
    Calculating your next move...
  </p>
  <p style={{ color: '#888', marginTop: '0.5rem', animation: 'pulse 1.5s ease-in-out infinite' }}>
    The board is watching...
  </p>

  <style>
    {`
      @keyframes pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
      }
    `}
  </style>
</div>


    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/" replace /> : <AuthPage />} 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/game/:roomId" 
          element={
            <ProtectedRoute>
              <GameRoom />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;