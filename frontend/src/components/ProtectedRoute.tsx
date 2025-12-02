import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

interface Props {
  roles?: Role[];
}

export const ProtectedRoute: React.FC<Props> = ({ roles }) => {
  const { user, token, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ padding: 24 }}>Checking session...</div>;
  if (!token || !user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !hasRole(roles)) return <Navigate to="/" replace />;
  return <Outlet />;
};
