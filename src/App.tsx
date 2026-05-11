import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/components/AuthProvider';
import { LoginPage } from './features/auth/pages/LoginPage';
import { AdminDashboardPage } from './features/admin/pages/AdminDashboardPage';
import { BudgetsPage } from './features/workshop/budgets/pages/BudgetsPage';
import { WorkshopDashboardPage } from './features/workshop/pages/WorkshopDashboardPage';
import { ProtectedRoute } from './shared';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth/login" element={<LoginPage />} />

      {/* Protected Routes - Admin Only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={['admin', 'root']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Workshop Users */}
      <Route
        path="/workshop"
        element={
          <ProtectedRoute requiredRoles={['owner', 'mechanic', 'attendant']}>
            <WorkshopDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workshop/budgets"
        element={
          <ProtectedRoute requiredRoles={['owner', 'mechanic', 'attendant']}>
            <BudgetsPage />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
