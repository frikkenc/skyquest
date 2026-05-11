import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { EVENT_INSTANCES } from '../data/mockData'
import type { TeamRegistration, TeamAssignment } from '../types'
import {
  buildRegMap,
  manifestSlipsHtml, checkInListHtml, paymentStatusHtml, teamsManifestHtml,
} from '../utils/printHtml'

export default function PrintPage() {
  const { instanceId, type } = useParams<{ instanceId: string; type: string }>()

  useEffect(() => {
    const event = EVENT_INSTANCES.find(e => e.id === instanceId)
    if (!event) return

    const registrations: TeamRegistration[] = []
    const teams: TeamAssignment[] = []
    const regById = buildRegMap(registrations)

    let html = ''
    switch (type) {
      case 'slips':   html = manifestSlipsHtml(teams, regById, event); break
      case 'checkin': html = checkInListHtml(registrations, event); break
      case 'payment': html = paymentStatusHtml(registrations, event); break
      case 'teams':   html = teamsManifestHtml(teams, regById, event); break
    }

    if (html) {
      document.open()
      document.write(html)
      document.close()
    }
  }, [instanceId, type])

  return null
}
