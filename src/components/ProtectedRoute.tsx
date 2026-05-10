import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ minHeight: '100vh', background: '#0d0d0d' }} />
  if (!user) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}
