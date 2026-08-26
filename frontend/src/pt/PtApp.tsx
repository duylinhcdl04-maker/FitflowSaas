import { Routes, Route, Navigate } from 'react-router-dom';
import RequirePtAuth from './components/RequirePtAuth';
import PtShell from './components/PtShell';
import PtDashboardPage from './pages/DashboardPage';
import PtSchedulePage from './pages/SchedulePage';
import PtClientsPage from './pages/ClientsPage';
import PtPackagesPage from './pages/PackagesPage';
import PtProfilePage from './pages/ProfilePage';

export default function PtApp() {
  return (
    <Routes>
      <Route element={<RequirePtAuth />}>
        <Route element={<PtShell />}>
          <Route index element={<PtDashboardPage />} />
          <Route path="schedule" element={<PtSchedulePage />} />
          <Route path="clients" element={<PtClientsPage />} />
          <Route path="packages" element={<PtPackagesPage />} />
          <Route path="profile" element={<PtProfilePage />} />
          <Route path="*" element={<Navigate to="/pt" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
