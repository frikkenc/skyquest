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
        {/* Legal text is single-sourced on furycoaching.com — link, don't duplicate. */}
        <p>
          Skydiving is dangerous — participation is governed by waivers signed at registration and
          at the dropzone.{' '}
          <a href="https://furycoaching.com/disclaimer/" target="_blank" rel="noreferrer">Safety Disclaimer</a>
          {' · '}
          <a href="https://furycoaching.com/privacy-policy/" target="_blank" rel="noreferrer">Privacy</a>
        </p>
      </div>
    </footer>
  )
}
