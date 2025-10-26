import React, { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { User, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GuestLoginFormProps {
  onBack: () => void;
}

export const GuestLoginForm: React.FC<GuestLoginFormProps> = ({ onBack }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { socket } = useSocket();
  const navigate=useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket) {
      console.log('Socket not connected');
      setError('Connection error. Please try again.');
      return;
    }

    setLoading(true);
    setError('');

    socket.emit('authenticate_guest', { username });

    socket.once('authenticated', () => {
      setLoading(false);
      socket.emit('join_queue', {
    matchType: 'casual',
    timeControl: 500, // 5 min or whatever default
    preferredColor: 'random'
  });

  socket.once('match_found', (data) => {
    navigate(`/game/${data.roomId}`);
  });

  socket.once('queue_left', () => {
    console.log('Left queue');
  });
    });

    socket.once('authentication_error', (data) => {
      setError(data.message);
      setLoading(false);
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-8 border border-white/20">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-purple-500/20 p-3 rounded-full border border-purple-500/50">
            <User className="w-8 h-8 text-purple-300" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white">Play as Guest</h2>
        <p className="text-purple-200 mt-2">Enter your name to start playing casual games</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-purple-200 mb-2">
            Your Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-purple-300"
              placeholder="Enter your name"
              required
              minLength={2}
              maxLength={20}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || username.trim().length < 2}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Start Playing
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-purple-200 text-sm mb-4">
          Guest players can only play casual games and won't have rating changes or match history.
        </p>
        <button
          onClick={onBack}
          className="text-purple-300 hover:text-purple-200 font-medium"
        >
          Back to login options
        </button>
      </div>
    </div>
  );
};