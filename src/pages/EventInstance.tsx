import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import EventBadge from '../components/EventBadge'
import StatusPill from '../components/StatusPill'
import NotifyMeModal from '../components/NotifyMeModal'
import { EVENT_INSTANCES, EVENT_TYPES, SCSL_RESULTS } from '../data/mockData'
import type { Division } from '../types'
import styles from './EventInstance.module.css'

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function EventInstance() {
  const { typeSlug, instanceId } = useParams<{ typeSlug: string; instanceId: string }>()
  const event = EVENT_INSTANCES.find(e => e.id === instanceId)
  const eventType = event ? EVENT_TYPES.find(t => t.slug === event.typeSlug) : null
  const [activeDivision, setActiveDivision] = useState<Division>('AA')
  const [notifyOpen, setNotifyOpen] = useState(false)

  if (!event || !eventType) {
    return (
      <>
        <Nav />
        <div className="wrap" style={{ paddingTop: 80, textAlign: 'center', color: 'var(--sq-gray)' }}>
          Event not found.
        </div>
        <Footer />
      </>
    )
  }

  const isComplete = event.status === 'complete'
  const isOpen = event.status === 'open' && !!event.furyRegistrationUrl
  const isManualOpen = event.status === 'open' && !event.furyRegistrationUrl
  const isUpcoming = event.status === 'upcoming'
  const isFinale = event.status === 'season-finale'

  const results = SCSL_RESULTS.filter(r => r.division === activeDivision)
  const rounds = results[0]?.roundScores.length ?? 8

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className={styles.crumbs}>
          <Link to="/schedule">Schedule</Link> / {event.name}
        </div>
      </div>

      {/* Hero */}
      <section className={styles.instanceHero}>
        <div className={`wrap ${styles.heroInner}`}>
          <EventBadge slug={event.typeSlug} size={110} />
          <div style={{ flex: 1 }}>
            <StatusPill status={event.status} />
            <h1 className={styles.title}>{event.name}</h1>
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Date</div>
                <div className={styles.metaVal}>{formatDate(event.date)}</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Location</div>
                <div className={styles.metaVal}>{event.dropzone}</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Format</div>
                <div className={styles.metaVal}>{eventType.format}</div>
              </div>
              {event.divisions.length > 0 && (
                <div className={styles.metaItem}>
                  <div className={styles.metaLabel}>Divisions</div>
                  <div className={styles.metaVal}>{event.divisions.join(' · ')}</div>
                </div>
              )}
            </div>
          </div>

          {/* CTA in hero */}
          <div className={styles.heroCta}>
            {isOpen && (
              <a href={event.furyRegistrationUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                {event.registrationLabel ?? 'Sign Up'}
              </a>
            )}
            {isManualOpen && event.contactEmail && (
              <a href={`mailto:${event.contactEmail}`} className="btn btn-primary">
                Email to Register
              </a>
            )}
            {(isUpcoming || (isManualOpen && !event.contactEmail)) && (
              <button className="btn btn-ghost" onClick={() => setNotifyOpen(true)}>
                Notify Me When Reg Opens
              </button>
            )}
            {isComplete && (
              <span style={{ color: 'var(--sq-gray)', fontSize: 14 }}>This event is complete.</span>
            )}
            {isFinale && (
              <span className="pill pill-awards" style={{ fontSize: 13, padding: '8px 16px' }}>Season Finale</span>
            )}
          </div>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>

        {/* About section */}
        <div className={styles.aboutGrid}>
          <div className={styles.aboutMain}>
            {event.oneLiner && (
              <p className={styles.oneLiner}>{event.oneLiner}</p>
            )}
            <p className={styles.longDesc}>{eventType.longDescription}</p>
          </div>

          <div className={styles.aboutSide}>
            <div className="card">
              <div className={styles.sideTitle}>Event Details</div>
              <dl className={styles.detailList}>
                <dt>Date</dt>
                <dd>{formatDate(event.date)}</dd>
                <dt>Location</dt>
                <dd>{event.dropzone}</dd>
                <dt>Format</dt>
                <dd>{eventType.format}</dd>
                {event.divisions.length > 0 && (
                  <>
                    <dt>Divisions</dt>
                    <dd>{event.divisions.join(', ')}</dd>
                  </>
                )}
              </dl>

              {isOpen && (
                <a href={event.furyRegistrationUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
                  {event.registrationLabel ?? 'Sign Up'}
                </a>
              )}
              {isManualOpen && event.contactEmail && (
                <a href={`mailto:${event.contactEmail}`} className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
                  Email to Register
                </a>
              )}
              {(isUpcoming || (isManualOpen && !event.contactEmail)) && (
                <button className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }} onClick={() => setNotifyOpen(true)}>
                  Notify Me When Reg Opens
                </button>
              )}
            </div>

            {/* Just Sign Up to Team Up */}
            {(isOpen || isManualOpen || isUpcoming) && event.typeSlug !== 'awards' && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className={styles.sideTitle}>Just Sign Up to Team Up</div>
                <p style={{ color: '#cfcfcf', fontSize: 14, lineHeight: 1.6 }}>
                  No pre-formed team required. Register solo and we'll be in touch to sort your team. Register sooner for better chances.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results — only for complete events */}
        {isComplete && (
          <>
            <div className="section-title" style={{ marginTop: 48 }}>Results</div>

            <div className={styles.divTabs}>
              {(event.divisions.length > 0 ? event.divisions : ['AA', 'AAA', 'A', 'Rookie'] as Division[]).map(div => (
                <button
                  key={div}
                  className={`${styles.tab} ${activeDivision === div ? styles.tabActive : ''}`}
                  onClick={() => setActiveDivision(div)}
                >
                  {div}
                </button>
              ))}
            </div>

            {results.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--sq-gray)', padding: 48 }}>
                Results not yet available for {activeDivision}.
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="lb" style={{ minWidth: 600 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 52 }}>#</th>
                      <th>Team</th>
                      {Array.from({ length: rounds }, (_, i) => (
                        <th key={i} style={{ textAlign: 'center', width: 48 }}>R{i + 1}</th>
                      ))}
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(result => (
                      <tr key={result.teamId}>
                        <td className={`rank ${result.rank <= 3 ? `rank-${result.rank}` : ''}`}>{result.rank}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{result.teamName}</div>
                          <div style={{ color: 'var(--sq-gray)', fontSize: 12, marginTop: 2 }}>
                            {result.members.map(m => m.name).join(' · ')}
                          </div>
                        </td>
                        {result.roundScores.map((s, i) => (
                          <td key={i} style={{ textAlign: 'center', color: 'var(--sq-gray)', fontSize: 13 }}>{s}</td>
                        ))}
                        <td className="pts">{result.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      {notifyOpen && (
        <NotifyMeModal eventName={event.name} onClose={() => setNotifyOpen(false)} />
      )}
    </>
  )
}
