import { useQuery } from '@tanstack/react-query'
import { fetchFurySession, fetchFuryRegistrations } from '../lib/furyClient'

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
