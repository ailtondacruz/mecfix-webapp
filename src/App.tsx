import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/components/AuthProvider';
import { LoginPage } from './features/auth/pages/LoginPage';
import { AdminDashboardPage } from './features/admin/pages/AdminDashboardPage';
import { WorkshopDetailsPage } from './features/admin/pages/WorkshopDetailsPage';
import { BudgetsPage } from './features/workshop/budgets/pages/BudgetsPage';
import { BudgetPublicPage } from './features/workshop/budgets/pages/BudgetPublicPage';
import { CustomersPage } from './features/workshop/customers/pages/CustomersPage';
import { WorkshopDashboardPage } from './features/workshop/pages/WorkshopDashboardPage';
import { FinancialsPage } from './features/workshop/financials/pages/FinancialsPage';
import { AppVersionBadge, ProtectedRoute } from './shared';

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/o/:shareToken" element={<BudgetPublicPage />} />

      {/* Protected Routes - Admin Only */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={['admin', 'root']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/workshops/:workshopId"
        element={
          <ProtectedRoute requiredRoles={['admin', 'root']}>
            <WorkshopDetailsPage />
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
      <Route
        path="/workshop/customers"
        element={
          <ProtectedRoute requiredRoles={['owner', 'mechanic', 'attendant']}>
            <CustomersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workshop/financials"
        element={
          <ProtectedRoute requiredRoles={['owner', 'mechanic', 'attendant']}>
            <FinancialsPage />
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
        <AppVersionBadge />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
