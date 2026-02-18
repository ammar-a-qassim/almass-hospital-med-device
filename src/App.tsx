import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { AuthProvider, useAuth } from "./store/AuthContext";
import Dashboard from "./pages/Dashboard";
import DeviceNew from "./pages/DeviceNew";
import DevicesList from "./pages/DevicesList";
import DeviceDetail from "./pages/DeviceDetail";
import RoutineCheckPage from "./pages/RoutineCheck";
import ChecksList from "./pages/ChecksList";
import DepartmentsList from "./pages/DepartmentsList";
import Reports from "./pages/Reports";
import DueMaintenanceReport from "./pages/DueMaintenanceReport";
import AdminControl from "./pages/AdminControl";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Footer from "./components/Footer";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import MaintenanceBell from "./components/Maintenance/MaintenanceBell";

function ProtectedRoute({ children, requiredPrivilege }: { children: React.ReactNode; requiredPrivilege?: string }) {
  const { isAuthenticated, isLoading, hasPrivilege } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check privilege if required
  if (requiredPrivilege && !hasPrivilege(requiredPrivilege)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">غير مصرح</h2>
          <p className="text-gray-600 mb-6">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

function Navigation() {
  const location = useLocation();
  const { logout, user, hasPrivilege } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  
  const handleLogout = () => {
    logout();
    window.location.href = "/login";
  };

  const navLinks = [
    { to: "/", label: "الرئيسية", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", privilege: null },
    { to: "/devices", label: "الأجهزة", icon: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z", privilege: "view_devices" },
    { to: "/checks", label: "صيانة", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4", privilege: "view_checks" },
    { to: "/departments", label: "الأقسام", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4", privilege: "manage_departments" },
    { to: "/reports", label: "التقارير", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", privilege: "view_reports" },
    { to: "/admin", label: "الإدارة", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", privilege: "manage_users" },
    { to: "/contact", label: "تواصل معنا", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", privilege: null },
  ].filter(link => !link.privilege || hasPrivilege(link.privilege));

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-gradient-to-r from-slate-800 via-purple-900 to-slate-800 border-b border-white/10 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & User Info */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-3 text-white hover:opacity-80 transition-opacity">
              <img src="/assets/logo.png" alt="مستشفى الماس" className="h-10 w-auto" />
              <span className="text-lg font-bold hidden md:block">متابعة الأجهزة الطبية</span>
            </Link>
            
            {/* User Badge */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg">
                <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{user.name[0]}</span>
                </div>
                <span className="text-sm text-gray-200">{user.name}</span>
                {user.role === 'admin' && (
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded">
                    مدير
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right side: notifications + navigation */}
          <div className="flex items-center gap-2">
            <MaintenanceBell enabled={hasPrivilege('view_reports')} />

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  isActive(link.to)
                    ? "bg-white/20 text-white shadow-lg"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                </svg>
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium text-red-300 hover:bg-red-600/20 hover:text-red-200 transition-all mr-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              خروج
            </button>
            </nav>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {showMenu && (
          <nav className="lg:hidden mt-4 pb-2 space-y-1 animate-fade-in">
            {/* User Info Mobile */}
            {user && (
              <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{user.name[0]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{user.name}</p>
                  <p className="text-gray-400 text-sm">{user.username}</p>
                </div>
                {user.role === 'admin' && (
                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded">
                    مدير
                  </span>
                )}
              </div>
            )}
            
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setShowMenu(false)}
                className={`block px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium transition-all ${
                  isActive(link.to)
                    ? "bg-white/20 text-white"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                </svg>
                {link.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full text-right px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium text-red-300 hover:bg-red-600/20 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              خروج
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}

function AppContent() {
  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-[#F6F4F1] bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url(/assets/youware-bg.png)" }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Navigation />
              <main className="flex-grow">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/device/new" element={<ProtectedRoute requiredPrivilege="add_devices"><DeviceNew /></ProtectedRoute>} />
                  <Route path="/device/edit/:deviceId" element={<ProtectedRoute requiredPrivilege="edit_devices"><DeviceNew /></ProtectedRoute>} />
                  <Route path="/device/:deviceId" element={<ProtectedRoute requiredPrivilege="view_devices"><DeviceDetail /></ProtectedRoute>} />
                  <Route path="/devices" element={<ProtectedRoute requiredPrivilege="view_devices"><DevicesList /></ProtectedRoute>} />
                  <Route path="/check" element={<ProtectedRoute requiredPrivilege="add_checks"><RoutineCheckPage /></ProtectedRoute>} />
                  <Route path="/checks" element={<ProtectedRoute requiredPrivilege="view_checks"><ChecksList /></ProtectedRoute>} />
                  <Route path="/departments" element={<ProtectedRoute requiredPrivilege="manage_departments"><DepartmentsList /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute requiredPrivilege="view_reports"><Reports /></ProtectedRoute>} />
                  <Route path="/reports/maintenance" element={<ProtectedRoute requiredPrivilege="view_reports"><DueMaintenanceReport /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute requiredPrivilege="manage_users"><AdminControl /></ProtectedRoute>} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
              <FloatingWhatsApp />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
