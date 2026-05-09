import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="wrap">
        <p>SoCal SkyQuest — A Fury Coaching league. Powered by Fury Registration.</p>
        <p>
          <a href="https://furycoaching.com" target="_blank" rel="noreferrer">furycoaching.com</a>
          {' · '}
          <a href="https://instagram.com/furycoaching" target="_blank" rel="noreferrer">@furycoaching</a>
          {' · '}
          <a href="https://www.facebook.com/furycoaching" target="_blank" rel="noreferrer">Facebook</a>
          {' · '}
          <a href="mailto:christy@furycoaching.com">christy@furycoaching.com</a>
        </p>
        <p style={{ marginTop: 4 }}>2026 Season</p>
      </div>
    </footer>
  )
}
