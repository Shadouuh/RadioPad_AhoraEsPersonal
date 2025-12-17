import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/routing/ProtectedRoute'
import { ROLES } from './utils/roles'
import DashboardPage from './pages/DashboardPage'
import FxPadPage from './pages/FxPadPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ProgramsPage from './pages/ProgramsPage'
import SettingsPage from './pages/SettingsPage'
import UnauthorizedPage from './pages/UnauthorizedPage'
import UsersPage from './pages/UsersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/fx" element={<FxPadPage />} />
          <Route path="/programas" element={<ProgramsPage />} />
          <Route path="/configuracion" element={<SettingsPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<ProtectedRoute allowedRoles={[ROLES.CHIEF]} />}>
            <Route path="/usuarios" element={<UsersPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
