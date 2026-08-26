import { Route, Routes } from 'react-router-dom';
import { useBootstrapAuth } from './hooks/useBootstrapAuth';
import RequireAuth from './components/RequireAuth';
import AdminLayout from './components/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TenantsListPage from './pages/TenantsListPage';
import TenantCreatePage from './pages/TenantCreatePage';
import TenantDetailPage from './pages/TenantDetailPage';
import PlansPage from './pages/PlansPage';
import AddonsPage from './pages/AddonsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import StaffPage from './pages/StaffPage';
import InvoicesPage from './pages/InvoicesPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import SettingsPage from './pages/SettingsPage';

export default function AdminApp() {
  useBootstrapAuth();

  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tenants" element={<TenantsListPage />} />
          <Route path="tenants/new" element={<TenantCreatePage />} />
          <Route path="tenants/:id" element={<TenantDetailPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="addons" element={<AddonsPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
