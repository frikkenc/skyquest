import type { EventStatus } from '../types'

const CONFIG: Record<EventStatus, { label: string; className: string }> = {
  draft:    { label: 'Draft',    className: 'pill pill-done' },
  open:     { label: 'Reg Open', className: 'pill pill-open' },
  closed:   { label: 'Reg Closed', className: 'pill pill-done' },
  complete: { label: 'Complete', className: 'pill pill-done' },
  upcoming: { label: 'Upcoming', className: 'pill pill-upcoming' },
}

export default function StatusPill({ status }: { status: EventStatus }) {
  const { label, className } = CONFIG[status]
  return <span className={className}>{label}</span>
}
