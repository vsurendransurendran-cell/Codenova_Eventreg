import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const AdminLoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('admin@eventflow.dev');
  const [password, setPassword] = useState('AdminPass123!');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('Please provide both administrative identifier and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid administrative credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseDemoCredentials = () => {
    setIdentifier('admin@eventflow.dev');
    setPassword('AdminPass123!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-md space-y-6 bg-white border border-slate-200 p-8 rounded-2xl shadow-xs">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded-xl mx-auto">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Administrator Sign-In
          </h2>
          <p className="text-xs text-slate-500">
            Secure management portal for EVENTFLOW operations
          </p>
        </div>

        {/* Demo Credentials Box */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Development Credentials</span>
            </span>
            <button
              type="button"
              onClick={handleUseDemoCredentials}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
            >
              Fill Defaults
            </button>
          </div>
          <div className="text-slate-600 font-mono text-[11px] space-y-0.5">
            <div>Email: <strong className="text-slate-900 font-semibold">admin@eventflow.dev</strong></div>
            <div>Password: <strong className="text-slate-900 font-semibold">AdminPass123!</strong></div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label
              htmlFor="identifier"
              className="block font-semibold text-slate-700 mb-1"
            >
              Email or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@eventflow.dev"
                required
                disabled={isSubmitting}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-semibold text-slate-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isSubmitting}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In as Administrator</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
