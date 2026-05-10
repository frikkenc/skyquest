import { Link } from 'react-router-dom'
import { useFurySession } from '../../hooks/useFuryData'
import { EVENT_INSTANCES } from '../../data/mockData'
import styles from './AdminEventInstance.module.css'

export default function AdminFuryIdentity() {
  const { data: session, isLoading, isError, error, refetch } = useFurySession()

  const linkedEvents = EVENT_INSTANCES.filter(e => e.furyEventId?.startsWith('evt-'))

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ fontFamily: 'Bungee, sans-serif', fontStyle: 'italic', fontSize: 22, color: 'var(--adm-ink)', marginBottom: 4 }}>
        Fury Identity
      </div>
      <p style={{ fontSize: 13, color: 'var(--adm-mute)', marginBottom: 28 }}>
        SkyQuest admin panel connects to the Fury Registration API using Firebase auth.
        Registration data is fetched live from Fury for linked events.
      </p>

      {/* API connection card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontFamily: 'Bungee, sans-serif', fontStyle: 'italic', fontSize: 14, color: 'var(--adm-ink)' }}>
            API Connection
          </span>
          {isLoading && <span style={{ fontSize: 11, color: 'var(--adm-mute)' }}>Checking…</span>}
          {session?.authenticated && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sq-signal)', background: 'rgba(76,175,80,.12)', border: '1px solid rgba(76,175,80,.3)', borderRadius: 99, padding: '2px 10px' }}>
              ● Connected
            </span>
          )}
          {isError && (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sq-red)', background: 'rgba(216,24,24,.12)', border: '1px solid rgba(216,24,24,.3)', borderRadius: 99, padding: '2px 10px' }}>
              ✕ Error
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 13 }}>
          <span style={{ color: 'var(--adm-mute)' }}>API URL</span>
          <code style={{ color: 'var(--adm-ink)', fontSize: 12, background: 'rgba(255,255,255,.04)', padding: '2px 6px', borderRadius: 4 }}>
            {import.meta.env.VITE_FURY_API_URL || '(not set — add VITE_FURY_API_URL to .env.local)'}
          </code>

          {session && <>
            <span style={{ color: 'var(--adm-mute)' }}>Firebase UID</span>
            <code style={{ color: 'var(--adm-ink)', fontSize: 12 }}>{session.uid}</code>

            <span style={{ color: 'var(--adm-mute)' }}>Admin access</span>
            <span style={{ color: session.admin ? 'var(--sq-signal)' : 'var(--sq-red)' }}>
              {session.admin ? '✓ Yes' : '✕ No'}
            </span>
          </>}

          {isError && <>
            <span style={{ color: 'var(--adm-mute)' }}>Error</span>
            <span style={{ color: 'var(--sq-red)', fontSize: 12 }}>
              {error instanceof Error ? error.message : 'Unknown error'}
            </span>
          </>}
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            className={styles.adminBtn}
            onClick={() => refetch()}
            style={{ fontSize: 12 }}
          >
            ↻ Re-check connection
          </button>
        </div>
      </div>

      {/* Linked events */}
      <div style={{ fontFamily: 'Bungee, sans-serif', fontStyle: 'italic', fontSize: 14, color: 'var(--adm-ink)', marginBottom: 10 }}>
        Linked Events
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Event', 'Fury Event ID', 'Status', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, color: 'var(--adm-mute)', fontFamily: 'Bungee, sans-serif', fontStyle: 'italic', borderBottom: '1px solid var(--adm-border)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linkedEvents.map(evt => (
              <tr key={evt.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--adm-ink)' }}>
                  {evt.name}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <code style={{ fontSize: 11, color: '#64b5f6', background: 'rgba(100,181,246,.08)', padding: '2px 6px', borderRadius: 4 }}>
                    {evt.furyEventId}
                  </code>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: evt.status === 'open' ? 'var(--sq-signal)' : evt.status === 'complete' ? 'var(--adm-mute)' : 'var(--sq-yellow)' }}>
                    {evt.status}
                  </span>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <Link
                    to={`/admin/events/${evt.typeSlug}/${evt.id}`}
                    style={{ fontSize: 12, color: 'var(--sq-red)' }}
                  >
                    View →
                  </Link>
                </td>
              </tr>
            ))}
            {linkedEvents.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--adm-mute)', fontSize: 13 }}>
                  No events linked to Fury yet — set a <code>furyEventId</code> starting with <code>evt-</code> on any event.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 12, color: 'var(--adm-mute)', marginTop: 16 }}>
        Events with a Fury Event ID show live registrations from the Fury API in their Registrations tab.
        Events without one fall back to manually-entered data.
      </p>
    </div>
  )
}
