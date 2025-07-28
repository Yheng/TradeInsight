import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { ToastContainer } from 'react-toastify'
import { useAuthStore } from '@/stores/authStore'
import { AlertsProvider } from '@/components/alerts/AlertsProvider'
import 'react-toastify/dist/ReactToastify.css'
import Layout from '@/components/common/Layout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import OnboardingPage from '@/pages/OnboardingPage'
import DashboardPage from '@/pages/DashboardPage'
import TradingPage from '@/pages/TradingPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import ChartsPage from '@/pages/ChartsPage'
import AlertsPage from '@/pages/AlertsPage'
import ProfilePage from '@/pages/ProfilePage'
import AdminPage from '@/pages/AdminPage'
import SocialPage from '@/pages/SocialPage'
import LoadingSpinner from '@/components/common/LoadingSpinner'

function App() {
  const { user, isLoading, initializeAuth } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <AlertsProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
        <Route path="/onboarding" element={user ? <OnboardingPage /> : <Navigate to="/login" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="trading" element={<TradingPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="charts" element={<ChartsPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="social" element={<SocialPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
      
      {/* Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="bg-gray-800 text-white"
      />
    </AlertsProvider>
  )
}

export default App