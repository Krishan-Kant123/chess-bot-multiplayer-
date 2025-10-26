import React from 'react';
import { Clock, Users, Trophy, Target, Bot } from 'lucide-react';

interface GameInfoProps {
  room: {
    roomId: string;
    gameStatus: string;
    currentTurn: 'white' | 'black';
    timeControl: number;
    matchType: 'casual' | 'rated' | 'ai';
    gameData: {
      pgn: string;
      moves: any[];
    };
    result?: {
      winner: 'white' | 'black' | 'draw' | null;
      reason: string;
    };
    aiLevel?: number;
  };
}

export const GameInfo: React.FC<GameInfoProps> = ({ room }) => {
  const formatTimeControl = (seconds: number): string => {
    if (seconds === -1) return 'Unlimited';
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'waiting': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-green-600 bg-green-100';
      case 'finished': return 'text-blue-600 bg-blue-100';
      case 'paused': return 'text-orange-600 bg-orange-100';
      case 'abandoned': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getMatchTypeIcon = (type: string) => {
    switch (type) {
      case 'rated': return <Trophy className="w-4 h-4" />;
      case 'casual': return <Target className="w-4 h-4" />;
      case 'ai': return <Bot className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const parsePGN = (pgn: string): string[] => {
    if (!pgn.trim()) return [];
    
    // Remove headers and metadata
    const moves = pgn.replace(/\[.*?\]/g, '').trim();
    
    // Split by move numbers and clean up
    return moves.split(/\d+\./)
      .filter(move => move.trim())
      .flatMap(move => move.trim().split(/\s+/))
      .filter(move => move && !move.includes('*') && !move.includes('1-0') && !move.includes('0-1') && !move.includes('1/2-1/2'));
  };

  const moves = parsePGN(room.gameData.pgn);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Game Information</h2>
      
      <div className="space-y-4">
        {/* Game Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Status:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(room.gameStatus)}`}>
            {room.gameStatus.replace('_', ' ')}
          </span>
        </div>

        {/* Match Type */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Type:</span>
          <div className="flex items-center">
            {getMatchTypeIcon(room.matchType)}
            <span className="ml-2 font-medium capitalize">
              {room.matchType}
              {room.matchType === 'ai' && room.aiLevel && ` (Level ${room.aiLevel})`}
            </span>
          </div>
        </div>

        {/* Time Control */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Time Control:</span>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span className="font-medium">{formatTimeControl(room.timeControl)}</span>
          </div>
        </div>

        {/* Current Turn */}
        {room.gameStatus === 'in_progress' && (
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Turn:</span>
            <span className={`font-medium ${room.currentTurn === 'white' ? 'text-gray-800' : 'text-gray-900'}`}>
              {room.currentTurn === 'white' ? '⚪ White' : '⚫ Black'}
            </span>
          </div>
        )}

        {/* Game Result */}
        {room.result && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Game Result</h3>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Winner:</strong>{' '}
                {room.result.winner === 'draw' 
                  ? 'Draw' 
                  : room.result.winner === 'white' ? '⚪ White' : '⚫ Black'
                }
              </p>
              <p>
                <strong>Reason:</strong> {room.result?.reason?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}

        {/* Room ID */}
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-xs text-gray-500">Room ID:</span>
          <p className="font-mono text-sm text-gray-700 break-all">{room.roomId}</p>
        </div>
      </div>

      {/* Move History */}
      {moves.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Move History</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm font-mono">
              {moves.map((move, index) => (
                <div key={index} className={`${index % 2 === 0 ? 'text-left' : 'text-right'}`}>
                  {index % 2 === 0 && (
                    <span className="text-gray-500 mr-2">{Math.floor(index / 2) + 1}.</span>
                  )}
                  <span className="text-gray-800">{move}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};