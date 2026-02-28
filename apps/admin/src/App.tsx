import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
// 高頻首屏頁面 - 靜態 import
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { AuthCallbackPage } from './pages/AuthCallbackPage'
import { ProductsPage } from './pages/ProductsPage'
import { OrdersPage } from './pages/OrdersPage'
import { UsersPage } from './pages/UsersPage'
import { SettingsPage } from './pages/SettingsPage'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/errors'
import { ToastProvider } from './components/ui/Toast'
import { SystemStatusProvider } from './components/system/SystemStatusProvider'
import { PageLoader } from './components/PageLoader'
import { Agentation } from 'agentation'
// 低頻頁面 - lazy import（減少 initial bundle，將 recharts 等大型依賴延遲載入）
const FarmToursPage = lazy(() => import('./pages/FarmToursPage').then((m) => ({ default: m.FarmToursPage })))
const SchedulesPage = lazy(() => import('./pages/SchedulesPage').then((m) => ({ default: m.SchedulesPage })))
const LocationsPage = lazy(() => import('./pages/LocationsPage').then((m) => ({ default: m.LocationsPage })))
const PaymentsPage = lazy(() => import('./pages/PaymentsPage').then((m) => ({ default: m.PaymentsPage })))
const DiscountsPage = lazy(() => import('./pages/DiscountsPage').then((m) => ({ default: m.DiscountsPage })))
const SocialPostsPage = lazy(() => import('./pages/SocialPostsPage').then((m) => ({ default: m.SocialPostsPage })))
const UserDetailPage = lazy(() => import('./pages/UserDetailPage').then((m) => ({ default: m.UserDetailPage })))
const SiteImagesPage = lazy(() => import('./pages/SiteImagesPage').then((m) => ({ default: m.SiteImagesPage })))
const SystemPage = lazy(() => import('./pages/SystemPage').then((m) => ({ default: m.SystemPage })))
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))

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
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* 低頻頁面 - lazy loaded */}
                <Route path="/farm-tours" element={<Suspense fallback={<PageLoader />}><FarmToursPage /></Suspense>} />
                <Route path="/schedules" element={<Suspense fallback={<PageLoader />}><SchedulesPage /></Suspense>} />
                <Route path="/locations" element={<Suspense fallback={<PageLoader />}><LocationsPage /></Suspense>} />
                <Route path="/payments" element={<Suspense fallback={<PageLoader />}><PaymentsPage /></Suspense>} />
                <Route path="/discounts" element={<Suspense fallback={<PageLoader />}><DiscountsPage /></Suspense>} />
                <Route path="/social-posts" element={<Suspense fallback={<PageLoader />}><SocialPostsPage /></Suspense>} />
                <Route path="/users/:id" element={<Suspense fallback={<PageLoader />}><UserDetailPage /></Suspense>} />
                <Route path="/reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
                <Route path="/site-images" element={<Suspense fallback={<PageLoader />}><SiteImagesPage /></Suspense>} />
                <Route path="/system" element={<Suspense fallback={<PageLoader />}><SystemPage /></Suspense>} />
              </Route>

              {/* 其他路由重導向 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </SystemStatusProvider>
        </BrowserRouter>
      </ToastProvider>
      {import.meta.env.DEV && <Agentation endpoint="http://localhost:4747" />}
    </ErrorBoundary>
  )
}

export default App
