import { Link } from 'react-router-dom'
import type { EventInstance } from '../types'

interface Props {
  evt: EventInstance
  onNotifyMe: (name: string) => void
  /** Use compact (btn-sm) styling. Defaults to true for list views. */
  small?: boolean
}

/**
 * Single source of truth for what action button an event card / row shows.
 *
 *   complete         → Results (internal link)
 *   season-finale    → Season Finale pill (no action)
 *   open + url       → Sign Up (or custom registrationLabel) — external deep-link
 *   open + no url    → Learn More (internal link)
 *   upcoming / other → Notify Me (opens email-capture modal)
 */
export default function EventCTA({ evt, onNotifyMe, small = true }: Props) {
  const sz = small ? 'btn-sm' : ''

  if (evt.status === 'complete') {
    return (
      <Link to={`/events/${evt.typeSlug}/${evt.id}`} className={`btn btn-ghost ${sz}`}>
        Results
      </Link>
    )
  }
  if (evt.status === 'season-finale') {
    return (
      <span className="pill pill-awards" style={{ fontSize: small ? 11 : 13, padding: small ? '6px 12px' : '8px 16px' }}>
        Season Finale
      </span>
    )
  }
  if (evt.status === 'open' && evt.furyRegistrationUrl) {
    return (
      <a href={evt.furyRegistrationUrl} target="_blank" rel="noreferrer" className={`btn btn-primary ${sz}`}>
        {evt.registrationLabel ?? 'Sign Up'}
      </a>
    )
  }
  if (evt.status === 'open') {
    return (
      <Link to={`/events/${evt.typeSlug}/${evt.id}`} className={`btn btn-ghost ${sz}`}>
        Learn More
      </Link>
    )
  }
  // upcoming (or anything else that's not registrable yet)
  return (
    <button className={`btn btn-ghost ${sz}`} onClick={() => onNotifyMe(evt.name)}>
      Notify Me
    </button>
  )
}
