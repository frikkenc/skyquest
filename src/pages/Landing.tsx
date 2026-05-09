import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import EventBadge from '../components/EventBadge'
import StatusPill from '../components/StatusPill'
import { EVENT_INSTANCES, LEADERBOARD_AAA } from '../data/mockData'
import styles from './Landing.module.css'

export default function Landing() {
  const upcoming = EVENT_INSTANCES.slice(0, 6)

  return (
    <>
      <Nav />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={`wrap ${styles.heroInner}`}>
          <img
            src="/logos/skyquest-master.png"
            alt="SoCal SkyQuest"
            className={styles.heroLogo}
          />
          <div>
            <div className={styles.eyebrow}>★ 2026 SEASON · NOW LIVE ★</div>
            <h1 className={styles.h1}>
              One league.<br />
              <span className={styles.red}>Six events.</span><br />
              Every jump counts.
            </h1>
            <p className={styles.tagline}>
              Southern California's formation skydiving league — a season-long points race where serious teams and pickup champs share the same scoreboard. Just sign up to team up.
            </p>
            <div className={styles.ctas}>
              <Link to="/schedule" className="btn btn-primary">See the Schedule</Link>
              <Link to="/leaderboard" className="btn btn-ghost">View Leaderboard</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        {/* Pillars */}
        <div className="grid grid-3" style={{ marginTop: 64 }}>
          <div className={`card ${styles.pillar}`}>
            <h3>One Scoreboard</h3>
            <p>Every event in the season rolls into one ranking. One event or six — it all counts toward year-end glory.</p>
          </div>
          <div className={`card ${styles.pillar}`}>
            <h3>For Everyone</h3>
            <p>Nationals teams, pickup squads, first-timers. Divisions for every level, fun events for every taste.</p>
          </div>
          <div className={`card ${styles.pillar}`}>
            <h3>Swanky Awards</h3>
            <p>Year wraps at the Bombshelter. Costumes encouraged. Most epic fail gets a medal too.</p>
          </div>
        </div>

        {/* Schedule preview */}
        <div className="section-title">2026 Schedule</div>
        <div className="card" style={{ padding: 0 }}>
          {upcoming.map(evt => (
            <div key={evt.id} className={styles.scheduleRow}>
              <EventBadge slug={evt.typeSlug} size={72} />
              <div className={styles.scheduleMeta}>
                <h4>{evt.name}</h4>
                <div className={styles.scheduleSub}>
                  {evt.divisions.join(' · ')}{evt.divisions.length > 0 ? ' · ' : ''}
                  <StatusPill status={evt.status} />
                </div>
              </div>
              <div className={styles.scheduleDate}>
                {formatDate(evt.date)}
              </div>
            </div>
          ))}
        </div>

        {/* Leaderboard preview */}
        <div className="section-title">Top of the Board</div>
        <div className="card" style={{ padding: 0 }}>
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
          <Link to="/schedule" className="btn btn-ghost">Pick an Event</Link>
        </div>
      </div>

      <Footer />
    </>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}
