import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { PlayMenu } from './PlayMenu';
import { UserProfile } from './UserProfile';
import { MatchHistory } from './MatchHistory';
import { Play, User, History, LogOut, Trophy } from 'lucide-react';

type ActiveTab = 'play' | 'profile' | 'history';

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('play');
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const tabs = [
    { id: 'play' as ActiveTab, label: 'Play', icon: Play },
    { id: 'profile' as ActiveTab, label: 'Profile', icon: User },
    { id: 'history' as ActiveTab, label: 'History', icon: History },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'play':
        return <PlayMenu />;
      case 'profile':
        return <UserProfile />;
      case 'history':
        return <MatchHistory />;
      default:
        return <PlayMenu />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-lg shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-purple-600 p-2 rounded-lg mr-3">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ChessMaster</h1>
                <p className="text-xs text-purple-300">
                  {connected ? '🟢 Connected' : '🔴 Disconnected'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.username}</p>
                <p className="text-xs text-purple-300">Rating: {user?.rating}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition duration-200"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition duration-200 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-300'
                      : 'border-transparent text-purple-200 hover:text-white hover:border-purple-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};