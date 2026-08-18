import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import styles from './NotifyMeModal.module.css'

interface Props {
  eventName: string
  onClose: () => void
}

// Signup goes through the notifySignup Cloud Function, which holds the Brevo
// key server-side. Calling Brevo directly from here shipped the API key in the
// public bundle, and Brevo disables keys it detects as exposed — that was the
// "auth error" every visitor hit.
const notifySignup = httpsCallable<{ email: string; eventName: string }, { ok: boolean }>(
  functions,
  'notifySignup',
)

export default function NotifyMeModal({ eventName, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')
    try {
      await notifySignup({ email, eventName })
      setState('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setErrorMsg(msg || 'Something went wrong. Try again.')
      setState('error')
    }
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.modal}>
        <button className={styles.close} onClick={onClose} aria-label="Close">✕</button>

        {state === 'done' ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <h3>You're on the list.</h3>
            <p>We'll email you when registration opens for {eventName}.</p>
            <button className="btn btn-primary" onClick={onClose}>Got it</button>
          </div>
        ) : (
          <>
            <h3 className={styles.title}>Notify me when reg opens</h3>
            <p className={styles.sub}>{eventName}</p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                type="email"
                className={styles.input}
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                disabled={state === 'loading'}
              />
              {state === 'error' && <p className={styles.error}>{errorMsg}</p>}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={state === 'loading'}
                style={{ width: '100%' }}
              >
                {state === 'loading' ? 'Signing up…' : 'Notify Me'}
              </button>
            </form>
            <p className={styles.fine}>No spam. Just one email when registration opens.</p>
          </>
        )}
      </div>
    </div>
  )
}
