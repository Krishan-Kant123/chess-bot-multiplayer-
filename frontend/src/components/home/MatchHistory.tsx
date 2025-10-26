import React, { useState, useEffect } from 'react';
import { Trophy, Target, Clock, Calendar, ChevronLeft, ChevronRight, Filter, Crown, Zap, Timer } from 'lucide-react';
// import dotenv from 'dotenv';

// dotenv.config();

interface Match {
  _id: string;
  opponentId?: {
    username: string;
    rating: number;
  };
  result: 'win' | 'loss' | 'draw';
  userColor: 'white' | 'black';
  matchType: 'casual' | 'rated' | 'ai';
  timeControl: number;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
  gameData: {
    moveCount: number;
    gameDuration: number;
  };
  endReason: string;
  createdAt: string;
}

interface MatchHistoryResponse {
  matches: Match[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const MatchHistory: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'rated' | 'casual' | 'ai'>('all');

  useEffect(() => {
    fetchMatches(1);
  }, [filter]);

  const fetchMatches = async (page: number = 1) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URI}/api/rooms/history/matches?page=${page}&limit=10${filter !== 'all' ? `&type=${filter}` : ''}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data: MatchHistoryResponse = await response.json();
        setMatches(data.matches);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch match history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeControl = (seconds: number): string => {
    if (seconds === -1) return '∞';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getResultColor = (result: string): string => {
    switch (result) {
      case 'win': return 'text-green-600';
      case 'loss': return 'text-red-600';
      case 'draw': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getResultBg = (result: string): string => {
    switch (result) {
      case 'win': return 'bg-green-50 border-green-200';
      case 'loss': return 'bg-red-50 border-red-200';
      case 'draw': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const getTimeControlIcon = (seconds: number) => {
    if (seconds === -1) return Clock;
    if (seconds <= 300) return Zap; // Blitz
    if (seconds <= 900) return Timer; // Rapid
    return Clock; // Classical
  };

  const getTimeControlType = (seconds: number): string => {
    if (seconds === -1) return 'Unlimited';
    if (seconds <= 300) return 'Blitz';
    if (seconds <= 900) return 'Rapid';
    return 'Classical';
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      fetchMatches(newPage);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-8 border border-white/20">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mr-3"></div>
            <p className="text-purple-200">Loading match history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80 backdrop-blur-lg px-6 py-4 text-white border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 mr-3" />
              <h2 className="text-xl font-bold">Match History</h2>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="bg-gradient-to-r from-indigo-600/80 to-purple-600/80 bg-black text-white border border-white/30 rounded-lg px-3 py-1 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="all">All Games</option>
                <option value="rated">Rated</option>
                <option value="casual">Casual</option>
                <option value="ai">vs AI</option>
              </select>
            </div>
          </div>
        </div>

        {/* Matches List */}
        <div className="p-6 space-y-4">
          {matches.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-16 h-16 text-purple-300 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium text-white mb-2">No matches found</h3>
              <p className="text-purple-300">Start playing to see your match history here!</p>
            </div>
          ) : (
            matches.map((match) => {
              const TimeIcon = getTimeControlIcon(match.timeControl);
              return (
                <div key={match._id} className={`bg-white/5 backdrop-blur-sm rounded-xl border transition-all duration-200 hover:bg-white/10 hover:border-white/30 ${getResultBg(match.result).replace('bg-', 'border-').replace('-50', '/20')}`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Left side - Match info */}
                      <div className="flex items-center space-x-4">
                        {/* Result indicator */}
                        <div className="flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            match.result === 'win' ? 'bg-green-500/20 border-2 border-green-500' :
                            match.result === 'loss' ? 'bg-red-500/20 border-2 border-red-500' :
                            'bg-yellow-500/20 border-2 border-yellow-500'
                          }`}>
                            {match.result === 'win' ? (
                              <Crown className="w-6 h-6 text-green-400" />
                            ) : match.result === 'loss' ? (
                              <Target className="w-6 h-6 text-red-400" />
                            ) : (
                              <Target className="w-6 h-6 text-yellow-400" />
                            )}
                          </div>
                          <span className={`text-xs font-bold mt-1 uppercase ${getResultColor(match.result)}`}>
                            {match.result}
                          </span>
                        </div>

                        {/* Match details */}
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {match.matchType === 'ai' 
                                ? 'vs AI Bot' 
                                : `vs ${match.opponentId?.username || 'Unknown'}`
                              }
                            </h3>
                            {match.opponentId?.rating && (
                              <span className="text-sm text-purple-300 bg-purple-500/20 px-2 py-1 rounded-full">
                                {match.opponentId.rating}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-purple-200">
                            {/* Color played */}
                            <div className="flex items-center space-x-1">
                              <span>{match.userColor === 'white' ? '⚪' : '⚫'}</span>
                              <span className="capitalize">{match.userColor}</span>
                            </div>
                            
                            {/* Time control */}
                            <div className="flex items-center space-x-1">
                              <TimeIcon className="w-4 h-4" />
                              <span>{formatTimeControl(match.timeControl)}</span>
                              <span className="text-xs opacity-75">({getTimeControlType(match.timeControl)})</span>
                            </div>
                            
                            {/* Match type */}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              match.matchType === 'rated' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                              match.matchType === 'ai' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              'bg-green-500/20 text-green-300 border border-green-500/30'
                            }`}>
                              {match.matchType.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right side - Stats and date */}
                      <div className="flex items-center space-x-6">
                        {/* Game stats */}
                        <div className="text-right text-sm text-purple-200">
                          <div className="flex items-center space-x-3 mb-1">
                            <span>{match.gameData.moveCount} moves</span>
                            <span>•</span>
                            <span>{formatDuration(match.gameData.gameDuration)}</span>
                          </div>
                          <div className="text-xs text-purple-300 capitalize">
                            {match.endReason.replace('_', ' ')}
                          </div>
                        </div>

                        {/* Rating change */}
                        {match.matchType === 'rated' && (
                          <div className="text-right">
                            <div className="text-sm text-purple-200 mb-1">
                              {match.ratingBefore} → {match.ratingAfter}
                            </div>
                            <div className={`text-sm font-bold ${
                              match.ratingChange > 0 ? 'text-green-400' : 
                              match.ratingChange < 0 ? 'text-red-400' : 'text-purple-300'
                            }`}>
                              {match.ratingChange > 0 ? '+' : ''}{match.ratingChange}
                            </div>
                          </div>
                        )}

                        {/* Date */}
                        <div className="text-right text-sm text-purple-300">
                          <div className="font-medium">
                            {formatDate(match.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white/5 backdrop-blur-sm px-6 py-4 border-t border-white/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-purple-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} matches
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="flex items-center px-4 py-2 text-sm font-medium text-purple-200 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = pagination.page <= 3 ? i + 1 : pagination.page - 2 + i;
                    if (pageNum > pagination.pages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          pageNum === pagination.page
                            ? 'bg-purple-600 text-white border border-purple-500'
                            : 'text-purple-200 bg-white/10 border border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="flex items-center px-4 py-2 text-sm font-medium text-purple-200 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};