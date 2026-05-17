import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { User } from '../types';

interface ProtectedRouteProps {
  readonly children: React.ReactNode;
  readonly requiredRoles?: User['role'][];
}

export function ProtectedRoute({ children, requiredRoles }: Readonly<ProtectedRouteProps>) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    // Redireciona para dashboard apropriado baseado no role atual
    const dashboards: Record<User['role'], string> = {
      root: '/admin',
      admin: '/admin',
      owner: '/workshop',
      mechanic: '/workshop',
      attendant: '/workshop',
    };
    const targetDashboard = dashboards[user.role];
    return <Navigate to={targetDashboard} replace />;
  }

  return <>{children}</>;
}
