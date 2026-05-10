import { useQuery } from '@tanstack/react-query'
import {
  fetchFurySession, fetchFuryRegistrations,
  fetchFuryEventList, fetchFuryMoneySummary, fetchFuryOfferingStats,
} from '../lib/furyClient'

export function useFurySession() {
  return useQuery({
    queryKey: ['fury', 'session'],
    queryFn: fetchFurySession,
    staleTime: 5 * 60_000,
    retry: 1,
  })
}

export function useFuryRegistrations(furyEventId: string | undefined) {
  return useQuery({
    queryKey: ['fury', 'registrations', furyEventId],
    queryFn: () => fetchFuryRegistrations(furyEventId!),
    enabled: !!furyEventId,
    staleTime: 2 * 60_000,
    retry: 1,
  })
}

export function useFuryEventList() {
  return useQuery({
    queryKey: ['fury', 'events'],
    queryFn: fetchFuryEventList,
    staleTime: 5 * 60_000,
    retry: 1,
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
    retry: 1,
  })
}
