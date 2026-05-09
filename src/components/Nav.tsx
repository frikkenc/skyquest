import { NavLink } from 'react-router-dom'
import styles from './Nav.module.css'

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
          <NavLink to="/events" className={({ isActive }) => isActive ? styles.active : ''}>Events</NavLink>
        </div>
        <a href="https://furycoaching.com" target="_blank" rel="noreferrer" className={styles.cta}>
          Sign Up
        </a>
      </div>
    </nav>
  )
}
