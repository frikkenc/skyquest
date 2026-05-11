import { NavLink } from 'react-router-dom'
import { EVENT_INSTANCES } from '../data/mockData'
import styles from './Nav.module.css'

/**
 * Find the soonest currently-open event that has a registration URL,
 * so the header CTA always points at something actionable.
 *
 * Prefers events with the standard "Sign Up" label (i.e., wired into Fury Registration)
 * so the button text matches the destination. Falls back to any open event with a URL.
 */
function findNextOpenRegistration() {
  const open = EVENT_INSTANCES
    .filter(e => e.status === 'open' && !!e.furyRegistrationUrl)
    .sort((a, b) => a.date.localeCompare(b.date))
  // Prefer the standard Sign Up flow first; fall back to any open with a URL.
  const standardSignUp = open.find(e => !e.registrationLabel || e.registrationLabel === 'Sign Up')
  return standardSignUp ?? open[0]
}

export default function Nav() {
  const next = findNextOpenRegistration()

  return (
    <nav className={styles.nav}>
      <div className={`wrap ${styles.inner}`}>
        <NavLink to="/" className={styles.brand}>
          <img src="/logos/skyquest-master.png" alt="SoCal SkyQuest" className={styles.logo} />
        </NavLink>
        <div className={styles.links}>
          <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : ''}>Home</NavLink>
          <NavLink to="/schedule" className={({ isActive }) => isActive ? styles.active : ''}>Schedule</NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => isActive ? styles.active : ''}>Leaderboard</NavLink>
        </div>
        {next ? (
          <a
            href={next.furyRegistrationUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.cta}
            title={`Register: ${next.name}`}
          >
            {next.registrationLabel ?? 'Sign Up'}
          </a>
        ) : (
          <NavLink to="/schedule" className={styles.cta}>Sign Up</NavLink>
        )}
      </div>
    </nav>
  )
}
