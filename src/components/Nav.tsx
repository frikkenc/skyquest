import { NavLink } from 'react-router-dom'
import styles from './Nav.module.css'

// Top-nav CTA always points at the register hub — let the user pick the event there.
// Avoids the trap where a stale "next open event" URL goes dead or to the wrong meet.
// NOTE: must be `register.furycoaching.com`. The legacy `registration.furycoaching.com`
// host does NOT resolve (NXDOMAIN) — was the original "dead SIGN UP" bug.
const REGISTER_URL = 'https://register.furycoaching.com/'

export default function Nav() {
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
        <a
          href={REGISTER_URL}
          target="_blank"
          rel="noreferrer"
          className={styles.cta}
        >
          Sign Up
        </a>
      </div>
    </nav>
  )
}
