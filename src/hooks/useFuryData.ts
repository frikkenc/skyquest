import { useQuery, useQueries } from '@tanstack/react-query'
import {
  fetchFurySession, fetchFuryRegistrations, fetchFuryRegistrationPayments,
  fetchFuryEventList, fetchFuryPublicEventList, fetchFuryMoneySummary, fetchFuryOfferingStats,
  type FuryPayment,
} from '../lib/furyClient'

/**
 * Shared options for Fury API queries.
 *
 * `networkMode: 'always'` — React Query v5 defaults to `'online'`, which pauses
 *   queries when it thinks the browser is offline. A 401 from `furyGet` (auth
 *   bad / expired token) was being treated as a transient signal: the query
 *   would loop forever between `fetchStatus: 'fetching'` and `'paused'`,
 *   `failureCount` reset each cycle, `status` stayed `'pending'`, and `isError`
 *   never became `true`. The Registrations tab then fell through to the success
 *   branch and rendered "0 registrants · live from Fury" — hiding the real
 *   problem (or, on first paint, briefly flashing "Could not load Fury
 *   registrations" before pausing into the silent loop). Forcing 'always' means
 *   failures count, retries finish, and we land in a real error state.
 *
 * `retry: false` — 401 / 403 are not transient. Retrying just delays the
 *   error banner; the user needs the failure surfaced immediately so they can
 *   re-sign-in or fix the API URL. (We pulled `retry: 1` for the same reason.)
 */
const FURY_QUERY_OPTS = {
  networkMode: 'always' as const,
  retry: false as const,
}

export function useFurySession() {
  return useQuery({
    queryKey: ['fury', 'session'],
    queryFn: fetchFurySession,
    staleTime: 5 * 60_000,
    ...FURY_QUERY_OPTS,
  })
}

export function useFuryRegistrations(furyEventId: string | undefined) {
  return useQuery({
    queryKey: ['fury', 'registrations', furyEventId],
    queryFn: () => fetchFuryRegistrations(furyEventId!),
    enabled: !!furyEventId,
    staleTime: 2 * 60_000,
    ...FURY_QUERY_OPTS,
  })
}

/**
 * Payments for a set of registrations, keyed by registration id.
 *
 * Fury has no bulk payments endpoint — it's one request per registration, so a
 * 60-person meet is 60 requests. Only call this from a surface that genuinely
 * needs "how did they pay" (the check-in sheet); everywhere else works off
 * `balance` alone. Each id is its own cache entry, so re-renders and repeat
 * visits are free, and a registration added later only fetches itself.
 *
 * A registration whose fetch fails maps to `undefined` rather than `[]` so
 * callers can tell "no payments recorded" apart from "we couldn't find out" —
 * printing "OWES $30" for someone who already paid is a worse failure than
 * printing a blank.
 */
export function useFuryPayments(registrationIds: string[], enabled = true) {
  const results = useQueries({
    queries: registrationIds.map(id => ({
      queryKey: ['fury', 'payments', id],
      queryFn: () => fetchFuryRegistrationPayments(id),
      enabled,
      staleTime: 60_000,
      ...FURY_QUERY_OPTS,
    })),
  })

  const byRegId: Record<string, FuryPayment[] | undefined> = {}
  registrationIds.forEach((id, i) => {
    const r = results[i]
    byRegId[id] = r?.isSuccess ? (r.data ?? []) : undefined
  })

  return {
    byRegId,
    isLoading: results.some(r => r.isLoading),
    // Partial failure is normal-ish (one 500 among 60); surface a count rather
    // than an all-or-nothing error so the sheet still prints.
    failedCount: results.filter(r => r.isError).length,
  }
}

export function useFuryEventList() {
  return useQuery({
    queryKey: ['fury', 'events'],
    queryFn: fetchFuryEventList,
    staleTime: 5 * 60_000,
    ...FURY_QUERY_OPTS,
  })
}

/**
 * Public (unauthenticated) event list for visitor-facing pages. The admin
 * list above requires a signed-in session, so using it from Landing/Schedule
 * meant every anonymous visitor's query failed and the site silently fell
 * back to the hand-set statuses in mockData — the "reg is open on Fury but
 * the site still says Notify Me" bug.
 */
export function useFuryPublicEventList() {
  return useQuery({
    queryKey: ['fury', 'publicEvents'],
    queryFn: fetchFuryPublicEventList,
    staleTime: 5 * 60_000,
    ...FURY_QUERY_OPTS,
  })
}

export function useFuryEventStats(furyEventId: string | undefined) {
  return useQuery({
    queryKey: ['fury', 'stats', furyEventId],
    queryFn: async () => {
      const [money, offerings] = await Promise.all([
        fetchFuryMoneySummary(furyEventId!),
        fetchFuryOfferingStats(furyEventId!),
      ])
      const totalReg = Object.values(offerings.statsByOfferingId)
        .reduce((s, o) => s + o.totalActive, 0)
      const approved = Object.values(offerings.statsByOfferingId)
        .reduce((s, o) => s + o.confirmed, 0)
      const pending = Object.values(offerings.statsByOfferingId)
        .reduce((s, o) => s + o.pending, 0)
      return {
        registrationCount: totalReg,
        approvedCount: approved,
        pendingCount: pending,
        revenue: money.grossCollected,
        pendingBalance: money.potentialRefundsOwed,
      }
    },
    enabled: !!furyEventId,
    staleTime: 2 * 60_000,
    ...FURY_QUERY_OPTS,
  })
}
