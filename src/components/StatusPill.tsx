import type { EventInstance, EventStatus } from '../types'

const CONFIG: Record<EventStatus, { label: string; className: string }> = {
  draft:          { label: 'Draft',          className: 'pill pill-done' },
  open:           { label: 'Reg Open',       className: 'pill pill-open' },
  closed:         { label: 'Reg Closed',     className: 'pill pill-done' },
  complete:       { label: 'Complete',       className: 'pill pill-done' },
  upcoming:       { label: 'Upcoming',       className: 'pill pill-upcoming' },
  'season-finale': { label: 'Season Finale', className: 'pill pill-awards' },
}

interface Props {
  status: EventStatus
  /**
   * Optional event context. When provided, lets the pill detect "open but
   * registers via an external system" (e.g., Poker Run's Facebook event) and
   * render "Event Info" instead of the misleading green "Reg Open" badge.
   */
  evt?: Pick<EventInstance, 'registrationLabel'>
}

export default function StatusPill({ status, evt }: Props) {
  // Special case: status='open' but registration is external (FB event,
  // partner system, etc.) — the custom registrationLabel signals this.
  // Use an upcoming-style pill so it doesn't promise a normal reg flow.
  if (status === 'open' && evt?.registrationLabel && evt.registrationLabel !== 'Sign Up') {
    return <span className="pill pill-upcoming">{evt.registrationLabel}</span>
  }
  const { label, className } = CONFIG[status]
  return <span className={className}>{label}</span>
}
