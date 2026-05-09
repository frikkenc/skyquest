import { useState } from 'react'
import styles from './NotifyMeModal.module.css'

interface Props {
  eventName: string
  onClose: () => void
}

const API_KEY = import.meta.env.VITE_BREVO_API_KEY as string
const LIST_ID = Number(import.meta.env.VITE_BREVO_LIST_ID)

export default function NotifyMeModal({ eventName, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')
    setErrorMsg('')
    try {
      const res = await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': API_KEY,
        },
        body: JSON.stringify({
          email,
          listIds: [LIST_ID],
          updateEnabled: true,
          attributes: { SKYQUEST_NOTIFY: eventName },
        }),
      })
      if (res.ok || res.status === 204) {
        setState('done')
      } else {
        const data = await res.json()
        // Brevo returns 400 with code DUPLICATE_PARAMETER if contact exists — treat as success
        if (data?.code === 'DUPLICATE_PARAMETER') {
          setState('done')
        } else {
          setErrorMsg(data?.message ?? 'Something went wrong. Try again.')
          setState('error')
        }
      }
    } catch {
      setErrorMsg('Network error. Check your connection and try again.')
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
