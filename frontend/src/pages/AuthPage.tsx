import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (isRegister && !fullName.trim()) {
      setError('Please enter your full name or research title.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/v1/auth/register' : '/api/v1/auth/login';
      const payload = isRegister ? { email, password, fullName } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Authentication failed. Please verify credentials.');
      }

      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('twin_user', JSON.stringify({
        id: 'usr-' + Math.random().toString(36).substring(2, 8),
        name: data.fullName,
        email: data.email,
        role: data.role,
        isGuest: data.isGuest
      }));

      setSuccess(true);
      setTimeout(() => {
        navigate('/fleet');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEntry = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/guest', { method: 'POST' });
      const data = await res.json().catch(() => ({
        token: 'guest-demo-token',
        email: 'guest@machina-x.demo',
        fullName: 'Academic Reviewer (Guest)',
        role: 'ROLE_GUEST',
        isGuest: true
      }));

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('twin_user', JSON.stringify({
        id: 'guest-01',
        name: data.fullName,
        email: data.email,
        role: data.role,
        isGuest: true
      }));

      navigate('/fleet');
    } catch {
      localStorage.setItem('auth_token', 'guest-fallback');
      localStorage.setItem('twin_user', JSON.stringify({
        id: 'guest-01',
        name: 'Academic Reviewer (Guest)',
        email: 'guest@machina-x.demo',
        role: 'ROLE_GUEST',
        isGuest: true
      }));
      navigate('/fleet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex flex-col justify-center items-center p-4 font-sans selection:bg-ink selection:text-bg">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div
          onClick={() => navigate('/')}
          className="w-10 h-10 border border-ink flex items-center justify-center font-serif font-bold text-lg cursor-pointer mb-3 hover:bg-panel transition-colors"
        >
          MX
        </div>
        <h1 className="text-2xl font-serif text-ink tracking-tight font-normal">MACHINA-X Digital Twin</h1>
        <p className="text-xs text-mute mt-1 font-sans">Explainable AI-Driven Industrial Maintenance Framework</p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-panel border border-rule rounded-lg max-w-md w-full p-6 sm:p-8 shadow-sm">
        <div className="flex border-b border-rule mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors relative flex-1 text-center ${
              !isRegister
                ? 'text-ink font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-ink'
                : 'text-mute hover:text-ink'
            }`}
          >
            Authenticate
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`pb-3 text-xs font-mono uppercase tracking-wider transition-colors relative flex-1 text-center ${
              isRegister
                ? 'text-ink font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-ink'
                : 'text-mute hover:text-ink'
            }`}
          >
            Register Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded border border-rose-300 bg-rose-50/80 text-rose-800 text-xs flex items-start gap-2 font-sans">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded border border-emerald-300 bg-emerald-50/80 text-emerald-800 text-xs flex items-center gap-2 font-sans">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>Authentication successful. Synchronizing state...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
                Full Name / Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Jane Smith, Reliability Engineer"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-bg border border-rule rounded text-ink placeholder:text-mute/60 focus:outline-none focus:border-ink font-sans transition-colors"
                />
                <User className="w-3.5 h-3.5 text-mute absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-mute mb-1">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@machina-x.industrial"
                className="w-full pl-9 pr-3 py-2 text-xs bg-bg border border-rule rounded text-ink placeholder:text-mute/60 focus:outline-none focus:border-ink font-sans transition-colors"
              />
              <Mail className="w-3.5 h-3.5 text-mute absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-mute">
                Password
              </label>
              {!isRegister && (
                <span className="text-[10px] text-mute hover:text-ink cursor-pointer font-sans">
                  Default: MachinaX2026!
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs bg-bg border border-rule rounded text-ink placeholder:text-mute/60 focus:outline-none focus:border-ink font-sans transition-colors"
              />
              <Lock className="w-3.5 h-3.5 text-mute absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-mute hover:text-ink"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded bg-ink text-bg text-xs font-medium hover:bg-ink/90 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{isRegister ? 'Create Investigator Account' : 'Sign In to Workbench'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-rule text-center">
          <p className="text-xs text-mute mb-3 font-sans">
            Need immediate demonstration access?
          </p>
          <button
            type="button"
            onClick={handleGuestEntry}
            disabled={loading}
            className="w-full py-2 px-3 rounded border border-rule bg-bg hover:bg-track text-ink text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-mute" />
            <span>Enter Guest Academic Review Mode</span>
          </button>
          <p className="text-[10px] text-mute mt-2 font-mono">
            Full telemetry streams, explainable SHAP charts, and what-if simulation enabled.
          </p>
        </div>
      </div>
    </div>
  );
};
