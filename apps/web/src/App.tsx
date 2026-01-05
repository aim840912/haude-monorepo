import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './components/ui/feedback/toast'

// Pages
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { HomePage } from './pages/HomePage'
import { ProductsPage } from './pages/ProductsPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { PaymentResultPage } from './pages/PaymentResultPage'
import { CartPage } from './pages/CartPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { FarmToursPage } from './pages/FarmToursPage'
import { FarmTourDetailPage } from './pages/FarmTourDetailPage'
import { LocationsPage } from './pages/LocationsPage'
import { LocationDetailPage } from './pages/LocationDetailPage'
import { SchedulePage } from './pages/SchedulePage'
import { SearchPage } from './pages/SearchPage'
import { AdminProductsPage } from './pages/AdminProductsPage'
import { AdminProductCreatePage } from './pages/AdminProductCreatePage'
import { AdminProductEditPage } from './pages/AdminProductEditPage'
import { AdminSchedulesPage } from './pages/AdminSchedulesPage'
import { AdminScheduleCreatePage } from './pages/AdminScheduleCreatePage'
import { AdminScheduleEditPage } from './pages/AdminScheduleEditPage'
import { AdminLocationsPage } from './pages/AdminLocationsPage'
import { AdminLocationCreatePage } from './pages/AdminLocationCreatePage'
import { AdminLocationEditPage } from './pages/AdminLocationEditPage'

// Components
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Header } from './components/layouts/common/Header'
import { Footer } from './components/layouts/common/Footer'

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-tea"></div>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <ToastProvider>
      <BrowserRouter>
      <Header />
      <main className="pt-[var(--header-height)]">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/farm-tours" element={<FarmToursPage />} />
        <Route path="/farm-tours/:id" element={<FarmTourDetailPage />} />
        <Route path="/locations" element={<LocationsPage />} />
        <Route path="/locations/:id" element={<LocationDetailPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/search" element={<SearchPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/orders" element={<OrdersPage />} />
          </Route>
          {/* 結帳和訂單頁面（不使用 Layout，有自己的返回導航） */}
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/orders/:id/payment-result" element={<PaymentResultPage />} />
          {/* Admin routes */}
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/products/create" element={<AdminProductCreatePage />} />
          <Route path="/admin/products/:id/edit" element={<AdminProductEditPage />} />
          <Route path="/admin/schedules" element={<AdminSchedulesPage />} />
          <Route path="/admin/schedules/create" element={<AdminScheduleCreatePage />} />
          <Route path="/admin/schedules/:id/edit" element={<AdminScheduleEditPage />} />
          <Route path="/admin/locations" element={<AdminLocationsPage />} />
          <Route path="/admin/locations/create" element={<AdminLocationCreatePage />} />
          <Route path="/admin/locations/:id/edit" element={<AdminLocationEditPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </main>
      <Footer />
      </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
