import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, Target, TrendingUp, Calendar, Medal, Star } from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const winRate = user.gamesPlayed > 0 ? ((user.wins / user.gamesPlayed) * 100).toFixed(1) : '0.0';
  
  const getRatingColor = (rating: number): string => {
    if (rating >= 2000) return 'text-purple-600';
    if (rating >= 1800) return 'text-blue-600';
    if (rating >= 1600) return 'text-green-600';
    if (rating >= 1400) return 'text-yellow-600';
    if (rating >= 1200) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getRatingTitle = (rating: number): string => {
    if (rating >= 2400) return 'International Master';
    if (rating >= 2200) return 'Candidate Master';
    if (rating >= 2000) return 'Expert';
    if (rating >= 1800) return 'Class A';
    if (rating >= 1600) return 'Class B';
    if (rating >= 1400) return 'Class C';
    if (rating >= 1200) return 'Class D';
    return 'Beginner';
  };

  const stats = [
    {
      label: 'Games Played',
      value: user.gamesPlayed,
      icon: Target,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      label: 'Wins',
      value: user.wins,
      icon: Trophy,
      color: 'text-green-600 bg-green-100'
    },
    {
      label: 'Draws',
      value: user.draws,
      icon: Medal,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      label: 'Losses',
      value: user.losses,
      icon: Target,
      color: 'text-red-600 bg-red-100'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="bg-white bg-opacity-20 p-4 rounded-full">
              <Star className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">{user.username}</h1>
              <p className="text-blue-100 text-lg">{user.email}</p>
              <div className="mt-2 flex items-center space-x-4">
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                  <span className="text-sm font-medium">{getRatingTitle(user.rating)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="p-6">
          {/* Rating Display */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center space-x-2 bg-gray-50 px-6 py-4 rounded-xl">
              <Trophy className={`w-8 h-8 ${getRatingColor(user.rating)}`} />
              <div>
                <p className="text-sm text-gray-600">Current Rating</p>
                <p className={`text-3xl font-bold ${getRatingColor(user.rating)}`}>
                  {user.rating}
                </p>
              </div>
            </div>
          </div>

          {/* Game Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-gray-50 rounded-xl p-6 text-center">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.color} mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Win Rate */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Win Rate</h3>
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex items-center">
                <div className="text-3xl font-bold text-green-600">{winRate}%</div>
                <div className="ml-4 flex-1">
                  <div className="bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 rounded-full h-2 transition-all duration-300"
                      style={{ width: `${Math.min(parseFloat(winRate), 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-green-700 text-sm mt-2">
                {user.wins} wins out of {user.gamesPlayed} games
              </p>
            </div>

            {/* Account Info */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Account</h3>
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-blue-700">Status</p>
                  <p className="font-semibold text-blue-900">Active Player</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Experience Level</p>
                  <p className="font-semibold text-blue-900">
                    {user.gamesPlayed < 10 ? 'Newcomer' : 
                     user.gamesPlayed < 50 ? 'Regular' : 
                     user.gamesPlayed < 200 ? 'Experienced' : 'Veteran'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Achievement Badge (if applicable) */}
          {user.gamesPlayed >= 10 && (
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center">
                <div className="bg-yellow-500 p-2 rounded-full mr-4">
                  <Medal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Achievement Unlocked!</h4>
                  <p className="text-gray-600 text-sm">
                    Played {user.gamesPlayed}+ games - You're becoming a chess enthusiast!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};