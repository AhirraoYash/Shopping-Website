import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { toast } from 'sonner';
import { Lock, ArrowLeft } from 'lucide-react';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.login(username, password);
      toast.success('Welcome back!');
      navigate('/admin');
    } catch (err) {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-shop-yellow p-4 rounded-xl shadow-sm">
            <Lock className="w-8 h-8 text-shop-gray" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-shop-gray">
          Admin Login
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Ashirvad Electrical Store Manager
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Username
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  required
                  className="block w-full rounded-xl border border-gray-300 py-3 px-4 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-colors"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900">
                Password
              </label>
              <div className="mt-2">
                <input
                  type="password"
                  required
                  className="block w-full rounded-xl border border-gray-300 py-3 px-4 text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-shop-gray py-3 px-3 text-sm font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-colors uppercase tracking-wide"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center justify-center w-full rounded-xl py-3 px-3 text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors tracking-wide gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Store
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
