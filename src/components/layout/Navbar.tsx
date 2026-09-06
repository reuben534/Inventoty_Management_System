import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  KeyRound,
  Check,
  ChevronDown,
  ArrowRight,
  Shield,
  Briefcase,
  User as UserIcon,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationItem, UserRole } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onOpenChangePassword: () => void;
  onNavigate: (path: string) => void;
  unreadCount: number;
  notifications: NotificationItem[];
  onRefreshNotifications: () => void;
  onOpenAddProduct?: () => void;
}

export function Navbar({
  onToggleSidebar,
  onOpenSearch,
  onOpenChangePassword,
  onNavigate,
  unreadCount,
  notifications,
  onRefreshNotifications,
  onOpenAddProduct,
}: NavbarProps) {
  const { user, role, logout, switchDemoUser, demoUsers, darkMode, toggleDarkMode } = useAuth();
  const { success, error } = useToast();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await api.markNotificationRead(id);
      onRefreshNotifications();
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      onRefreshNotifications();
      success('All notifications marked as read.');
    } catch (err: any) {
      error(err.message);
    }
  };

  const handleRoleSwitch = async (targetRole: UserRole) => {
    setShowRoleMenu(false);
    await switchDemoUser(targetRole);
    success(`Switched session to ${targetRole.toUpperCase()}`);
    onNavigate(`/${targetRole}/dashboard`);
  };

  const roleBadgeStyles: Record<UserRole, { label: string; icon: any; color: string }> = {
    admin: { label: 'Admin', icon: Shield, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' },
    manager: { label: 'Manager', icon: Briefcase, color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' },
    employee: { label: 'Employee', icon: UserIcon, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  };

  const CurrentRoleIcon = roleBadgeStyles[role || 'employee'].icon;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 transition-colors">
      {/* Left side: Hamburger + Search input trigger */}
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-64 sm:w-80 md:w-96">
          <input
            type="text"
            placeholder="Search SKU, product name, or warehouse..."
            onClick={onOpenSearch}
            readOnly
            className="w-full pl-10 pr-12 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
          />
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
          <kbd className="hidden sm:inline-flex absolute right-3 top-2.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 pointer-events-none">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right side: Role Switcher + Dark mode + Notifications + Add Product + User Avatar */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick Role Switcher */}
        <div className="relative" ref={roleMenuRef}>
          <button
            onClick={() => setShowRoleMenu((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
              roleBadgeStyles[role || 'employee'].color
            }`}
            title="Switch User Role"
          >
            <CurrentRoleIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Role: {roleBadgeStyles[role || 'employee'].label}</span>
            <span className="sm:hidden">{roleBadgeStyles[role || 'employee'].label}</span>
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Switch Demo Role</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Test role-based permissions instantly</div>
              </div>

              <div className="py-1">
                {(['admin', 'manager', 'employee'] as UserRole[]).map((r) => {
                  const info = roleBadgeStyles[r];
                  const Icon = info.icon;
                  const isCurrent = role === r;
                  const matchingDemo = demoUsers.find((u) => u.role === r);

                  return (
                    <button
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors ${
                        isCurrent
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <div>
                          <div className="font-semibold">{info.label}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500">
                            {matchingDemo?.name || r}
                          </div>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-2 z-50">
              <div className="px-4 py-2 flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">No notifications at this time.</div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-left transition-colors flex items-start justify-between gap-2 ${
                        n.is_read ? 'opacity-70 bg-transparent' : 'bg-blue-50/40 dark:bg-blue-950/20'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">{n.title}</div>
                        <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(n.created_at).toLocaleDateString()} at {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {!n.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="shrink-0 p-1 text-xs text-slate-400 hover:text-blue-600"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="px-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate(`/${role}/notifications`);
                  }}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  <span>View All Notifications</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Product Button (matches Design HTML) */}
        {onOpenAddProduct && (role === 'admin' || role === 'manager') && (
          <button
            onClick={onOpenAddProduct}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Product</span>
          </button>
        )}

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-700 transition-all"
          >
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`}
              alt={user?.name}
              className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 object-cover bg-slate-100 dark:bg-slate-800"
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60">
                <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${roleBadgeStyles[role || 'employee'].color}`}>
                    {role}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">({user?.department})</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenChangePassword();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await logout();
                    success('Signed out successfully.');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
