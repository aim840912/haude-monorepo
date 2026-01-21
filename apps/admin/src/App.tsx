import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { ProductsPage } from './pages/ProductsPage'
import { FarmToursPage } from './pages/FarmToursPage'
import { SchedulesPage } from './pages/SchedulesPage'
import { LocationsPage } from './pages/LocationsPage'
import { OrdersPage } from './pages/OrdersPage'
import { PaymentsPage } from './pages/PaymentsPage'
import { DiscountsPage } from './pages/DiscountsPage'
import { SocialPostsPage } from './pages/SocialPostsPage'
import { UsersPage } from './pages/UsersPage'
import { UserDetailPage } from './pages/UserDetailPage'
import { SettingsPage } from './pages/SettingsPage'
import { ReportsPage } from './pages/ReportsPage'
import { SystemPage } from './pages/SystemPage'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/errors'
import { ToastProvider } from './components/ui/Toast'
import { SystemStatusProvider } from './components/system/SystemStatusProvider'

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <SystemStatusProvider>
            <Routes>
              {/* 公開路由 */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              {/* 受保護的路由 */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/farm-tours" element={<FarmToursPage />} />
                <Route path="/schedules" element={<SchedulesPage />} />
                <Route path="/locations" element={<LocationsPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/discounts" element={<DiscountsPage />} />
                <Route path="/social-posts" element={<SocialPostsPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/users/:id" element={<UserDetailPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/system" element={<SystemPage />} />
              </Route>

              {/* 其他路由重導向 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SystemStatusProvider>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
