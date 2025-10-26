import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Mail, Lock } from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
  onGuestMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, onGuestMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-8 border border-white/20">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-blue-500/20 p-3 rounded-full border border-blue-500/50">
            <LogIn className="w-8 h-8 text-blue-300" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
        <p className="text-blue-200 mt-2">Sign in to your chess account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-blue-200 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-300"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-blue-200 mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-300"
              placeholder="Enter your password"
              required
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
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-blue-200 mb-4">
          Don't have an account?{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-300 hover:text-blue-200 font-medium"
          >
            Sign up
          </button>
        </p>
        <div className="border-t border-white/20 pt-4">
          <button
            onClick={() => {
    window.location.href = 'https://chess-multiplayer-cheesy.vercel.app/';
  }}
            className="text-purple-300 hover:text-purple-200 font-medium"
          >
            Play as Guest with Friend (Casual games only)
          </button>
        </div>
      </div>
    </div>
  );
};