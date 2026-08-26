import { Route, Routes } from 'react-router-dom';
import { useBootstrapAuth } from '../owner/hooks/useBootstrapAuth';
import RequireManagerAuth from './components/RequireManagerAuth';
import ManagerShell from './components/ManagerShell';
import ManagerDashboardPage from './pages/DashboardPage';
import ManagerCheckinPage from './pages/checkin/CheckinPage';
import ManagerCustomersPage from './pages/customers/CustomersPage';
import ManagerMembershipsPage from './pages/memberships/MembershipsPage';
import ManagerPtPage from './pages/pt/PtPage';
import ManagerStaffPage from './pages/staff/StaffPage';
import ManagerReportsPage from './pages/reports/ReportsPage';

export default function ManagerApp() {
  useBootstrapAuth();

  return (
    <Routes>
      <Route element={<RequireManagerAuth />}>
        <Route element={<ManagerShell />}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="checkin" element={<ManagerCheckinPage />} />
          <Route path="customers" element={<ManagerCustomersPage />} />
          <Route path="memberships" element={<ManagerMembershipsPage />} />
          <Route path="pt" element={<ManagerPtPage />} />
          <Route path="staff" element={<ManagerStaffPage />} />
          <Route path="reports" element={<ManagerReportsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
