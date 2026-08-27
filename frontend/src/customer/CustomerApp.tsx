import { Navigate, Route, Routes } from 'react-router-dom';
import { useBootstrapAuth } from '../owner/hooks/useBootstrapAuth';
import RequireCustomerAuth from './components/RequireCustomerAuth';
import CustomerShell from './components/CustomerShell';
import DashboardPage from './pages/DashboardPage';
import MembershipPage from './pages/MembershipPage';
import PtBookingPage from './pages/PtBookingPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';

// Customer Portal is a net-new app, but reuses the SAME login screen and auth
// store as Owner/Manager/Staff/PT (frontend/src/owner/pages/LoginPage.tsx +
// owner/store/auth-store.ts) — matches doc §1 "chỉ đăng nhập tại cổng đăng
// nhập của chi nhánh khách hàng được staff tạo tài khoản" without a new
// auth surface, and lets it be bootstrapped independently on direct load
// (e.g. a page refresh at /customer) the same way manager/staff already do.
export default function CustomerApp() {
  useBootstrapAuth();

  return (
    <Routes>
      <Route element={<RequireCustomerAuth />}>
        <Route element={<CustomerShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="membership" element={<MembershipPage />} />
          <Route path="pt" element={<PtBookingPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/customer" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
