import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { toastService } from '../../services/toastService';
import Spinner from '../common/Spinner';

const Login: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastService.error('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      if (isLoginView) {
        await login(email, password);
        toastService.success('Login successful!');
      } else {
        await signup(email, password);
        toastService.success('Account created successfully!');
      }
    } catch (error) {
      if (error instanceof Error) {
        toastService.error(error.message);
      } else {
        toastService.error('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 gradient-bg">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-700 relative z-10">
        <div className="text-center">
          <img src="https://ponsrischool.in/wp-content/uploads/2025/10/Screenshot-2025-10-17-221109-e1760719346143_imgupscaler.ai_v1Fast_2K-1.png" alt="Logo" className="w-24 h-24 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-white tracking-tight">Gemini Genesis V8</h1>
          <p className="mt-2 text-gray-400">{isLoginView ? 'Sign in to continue' : 'Create an account'}</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border-0 bg-white/5 placeholder-gray-400 text-white rounded-t-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border-0 bg-white/5 placeholder-gray-400 text-white rounded-b-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500 disabled:opacity-50"
            >
              {loading ? <Spinner /> : (isLoginView ? 'Sign In' : 'Sign Up')}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <button onClick={() => setIsLoginView(!isLoginView)} className="font-medium text-purple-400 hover:text-purple-300">
            {isLoginView ? 'Don\'t have an account? Sign Up' : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;