import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import MainLayout from './layouts/MainLayout';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LaunchApp from './pages/LaunchApp';
import DownloadApp from './pages/DownloadApp';
import LoginRegister from './pages/LoginRegister';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';
import ResetPassword from './pages/ResetPassword';

// App Pages
import Dashboard from './pages/Dashboard';
import LiveScanner from './pages/LiveScanner';
import ScanHistory from './pages/ScanHistory';
import UnboxingScanner from './pages/UnboxingScanner';
import UnboxingHistory from './pages/UnboxingHistory';
import StorageManagement from './pages/StorageManagement';
import ProfileSettings from './pages/ProfileSettings';
import SelectPlan from './pages/SelectPlan';
import SubAccounts from './pages/SubAccounts';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import PlanConfiguration from './pages/PlanConfiguration';
import ClusterStorageManagement from './pages/ClusterStorageManagement';
import AdminSubscriptions from './pages/AdminSubscriptions';
import AdminQrisSettings from './pages/AdminQrisSettings';

function RootAuthRoute() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [isAdminApp, setIsAdminApp] = useState<boolean>(() => {
    return (
      localStorage.getItem('is_admin_mode') === 'true' ||
      window.location.hash.startsWith('#/admin')
    );
  });
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const videoId = searchParams.get('v');

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      CapApp.getInfo().catch(() => null),
      supabase.auth.getSession()
    ]).then(([info, { data }]) => {
      if (!isMounted) return;
      if (info && info.id && (info.id.endsWith('.admin') || info.id.includes('admin') || (info.name && info.name.toLowerCase().includes('admin')))) {
        setIsAdminApp(true);
        localStorage.setItem('is_admin_mode', 'true');
      } else {
        if (!window.location.hash.startsWith('#/admin')) {
          localStorage.removeItem('is_admin_mode');
        }
      }
      setSession(data?.session || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // If customer video proof link with ?v=ID, show the video proof player page
  if (videoId) {
    return <LandingPage />;
  }

  // If running in dedicated Admin Console APK, route directly to Admin Dashboard
  if (isAdminApp) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-on-surface-variant font-body-md">Memuat Buktiin...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  // Initial view is Login & Register form directly
  return <LoginRegister />;
}

import { App as CapApp } from '@capacitor/app';

function AndroidBackButtonHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let lastBackTime = 0;

    const backListener = CapApp.addListener('backButton', () => {
      // 1. If any modal is active on screen, close it by clicking its close button
      const activeModalBtn = document.querySelector<HTMLElement>('[data-modal-close], button[title="Tutup"], button[title="Close"]');
      if (activeModalBtn) {
        activeModalBtn.click();
        return;
      }

      const curPath = location.pathname;

      // 2. If inside Admin routes
      if (curPath.startsWith('/admin')) {
        if (curPath !== '/admin' && curPath !== '/admin/dashboard') {
          navigate('/admin/dashboard');
          return;
        }

        // If on /admin/dashboard, double-tap back within 2 seconds to exit app
        const now = Date.now();
        if (now - lastBackTime < 2000) {
          CapApp.exitApp();
        } else {
          lastBackTime = now;
          const toast = document.createElement('div');
          toast.innerText = 'Tekan sekali lagi untuk keluar dari Buktiin Admin';
          toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:white;padding:6px 14px;border-radius:16px;font-size:11px;font-weight:bold;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3);pointer-events:none;';
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 1800);
        }
        return;
      }

      // 3. If in a regular sub-page, navigate back to /dashboard
      if (curPath !== '/' && curPath !== '/dashboard' && curPath !== '/login') {
        navigate('/dashboard');
        return;
      }

      // 4. If on /dashboard or /login, double-tap back within 2 seconds to exit app
      const now = Date.now();
      if (now - lastBackTime < 2000) {
        CapApp.exitApp();
      } else {
        lastBackTime = now;
        const toast = document.createElement('div');
        toast.innerText = 'Tekan sekali lagi untuk keluar aplikasi';
        toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:white;padding:6px 14px;border-radius:16px;font-size:11px;font-weight:bold;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,0.3);pointer-events:none;';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 1800);
      }
    });

    return () => {
      backListener.then(handle => handle.remove());
    };
  }, [location, navigate]);

  return null;
}

function App() {
  return (
    <Router>
      <AndroidBackButtonHandler />
      <Routes>
        {/* Root Route: Login/Register by default, or Dashboard if logged in, or Video Proof if ?v=ID */}
        <Route path="/" element={<RootAuthRoute />} />

        {/* Public Routes without Navbar */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/register" element={<LoginRegister />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Public Routes with generic topnav */}
        <Route element={<PublicLayout />}>
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/promo" element={<LandingPage />} />
          <Route path="/launch" element={<LaunchApp />} />
          <Route path="/pricing" element={<SelectPlan />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/download" element={<DownloadApp />} />
        </Route>

        {/* Public Routes without topnav (Legal Pages) */}
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

        {/* Main App Routes (Logged in User) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scanner" element={<LiveScanner />} />
          <Route path="/history" element={<ScanHistory />} />
          <Route path="/unboxing" element={<UnboxingScanner />} />
          <Route path="/unboxing-history" element={<UnboxingHistory />} />
          <Route path="/storage" element={<StorageManagement />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/plans" element={<SelectPlan />} />
          <Route path="/subaccounts" element={<SubAccounts />} />
        </Route>

        {/* Admin Routes - Web Only */}
        {!navigator.userAgent.toLowerCase().includes('electron') && (
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
            <Route path="/admin/plans" element={<PlanConfiguration />} />
            <Route path="/admin/storage" element={<ClusterStorageManagement />} />
            <Route path="/admin/qris" element={<AdminQrisSettings />} />
          </Route>
        )}

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
