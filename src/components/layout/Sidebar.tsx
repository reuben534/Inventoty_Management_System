import {
  LayoutDashboard,
  Boxes,
  Tags,
  Truck,
  Warehouse,
  ArrowLeftRight,
  ClipboardList,
  ShoppingCart,
  GitCompare,
  BarChart3,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  isOpen: boolean;
  onClose: () => void;
  unreadNotificationsCount?: number;
}

interface NavItem {
  name: string;
  id: string;
  icon: any;
  badge?: number | string;
}

export function Sidebar({
  currentPath,
  onNavigate,
  isOpen,
  onClose,
  unreadNotificationsCount = 0,
}: SidebarProps) {
  const { user } = useAuth();
  const role: UserRole = user?.role || 'employee';

  const cleanCurrent = currentPath.replace(/^\/(admin|manager|employee)\//, '').replace(/^\//, '') || 'dashboard';

  const getNavItems = (): NavItem[] => {
    if (role === 'admin') {
      return [
        { name: 'Admin Dashboard', id: 'dashboard', icon: LayoutDashboard },
        { name: 'Inventory Items', id: 'products', icon: Boxes },
        { name: 'Categories', id: 'categories', icon: Tags },
        { name: 'Warehouses', id: 'warehouses', icon: Warehouse },
        { name: 'Suppliers', id: 'suppliers', icon: Truck },
        { name: 'Transfers', id: 'transfers', icon: GitCompare },
        { name: 'Stock Movements', id: 'movements', icon: ArrowLeftRight },
        {
          name: 'Stock Requests',
          id: 'requests',
          icon: ClipboardList,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        },
        { name: 'Purchase Orders', id: 'purchase-orders', icon: ShoppingCart },
        { name: 'Reports & Logs', id: 'reports', icon: BarChart3 },
        { name: 'User Management', id: 'users', icon: Users },
      ];
    }

    if (role === 'manager') {
      return [
        { name: 'Manager Dashboard', id: 'dashboard', icon: LayoutDashboard },
        { name: 'Inventory Items', id: 'products', icon: Boxes },
        { name: 'Warehouses', id: 'warehouses', icon: Warehouse },
        { name: 'Suppliers', id: 'suppliers', icon: Truck },
        { name: 'Transfers', id: 'transfers', icon: GitCompare },
        { name: 'Stock Movements', id: 'movements', icon: ArrowLeftRight },
        {
          name: 'Stock Requests',
          id: 'requests',
          icon: ClipboardList,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
        },
        { name: 'Purchase Orders', id: 'purchase-orders', icon: ShoppingCart },
        { name: 'Reports & Logs', id: 'reports', icon: BarChart3 },
      ];
    }

    // Employee
    return [
      { name: 'Workspace Dashboard', id: 'dashboard', icon: LayoutDashboard },
      { name: 'Inventory Items', id: 'products', icon: Boxes },
      {
        name: 'Stock Requests',
        id: 'requests',
        icon: ClipboardList,
        badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
      },
      { name: 'Stock Movements', id: 'movements', icon: ArrowLeftRight },
    ];
  };

  const navItems = getNavItems();

  const getInitials = (name?: string) => {
    if (!name) return 'IV';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 flex flex-col flex-shrink-0 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-sm shadow-blue-500/20">
              IV
            </div>
            <span className="text-white font-bold text-lg tracking-tight">InvenTrust Pro</span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 space-y-1 py-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              cleanCurrent === item.id ||
              (item.id === 'products' && (cleanCurrent === 'inventory' || cleanCurrent === 'products'));

            return (
              <div
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'opacity-100 text-white' : 'opacity-60'}`} />
                  <span className="text-sm font-medium truncate">{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Storage Capacity Widget */}
        <div className="p-4 bg-slate-800 m-4 rounded-xl border border-slate-700/40">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Storage Capacity
          </div>
          <div className="w-full bg-slate-700 h-2 rounded-full mb-2 overflow-hidden">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: '72%' }} />
          </div>
          <div className="text-[10px] text-slate-300 flex justify-between font-medium">
            <span>72% Utilized</span>
            <span>1,204 SQ/M</span>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="mt-auto p-6 border-t border-slate-800 flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0 border border-slate-600">
            {getInitials(user?.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-white truncate">{user?.name || 'Alex Johnson'}</div>
            <div className="text-xs text-slate-500 truncate">
              {role === 'admin' ? 'System Admin' : role === 'manager' ? 'Inventory Manager' : 'Operations Associate'}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
