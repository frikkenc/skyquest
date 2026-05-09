import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import EventBadge from '../components/EventBadge'
import StatusPill from '../components/StatusPill'
import { EVENT_INSTANCES, EVENT_TYPES } from '../data/mockData'
import type { EventInstance } from '../types'
import styles from './Schedule.module.css'

function getMonthLabel(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

function getEventDescription(evt: EventInstance) {
  const type = EVENT_TYPES.find(t => t.slug === evt.typeSlug)
  return type?.description ?? ''
}

export default function Schedule() {
  // Group events by month
  const grouped: { month: string; events: EventInstance[] }[] = []
  EVENT_INSTANCES.forEach(evt => {
    const month = getMonthLabel(evt.date)
    const existing = grouped.find(g => g.month === month)
    if (existing) existing.events.push(evt)
    else grouped.push({ month, events: [evt] })
  })

  return (
    <>
      <Nav />
      <div className="wrap" style={{ paddingTop: 48 }}>
        <h1 className="display" style={{ fontSize: 46 }}>2026 Season Schedule</h1>
        <p style={{ color: 'var(--sq-gray)', marginTop: 8, maxWidth: 680, lineHeight: 1.6 }}>
          Seven events. Two dropzones. One scoreboard. Sign up for one, sign up for all — every result rolls up to the season leaderboard.
        </p>

        {grouped.map(group => (
          <div key={group.month}>
            <div className={styles.monthTitle}>★ {group.month}</div>
            {group.events.map(evt => (
              <div
                key={evt.id}
                className={`card ${styles.eventCard}`}
                style={{
                  opacity: evt.status === 'complete' ? 0.75 : 1,
                  borderColor: evt.typeSlug === 'awards' ? 'var(--sq-yellow)' : undefined,
                }}
              >
                <EventBadge slug={evt.typeSlug} size={90} />
                <div className={styles.eventMeta}>
                  <h3>{evt.name}</h3>
                  <div className={styles.sub}>
                    {getEventDescription(evt)} · <StatusPill status={evt.status} />
                  </div>
                </div>
                <div className={styles.eventActions}>
                  <div className={styles.date}>{formatDate(evt.date)}</div>
                  <div className={styles.dz}>{evt.dropzone}</div>
                  {evt.status === 'complete' ? (
                    <Link to={`/events/${evt.typeSlug}/${evt.id}`} className="btn btn-ghost btn-sm">Results</Link>
                  ) : evt.status === 'open' ? (
                    <a href="https://furycoaching.com" target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">Sign Up</a>
                  ) : (
                    <button className="btn btn-ghost btn-sm" disabled style={{ opacity: 0.5, cursor: 'default' }}>Notify Me</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <Footer />
    </>
  )
}
