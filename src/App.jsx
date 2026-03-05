import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import WelcomePage from './pages/WelcomePage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import OperationsPage from './pages/OperationsPage'
import InventoryPage from './pages/InventoryPage'
import ScanPage from './pages/ScanPage'

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        setShowWelcome(true)
        setTimeout(() => setShowWelcome(false), 3000)
      }
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    )
  }

  if (showWelcome && user) {
    return <WelcomePage user={user} onDone={() => setShowWelcome(false)} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute user={user}>
            <Layout user={user} />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientDetailPage />} />
          <Route path="operations" element={<OperationsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="scan" element={<ScanPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
