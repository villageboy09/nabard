import { useState } from 'react';
import { authApi } from '../services/api';
import { AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (token: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('authToken', data.token);
      onLogin(data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🌾 Agricultural Risk Mitigation
          </h1>
          <p className="text-gray-600">Track 2 - Early Warning System</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="farmer1@demo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="demo123"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              onClick={() => quickLogin('farmer1@demo.com')}
              className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
            >
              👨‍🌾 Farmer 1 (Cotton & Soybean)
            </button>
            <button
              type="button"
              onClick={() => quickLogin('farmer2@demo.com')}
              className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
            >
              👩‍🌾 Farmer 2 (Rice)
            </button>
            <button
              type="button"
              onClick={() => quickLogin('lender@demo.com')}
              className="w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors"
            >
              🏦 Lender (Portfolio View)
            </button>
          </div>

          <p className="mt-4 text-xs text-center text-gray-500">
            Password for all demo accounts: <span className="font-mono font-semibold">demo123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
