import { useParams, Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import EventBadge from '../components/EventBadge'
import StatusPill from '../components/StatusPill'
import { EVENT_INSTANCES, SCSL_RESULTS } from '../data/mockData'
import type { Division } from '../types'
import { useState } from 'react'
import styles from './EventInstance.module.css'

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
}

export default function EventInstance() {
  const { typeSlug, instanceId } = useParams<{ typeSlug: string; instanceId: string }>()
  const event = EVENT_INSTANCES.find(e => e.id === instanceId)
  const [activeDivision, setActiveDivision] = useState<Division>('AA')

  if (!event) {
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

  const results = SCSL_RESULTS.filter(r => r.division === activeDivision)
  const rounds = results[0]?.roundScores.length ?? 8

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className={styles.crumbs}>
          <Link to="/schedule">Schedule</Link> / <Link to={`/events/${typeSlug}`}>{event.typeSlug.toUpperCase()}</Link> / {event.name}
        </div>
      </div>

      <section className={styles.instanceHero}>
        <div className={`wrap ${styles.heroInner}`}>
          <EventBadge slug={event.typeSlug} size={100} />
          <div>
            <StatusPill status={event.status} />
            <h1 className={styles.title}>{event.name}</h1>
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Date</div>
                <div className={styles.metaVal}>{formatDate(event.date)}</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Dropzone</div>
                <div className={styles.metaVal}>{event.dropzone.toUpperCase()}</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Format</div>
                <div className={styles.metaVal}>4-WAY · 8 ROUNDS</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Teams</div>
                <div className={styles.metaVal}>{event.registrationCount}</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Jumpers</div>
                <div className={styles.metaVal}>{event.registrationCount * 4}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {/* Division tabs */}
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
      </div>
      <Footer />
    </>
  )
}
