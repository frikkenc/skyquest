import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="events/:typeSlug" element={<AdminEventType />} />
            <Route path="events/:typeSlug/:instanceId" element={<AdminEventInstance />} />
            <Route path="emails" element={<AdminEmailTemplates />} />
            <Route path="*" element={<AdminPlaceholder />} />
          </Route>

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
