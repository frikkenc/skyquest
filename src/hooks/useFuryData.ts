import { useQuery } from '@tanstack/react-query'
import {
  fetchFurySession, fetchFuryRegistrations,
  fetchFuryEventList, fetchFuryMoneySummary, fetchFuryOfferingStats,
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

export function useFuryEventList() {
  return useQuery({
    queryKey: ['fury', 'events'],
    queryFn: fetchFuryEventList,
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
