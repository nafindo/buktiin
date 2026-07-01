import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginRegister from './pages/LoginRegister';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';

// App Pages
import Dashboard from './pages/Dashboard';
import LiveScanner from './pages/LiveScanner';
import ScanHistory from './pages/ScanHistory';
import StorageManagement from './pages/StorageManagement';
import ProfileSettings from './pages/ProfileSettings';
import SelectPlan from './pages/SelectPlan';
import SubAccounts from './pages/SubAccounts';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import PlanConfiguration from './pages/PlanConfiguration';
import ClusterStorageManagement from './pages/ClusterStorageManagement';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes without Navbar (like Login) */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<LoginRegister />} />
          <Route path="/register" element={<LoginRegister />} />
        </Route>

        {/* Public Routes with generic topnav (like Landing, Pricing) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<SelectPlan />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Route>

        {/* Main App Routes (Logged in User) */}
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scanner" element={<LiveScanner />} />
          <Route path="/history" element={<ScanHistory />} />
          <Route path="/storage" element={<StorageManagement />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/plans" element={<SelectPlan />} />
          <Route path="/subaccounts" element={<SubAccounts />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/plans" element={<PlanConfiguration />} />
          <Route path="/admin/storage" element={<ClusterStorageManagement />} />
        </Route>

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
