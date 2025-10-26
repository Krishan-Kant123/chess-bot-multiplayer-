import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, User, Mail, Lock } from 'lucide-react';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await register(username, email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/10 backdrop-blur-lg rounded-xl shadow-lg p-8 border border-white/20">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="bg-green-500/20 p-3 rounded-full border border-green-500/50">
            <UserPlus className="w-8 h-8 text-green-300" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white">Create Account</h2>
        <p className="text-green-200 mt-2">Join the chess community today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          {/* <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label> */}
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-300"
              placeholder="Choose a username"
              required
              minLength={3}
              maxLength={20}
            />
          </div>
        </div>

        <div>
          {/* <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label> */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
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
          {/* <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label> */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-300"
              placeholder="Create a password"
              required
              minLength={6}
            />
          </div>
        </div>

        <div>
          {/* <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label> */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-blue-300"
              placeholder="Confirm your password"
              required
              minLength={6}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus className="w-5 h-5 mr-2" />
              Create Account
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-gray-600">
          Already have an account?{' '}
          <button
            onClick={onToggleMode}
            className="text-green-600 hover:text-green-700 font-medium"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};