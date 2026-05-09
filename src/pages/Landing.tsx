import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import EventBadge from '../components/EventBadge'
import StatusPill from '../components/StatusPill'
import { EVENT_INSTANCES, LEADERBOARD_AAA } from '../data/mockData'
import styles from './Landing.module.css'

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

export default function Landing() {
  return (
    <>
      <Nav />

      {/* Season header — compact identity strip */}
      <section className={styles.seasonHeader}>
        <div className={`wrap ${styles.seasonHeaderInner}`}>
          <img
            src="/logos/skyquest-master.png"
            alt="SoCal SkyQuest"
            className={styles.seasonLogo}
          />
          <div className={styles.seasonText}>
            <div className={styles.eyebrow}>★ 2026 SEASON · NOW LIVE ★</div>
            <h1 className={styles.h1}>
              One league. <span className={styles.red}>Seven events.</span> Every jump counts.
            </h1>
            <p className={styles.tagline}>
              Southern California's formation skydiving league. Sign up solo — we build your team.
            </p>
          </div>
        </div>
      </section>

      <div className="wrap">
        {/* Event tiles — the whole point of the page */}
        <div className={styles.sectionLabel}>2026 Events</div>
        <div className={styles.eventGrid}>
          {EVENT_INSTANCES.map(evt => (
            <Link
              key={evt.id}
              to={`/events/${evt.typeSlug}/${evt.id}`}
              className={styles.eventTile}
              style={{
                borderColor: evt.status === 'season-finale' ? 'var(--sq-yellow)' : undefined,
                opacity: evt.status === 'complete' ? 0.72 : 1,
              }}
            >
              <div className={styles.tileBadge}>
                <EventBadge slug={evt.typeSlug} size={56} />
              </div>
              <div className={styles.tileName}>{evt.name}</div>
              <div className={styles.tileMeta}>
                {formatDate(evt.date)} · {evt.dropzone}
              </div>
              {evt.shortTagline && (
                <div className={styles.tileTagline}>{evt.shortTagline}</div>
              )}
              <div className={styles.tileFooter}>
                <StatusPill status={evt.status} />
                {evt.status === 'open' && evt.furyRegistrationUrl && (
                  <span
                    className="btn btn-primary btn-sm"
                    onClick={e => { e.preventDefault(); window.open(evt.furyRegistrationUrl, '_blank') }}
                  >
                    {evt.registrationLabel ?? 'Sign Up'}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* League at a glance */}
        <div className={styles.sectionLabel}>How It Works</div>
        <div className="grid grid-3">
          <div className="card">
            <h3 className={styles.pillarTitle}>Just Sign Up to Team Up</h3>
            <p className={styles.pillarBody}>No pre-formed team needed. Register solo, answer a short questionnaire, and we match you with a balanced team before meet day.</p>
          </div>
          <div className="card">
            <h3 className={styles.pillarTitle}>One Scoreboard All Season</h3>
            <p className={styles.pillarBody}>Every event rolls into one ranking. Fly one meet or six — it all counts. We drop your lowest score, so a bad day doesn't end your run.</p>
          </div>
          <div className="card">
            <h3 className={styles.pillarTitle}>Swanky Year-End Awards</h3>
            <p className={styles.pillarBody}>Season closes at the Bombshelter. Divisional medals, most epic fail award, best costume. Free and open to all.</p>
          </div>
        </div>

        {/* Leaderboard preview */}
        <div className={styles.sectionLabel}>Top of the Board</div>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '10px 16px 0', color: 'var(--sq-gray)', fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Through 2 of 6 scoring events · AAA
          </div>
          <table className="lb">
            <thead>
              <tr><th>#</th><th>Team</th><th>Events</th><th>Pts</th></tr>
            </thead>
            <tbody>
              {LEADERBOARD_AAA.slice(0, 5).map(entry => (
                <tr key={entry.teamId}>
                  <td className={`rank ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}>{entry.rank}</td>
                  <td>{entry.teamName}</td>
                  <td>{entry.eventsAttended.length}</td>
                  <td className="pts">{entry.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Link to="/leaderboard" className="btn btn-ghost btn-sm">Full Leaderboard</Link>
          </div>
        </div>
      </div>

      {/* Stripe CTA */}
      <div className={styles.stripe}>
        <div className={`wrap ${styles.stripeInner}`}>
          <h2>Just Sign Up to Team Up.</h2>
          <Link to="/schedule" className="btn btn-ghost">See All Events</Link>
        </div>
      </div>

      <Footer />
    </>
  )
}
