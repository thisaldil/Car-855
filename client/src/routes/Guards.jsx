import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Spinner } from '../components/ui.jsx';
export function RequireAuth({ children, staff }) {
  const { user, loading, isStaff } = useAuth();
  const loc = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (staff && !isStaff) return <Navigate to="/account" replace />;
  return children;
}
