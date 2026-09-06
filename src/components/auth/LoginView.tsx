import React, { useState } from 'react';
import { Boxes, Shield, Briefcase, User as UserIcon, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types';

interface LoginViewProps {
  onOpenForgotPassword?: () => void;
}

export function LoginView({ onOpenForgotPassword }: LoginViewProps) {
  const { login, demoUsers, defaultPassword } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      success('Authentication successful. Welcome back!');
    } catch (err: any) {
      error(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setEmail(userEmail);
    setPassword(defaultPassword);
    setLoading(true);
    try {
      await login(userEmail, defaultPassword);
      success(`Signed in as ${userEmail}`);
    } catch (err: any) {
      error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const roleStyles: Record<UserRole, { badge: string; icon: any }> = {
    admin: { badge: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800', icon: Shield },
    manager: { badge: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800', icon: Briefcase },
    employee: { badge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', icon: UserIcon },
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-500/20 mb-4">
          <Boxes className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">StockMaster Enterprise</h2>
        <p className="mt-1 text-sm text-slate-400">Integrated Role-Based Inventory & Warehouse Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0 space-y-6">
        {/* Main Login Card */}
        <div className="bg-slate-800/90 backdrop-blur-md py-8 px-6 sm:px-10 rounded-2xl border border-slate-700/80 shadow-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Corporate Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@inventory.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-600 bg-slate-900/80 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={onOpenForgotPassword}
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-600 bg-slate-900/80 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>Sign In to Portal</span>
            </button>
          </form>
        </div>

        {/* Demo Accounts Quick-Access Panel */}
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/60 p-5">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-700/60">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                1-Click Demo Accounts
              </div>
              <div className="text-[11px] text-slate-400">Click any user below to authenticate immediately</div>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-700">
              Pass: {defaultPassword}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {demoUsers.map((u) => {
              const info = roleStyles[u.role] || roleStyles.employee;
              const Icon = info.icon;

              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.email)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-700/70 bg-slate-900/50 hover:bg-slate-700/50 text-left transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`}
                      alt={u.name}
                      className="w-8 h-8 rounded-full border border-slate-600 shrink-0 bg-slate-800"
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-white group-hover:text-blue-300 truncate">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">{u.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${info.badge}`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{u.role}</span>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
