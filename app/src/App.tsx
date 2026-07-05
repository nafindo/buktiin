import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import DownloadApp from './pages/DownloadApp';
import TermsAndConditions from './pages/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import PlanConfiguration from './pages/PlanConfiguration';
import ClusterStorageManagement from './pages/ClusterStorageManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/download" element={<DownloadApp />} />
        </Route>

        {/* Legal Pages without topnav */}
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />

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
