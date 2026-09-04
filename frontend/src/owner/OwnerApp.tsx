import { Route, Routes } from 'react-router-dom';
import { useBootstrapAuth } from './hooks/useBootstrapAuth';
import RequireAuth from './components/RequireAuth';
import OwnerShell from './components/OwnerShell';
import FindStorePage from './pages/FindStorePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import WelcomePage from './pages/WelcomePage';
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import SubscriptionPage from './pages/subscription/SubscriptionPage';
import TrialExpiredPage from './pages/subscription/TrialExpiredPage';
import BranchesPage from './pages/branches/BranchesPage';
import BranchDetailPage from './pages/branches/BranchDetailPage';
import BranchManagersPage from './pages/branches/BranchManagersPage';
import CustomersPage from './pages/customers/CustomersPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import CheckinPage from './pages/checkin/CheckinPage';
import MembershipsPage from './pages/memberships/MembershipsPage';
import PtPage from './pages/pt/PtPage';
import SettingsPage from './pages/SettingsPage';

// OW-00/OW-02 gộp một bước đăng ký (xem comment ở api/auth.ts) — mọi tài
// khoản TENANT đã đăng nhập luôn có sẵn tenantId, nên không còn "create
// tenant"/"require tenant" nào cần route riêng nữa.
//
// Đăng nhập 2 bước kiểu KiotViet: /login (nhập tên cửa hàng) → /login/:slug
// (form mật khẩu thật) — mô phỏng subdomain `{slug}.fitflow.vn` bằng route
import { TenantGuard } from '../tenant/tenant-guard';

export default function OwnerApp() {
  useBootstrapAuth();

  return (
    <Routes>
      <Route element={<TenantGuard />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="login/:slug" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="verify-otp" element={<VerifyOtpPage />} />

        <Route element={<RequireAuth />}>
          <Route path="welcome" element={<WelcomePage />} />

          <Route element={<OwnerShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="subscription" element={<SubscriptionPage />} />
            <Route path="subscription/expired" element={<TrialExpiredPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="branches/:id" element={<BranchDetailPage />} />
            <Route path="branch-managers" element={<BranchManagersPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/:id" element={<CustomerDetailPage />} />
            <Route path="checkin" element={<CheckinPage />} />
            <Route path="memberships" element={<MembershipsPage />} />
            <Route path="pt" element={<PtPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
