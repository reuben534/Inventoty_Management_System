import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { LoginView } from './components/auth/LoginView';
import { ForgotPasswordModal } from './components/auth/ForgotPasswordModal';
import { ChangePasswordModal } from './components/auth/ChangePasswordModal';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { ManagerDashboard } from './components/dashboard/ManagerDashboard';
import { EmployeeDashboard } from './components/dashboard/EmployeeDashboard';
import { ProductCatalog } from './components/inventory/ProductCatalog';
import { ProductModal } from './components/inventory/ProductModal';
import { ProductDetailModal } from './components/inventory/ProductDetailModal';
import { StockAdjustmentModal } from './components/inventory/StockAdjustmentModal';
import { CategoryManagement } from './components/categories/CategoryManagement';
import { SupplierManagement } from './components/suppliers/SupplierManagement';
import { WarehouseManagement } from './components/warehouses/WarehouseManagement';
import { StockMovementsList } from './components/movements/StockMovementsList';
import { StockTransfersView } from './components/transfers/StockTransfersView';
import { StockRequestsView } from './components/requests/StockRequestsView';
import { CreateRequestModal } from './components/requests/CreateRequestModal';
import { PurchaseOrdersView } from './components/purchase/PurchaseOrdersView';
import { ReportsView } from './components/reports/ReportsView';
import { UserManagementView } from './components/users/UserManagementView';
import { ConfirmationModal } from './components/common/ConfirmationModal';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { Product, Category, DashboardData, NotificationItem } from './types';
import { api } from './services/api';

function MainApp() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { success, error } = useToast();

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Live Dashboard Data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);

  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [defaultReqProduct, setDefaultReqProduct] = useState<Product | null>(null);

  // Delete Confirmation Dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Fetch Dashboard & Notifications
  const fetchDashboardData = useCallback(() => {
    if (!isAuthenticated) return;
    api
      .getDashboard()
      .then((data) => setDashboardData(data))
      .catch((err) => console.error('Dashboard load err:', err));
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(() => {
    if (!isAuthenticated) return;
    api
      .getNotifications()
      .then((res) => {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      })
      .catch((err) => console.error('Notifications load err:', err));
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      fetchNotifications();
    }
  }, [isAuthenticated, currentView, fetchDashboardData, fetchNotifications]);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K for search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Initializing Inventory System...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <LoginView onOpenForgotPassword={() => setIsForgotPasswordOpen(true)} />
        <ForgotPasswordModal
          isOpen={isForgotPasswordOpen}
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      </>
    );
  }

  // Handlers for Products
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleOpenDetailProduct = (prod: Product) => {
    setDetailProduct(prod);
  };

  const handleOpenAdjustStock = async (prodOrId?: Product | number) => {
    if (typeof prodOrId === 'number') {
      try {
        const res = await api.getProduct(prodOrId);
        setAdjustProduct(res.product);
      } catch {
        setAdjustProduct(null);
      }
    } else {
      setAdjustProduct(prodOrId || null);
    }
    setIsAdjustStockOpen(true);
  };

  const handleOpenRequestProduct = (prod?: Product) => {
    setDefaultReqProduct(prod || null);
    setIsCreateRequestOpen(true);
  };

  const handleDeleteProduct = (prod: Product) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Catalog Item',
      message: `Are you sure you want to permanently remove "${prod.name}" (${prod.sku}) from the product catalog? This action will fail if active purchase orders or stock records exist.`,
      action: async () => {
        try {
          await api.deleteProduct(prod.id);
          success(`Product "${prod.name}" deleted.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          fetchDashboardData();
        } catch (err: any) {
          error(err.message || 'Failed to delete product');
        }
      },
    });
  };

  const handleDeleteCategory = (cat: Category) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete category "${cat.name}"? Only categories with zero mapped products can be removed.`,
      action: async () => {
        try {
          await api.deleteCategory(cat.id);
          success(`Category "${cat.name}" deleted.`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          fetchDashboardData();
        } catch (err: any) {
          error(err.message || 'Failed to delete category');
        }
      },
    });
  };

  // Render Active Main View
  const renderView = () => {
    const role = user?.role || 'employee';

    switch (currentView) {
      case 'dashboard':
        if (role === 'admin') {
          return (
            <AdminDashboard
              data={dashboardData}
              onNavigate={setCurrentView}
              onOpenAdjustModal={handleOpenAdjustStock}
            />
          );
        }
        if (role === 'manager') {
          return (
            <ManagerDashboard
              data={dashboardData}
              onNavigate={setCurrentView}
              onOpenAdjustModal={handleOpenAdjustStock}
            />
          );
        }
        return (
          <EmployeeDashboard
            data={dashboardData}
            onNavigate={setCurrentView}
            onOpenCreateRequest={() => handleOpenRequestProduct()}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        );

      case 'products':
        return (
          <ProductCatalog
            onOpenCreateProduct={handleOpenAddProduct}
            onOpenEditProduct={handleOpenEditProduct}
            onOpenDetailProduct={handleOpenDetailProduct}
            onOpenAdjustStock={handleOpenAdjustStock}
            onOpenCreateRequestForProduct={handleOpenRequestProduct}
            onConfirmDelete={handleDeleteProduct}
          />
        );

      case 'categories':
        return <CategoryManagement onConfirmDelete={handleDeleteCategory} />;

      case 'suppliers':
        return <SupplierManagement />;

      case 'warehouses':
        return <WarehouseManagement onNavigateToTransfers={() => setCurrentView('transfers')} />;

      case 'transfers':
        return <StockTransfersView />;

      case 'movements':
        return <StockMovementsList />;

      case 'requests':
        return (
          <StockRequestsView
            onOpenCreateRequest={() => handleOpenRequestProduct()}
          />
        );

      case 'purchase-orders':
        return <PurchaseOrdersView />;

      case 'reports':
        return <ReportsView />;

      case 'users':
        return <UserManagementView />;

      default:
        return (
          <div className="py-12 text-center text-slate-400 text-xs">
            Section not found or under maintenance.
          </div>
        );
    }
  };

  const handleNavigate = (path: string) => {
    const cleaned = path.replace(/^\/(admin|manager|employee)\//, '').replace(/^\//, '');
    if (cleaned === 'inventory') {
      setCurrentView('products');
    } else if (cleaned === 'request-stock' || cleaned === 'my-requests') {
      setCurrentView('requests');
    } else if (cleaned === 'my-activity') {
      setCurrentView('movements');
    } else if (cleaned === 'audit-logs') {
      setCurrentView('reports');
    } else {
      setCurrentView(cleaned || 'dashboard');
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPath={currentView}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenChangePassword={() => setIsPasswordModalOpen(true)}
          onNavigate={handleNavigate}
          unreadCount={unreadCount}
          notifications={notifications}
          onRefreshNotifications={fetchNotifications}
          onOpenAddProduct={handleOpenAddProduct}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl w-full mx-auto space-y-6">
            {renderView()}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={async (productId) => {
          setIsSearchOpen(false);
          try {
            const res = await api.getProduct(productId);
            setDetailProduct(res.product);
          } catch {
            // fallback
          }
        }}
        onNavigate={(path) => {
          setIsSearchOpen(false);
          setCurrentView(path);
        }}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
        onSaved={() => {
          fetchDashboardData();
          if (currentView === 'products') {
            setCurrentView('products');
          }
        }}
      />

      <ProductDetailModal
        isOpen={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        product={detailProduct}
        onOpenAdjustStock={(p) => handleOpenAdjustStock(p)}
      />

      <StockAdjustmentModal
        isOpen={isAdjustStockOpen}
        onClose={() => {
          setIsAdjustStockOpen(false);
          setAdjustProduct(null);
        }}
        product={adjustProduct}
        onAdjusted={() => {
          fetchDashboardData();
        }}
      />

      <CreateRequestModal
        isOpen={isCreateRequestOpen}
        onClose={() => {
          setIsCreateRequestOpen(false);
          setDefaultReqProduct(null);
        }}
        defaultProduct={defaultReqProduct}
        onCreated={() => {
          fetchDashboardData();
          if (currentView !== 'requests') {
            setCurrentView('requests');
          }
        }}
      />

      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.action}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
