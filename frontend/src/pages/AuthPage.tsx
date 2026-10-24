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
  Building,
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
  const [organization, setOrganization] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email || !email.includes('@')) {
      setError('Please provide a valid institutional or corporate email address.');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    if (isRegister && !fullName.trim()) {
      setError('Please enter your full name or research investigator title.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      const user = {
        id: 'usr-' + Math.random().toString(36).substring(2, 8),
        name: isRegister ? fullName : email.split('@')[0],
        email: email,
        role: 'RESEARCHER',
        organization: organization || 'Industrial Laboratory'
      };
      localStorage.setItem('twin_user', JSON.stringify(user));

      setTimeout(() => {
        navigate('/fleet');
      }, 700);
    }, 600);
  };

  const handleGuestEntry = () => {
    const guestUser = {
      id: 'guest-01',
      name: 'Guest Investigator',
      email: 'guest@academic.edu',
      role: 'GUEST',
      organization: 'Public Demonstration Session'
    };
    localStorage.setItem('twin_user', JSON.stringify(guestUser));
    navigate('/fleet');
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-200 flex flex-col justify-center items-center p-4 font-sans selection:bg-brand-500 selection:text-white">
      {/* Brand Icon Header */}
      <div className="mb-6 flex flex-col items-center">
        <div
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-lg bg-brand-600/10 border border-brand-500/30 flex items-center justify-center text-brand-400 cursor-pointer mb-2"
        >
          <Activity className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">MACHINA-X Digital Twin</h1>
        <p className="text-xs text-slate-400 mt-0.5">Industrial Equipment Predictive Maintenance Workbench</p>
      </div>

      {/* Main Authentication Card */}
      <div className="bg-panel border border-panel-border rounded-xl max-w-md w-full p-6 sm:p-8 shadow-elevated">
        <div className="flex border-b border-panel-border mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
            className={`flex-1 pb-3 text-xs font-semibold text-center transition-colors relative ${
              !isRegister ? 'text-slate-100' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <span>Operator Sign In</span>
            {!isRegister && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
            className={`flex-1 pb-3 text-xs font-semibold text-center transition-colors relative ${
              isRegister ? 'text-slate-100' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <span>Register Account</span>
            {isRegister && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500" />}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Authenticated successfully. Redirecting to fleet workbench...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  className="w-full bg-surface border border-panel-border rounded-md pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investigator@institution.org"
                className="w-full bg-surface border border-panel-border rounded-md pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface border border-panel-border rounded-md pl-9 pr-10 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
                Organization / Plant Facility
              </label>
              <div className="relative">
                <Building className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="Manufacturing Line A / University Lab"
                  className="w-full bg-surface border border-panel-border rounded-md pl-9 pr-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2.5 rounded-md bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-colors shadow-subtle disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : isRegister ? 'Create Researcher Account' : 'Sign In to Platform'}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-panel-border" />
          </div>
          <span className="relative bg-panel px-3 text-[10px] uppercase font-mono text-slate-400">
            or instant evaluation
          </span>
        </div>

        {/* Guest Demonstration Mode Button */}
        <button
          type="button"
          onClick={handleGuestEntry}
          className="w-full py-2 rounded-md border border-panel-border bg-surface hover:bg-surface-elevated text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Continue as Guest Researcher (No Signup)</span>
        </button>
      </div>
    </div>
  );
};
