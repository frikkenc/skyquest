import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { EVENT_INSTANCES } from '../data/mockData'
import { useFuryEventList } from './useFuryData'
import type { EventInstance, EventStatus } from '../types'
import type { FuryEvent } from '../lib/furyClient'

function furyStatusToEventStatus(e: FuryEvent): EventStatus {
  const s = e.config.status
  if (s === 'live') return e.config.registrationOpen ? 'open' : 'closed'
  if (s === 'archived') return 'complete'
  return 'upcoming'
}

function mergeFuryIntoInstance(base: EventInstance, fury: FuryEvent): EventInstance {
  return {
    ...base,
    name: fury.name,
    date: fury.startDate,
    dropzone: fury.config.location,
    status: furyStatusToEventStatus(fury),
  }
}

export function useLiveEventList() {
  const { data: furyEvents, isLoading, isError } = useFuryEventList()

  const { data: configOverrides } = useQuery({
    queryKey: ['eventConfig'],
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'eventConfig'))
      const map: Record<string, Partial<EventInstance>> = {}
      snap.forEach((d: import('firebase/firestore').QueryDocumentSnapshot) => { map[d.id] = d.data() as Partial<EventInstance> })
      return map
    },
    staleTime: 30_000,
  })

  const events = useMemo<EventInstance[]>(() => {
    const furyById = furyEvents
      ? new Map(furyEvents.map(e => [e.id, e]))
      : new Map()

    return EVENT_INSTANCES.map(instance => {
      let merged: EventInstance = instance
      if (furyEvents && instance.furyEventId) {
        const fury = furyById.get(instance.furyEventId)
        if (fury) merged = mergeFuryIntoInstance(instance, fury)
      }
      const overrides = configOverrides?.[instance.id]
      if (overrides) {
        const { divisions: _div, ...rest } = overrides as Record<string, unknown> & { divisions?: unknown }
        merged = { ...merged, ...(rest as Partial<EventInstance>) }
      }
      return merged
    }).sort((a, b) => a.date.localeCompare(b.date))
  }, [furyEvents, configOverrides])

  return { events, isLoading, isError }
}
