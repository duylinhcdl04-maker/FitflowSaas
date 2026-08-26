import { Route, Routes } from 'react-router-dom';
import { useBootstrapAuth } from '../owner/hooks/useBootstrapAuth';
import RequireStaffAuth from './components/RequireStaffAuth';
import StaffShell from './components/StaffShell';
import StaffDashboardPage from './pages/DashboardPage';
import StaffCheckinPage from './pages/CheckinPage';
import StaffPosPage from './pages/PosPage';
import StaffGuestVisitsPage from './pages/GuestVisitsPage';
import StaffMembersPage from './pages/MembersPage';

export default function StaffApp() {
  useBootstrapAuth();

  return (
    <Routes>
      <Route element={<RequireStaffAuth />}>
        <Route element={<StaffShell />}>
          <Route index element={<StaffDashboardPage />} />
          <Route path="checkin" element={<StaffCheckinPage />} />
          <Route path="pos" element={<StaffPosPage />} />
          <Route path="guest-visits" element={<StaffGuestVisitsPage />} />
          <Route path="members" element={<StaffMembersPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
