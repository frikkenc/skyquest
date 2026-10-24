/**
 * Event day for live scoring: the event date through the next day (weather
 * spill-over). Dates are YYYY-MM-DD, compared in the visitor's local time.
 */
export function isEventDay(date: string, now = new Date()): boolean {
  if (!date) return false
  const today = now.toLocaleDateString('en-CA')
  const dayAfter = new Date(new Date(date + 'T12:00:00').getTime() + 864e5).toLocaleDateString('en-CA')
  return today >= date && today <= dayAfter
}
