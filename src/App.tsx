import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Landing from './pages/Landing'
import Schedule from './pages/Schedule'
import Leaderboard from './pages/Leaderboard'
import EventInstance from './pages/EventInstance'
import AdminLayout from './layouts/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminEventType from './pages/admin/AdminEventType'
import AdminEventInstance from './pages/admin/AdminEventInstance'
import AdminEmailTemplates from './pages/admin/AdminEmailTemplates'
import AdminSeasons from './pages/admin/AdminSeasons'
import AdminFuryIdentity from './pages/admin/AdminFuryIdentity'
import AdminCrazy8Cards from './pages/admin/AdminCrazy8Cards'
import AdminLogin from './pages/admin/AdminLogin'
import PrintPage from './pages/PrintPage' 
import CheckInPage from './pages/CheckInPage'
import ProtectedRoute from './components/ProtectedRoute'

function KeyedAdminEventType() {
  const { typeSlug } = useParams()
  return <AdminEventType key={typeSlug} />
}

function KeyedAdminEventInstance() {
  const { typeSlug, instanceId } = useParams()
  return <AdminEventInstance key={`${typeSlug}-${instanceId}`} />
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/events/:typeSlug/:instanceId" element={<EventInstance />} />
          <Route path="/events/:typeSlug" element={<Schedule />} />
          <Route path="/events" element={<Schedule />} />

          {/* Admin login — unprotected */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin — protected */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="events/crazy8s/cards" element={<AdminCrazy8Cards />} />
            <Route path="events/:typeSlug" element={<KeyedAdminEventType />} />
            <Route path="events/:typeSlug/:instanceId" element={<KeyedAdminEventInstance />} />
            <Route path="emails" element={<AdminEmailTemplates />} />
            <Route path="seasons" element={<AdminSeasons />} />
            <Route path="config/identity" element={<AdminFuryIdentity />} />
            <Route path="*" element={<AdminPlaceholder />} />
          </Route>

          {/* Standalone print views — no admin chrome */}
          <Route path="/print/:instanceId/:type" element={<PrintPage />} />
          {/* Day-of check-in — public, no auth */}
          <Route path="/checkin/:instanceId" element={<CheckInPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

function AdminPlaceholder() {
  return (
    <div style={{ padding: 48, color: 'var(--adm-mute)', fontFamily: 'Inter, sans-serif' }}>
      <p style={{ fontSize: 24, fontFamily: 'Bungee, sans-serif', color: 'var(--adm-ink)' }}>Coming in Phase 2</p>
      <p style={{ marginTop: 12 }}>This section is under construction.</p>
    </div>
  )
}

function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#0a0a0a', color: '#fff' }}>
      <div style={{ fontFamily: 'Bungee, sans-serif', fontSize: 80, color: '#D81818' }}>404</div>
      <div style={{ fontFamily: 'Bungee, sans-serif', fontSize: 24 }}>Page not found.</div>
      <a href="/" style={{ color: '#D81818', fontWeight: 700 }}>← Back to Home</a>
    </div>
  )
}
