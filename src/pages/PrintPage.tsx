import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { EVENT_INSTANCES } from '../data/mockData'
import { loadTeamingDoc, teamingDocToPrintData } from '../hooks/useTeamingDoc'
import {
  buildRegMap,
  manifestSlipsHtml, checkInListHtml, paymentStatusHtml, teamsManifestHtml,
} from '../utils/printHtml'

export default function PrintPage() {
  const { instanceId, type } = useParams<{ instanceId: string; type: string }>()

  useEffect(() => {
    const event = EVENT_INSTANCES.find(e => e.id === instanceId)
    if (!event || !instanceId) return

    let cancelled = false
    // This page is public (shareable print links) so it can't call the
    // auth-gated Fury API. Teams AND names come from the saved teaming doc —
    // the Teaming tab denormalizes member names into it on every save.
    loadTeamingDoc(instanceId)
      .catch(() => null)
      .then(tdoc => {
        if (cancelled) return
        const { assignments, registrations } = tdoc
          ? teamingDocToPrintData(tdoc, instanceId)
          : { assignments: [], registrations: [] }
        const regById = buildRegMap(registrations)

        let html = ''
        switch (type) {
          case 'slips':   html = manifestSlipsHtml(assignments, regById, event); break
          case 'checkin': html = checkInListHtml(registrations, event); break
          case 'payment': html = paymentStatusHtml(registrations, event); break
          case 'teams':   html = teamsManifestHtml(assignments, regById, event); break
        }

        if (html) {
          document.open()
          document.write(html)
          document.close()
        }
      })
    return () => { cancelled = true }
  }, [instanceId, type])

  return null
}
