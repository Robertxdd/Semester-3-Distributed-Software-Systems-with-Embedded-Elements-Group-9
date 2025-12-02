import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import MyDeskPage from './pages/MyDeskPage';
import MyHealthPage from './pages/MyHealthPage';
import SettingsPage from './pages/SettingsPage';
import DesksOverviewPage from './pages/DesksOverviewPage';
import ReportsPage from './pages/ReportsPage';
import DeskSyncPage from './pages/DeskSyncPage';
import AdminPage from './pages/AdminPage';

const DefaultRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const destination = user.role === 'OCCUPANT' ? '/desk' : '/desks';
  return <Navigate to={destination} replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route index element={<DefaultRedirect />} />
        <Route element={<ProtectedRoute roles={['OCCUPANT']} />}>
          <Route path="/desk" element={<MyDeskPage />} />
          <Route path="/health" element={<MyHealthPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['MANAGER', 'ADMIN']} />}>
          <Route path="/desks" element={<DesksOverviewPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/desk-sync" element={<DeskSyncPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={['ADMIN']} />}>
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
