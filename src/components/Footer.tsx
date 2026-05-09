import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <p>SoCal SkyQuest — A Fury Coaching league. Powered by Fury Registration.</p>
        <p>
          <a href="https://furycoaching.com" target="_blank" rel="noreferrer">furycoaching.com</a>
          {' · '}2026 Season
        </p>
      </div>
    </footer>
  )
}
