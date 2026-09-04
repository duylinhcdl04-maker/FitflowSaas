import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
// Imported for its module-level side effect: applies the persisted theme
// class to <html> before the app renders (avoids a light/dark flash).
import './store/theme-store'
import App from './App.tsx'
import AdminApp from './admin/AdminApp.tsx'
import OwnerApp from './owner/OwnerApp.tsx'
import ManagerApp from './manager/ManagerApp.tsx'
import StaffApp from './staff/StaffApp.tsx'
import PtApp from './pt/PtApp.tsx'
import CustomerApp from './customer/CustomerApp.tsx'

import { TenantProvider } from './tenant/tenant-context.tsx'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TenantProvider>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="/owner/*" element={<OwnerApp />} />
            <Route path="/manager/*" element={<ManagerApp />} />
            <Route path="/staff/*" element={<StaffApp />} />
            <Route path="/pt/*" element={<PtApp />} />
            <Route path="/customer/*" element={<CustomerApp />} />
          </Routes>
        </TenantProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
