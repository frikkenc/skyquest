import { useEffect, useRef, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { TeamAssignment, TeamGroup, TeamingDoc, TeamRegistration } from '../types'

// Teams built in the admin Teaming tab persist to Firestore `teaming/{instanceId}`.
// Before this hook existed the tab held everything in component state, and the
// admin tabs render conditionally — so switching tabs (or refreshing) unmounted
// the component and silently wiped every team. This is the fix.

export type TeamingSaveState = 'idle' | 'saving' | 'saved' | 'error'

export type TeamingLoadState =
  | { status: 'loading' }
  | { status: 'ready'; doc: TeamingDoc | null }  // null = nothing saved yet
  | { status: 'error' }

function teamingRef(instanceId: string) {
  return doc(db, 'teaming', instanceId)
}

function parseTeamingDoc(data: Record<string, unknown> | undefined): TeamingDoc | null {
  if (!data) return null
  return {
    groups: Array.isArray(data.groups) ? (data.groups as TeamGroup[]) : [],
    pool: Array.isArray(data.pool) ? (data.pool as string[]) : [],
    memberNames: (data.memberNames && typeof data.memberNames === 'object')
      ? (data.memberNames as Record<string, string>)
      : {},
    memberLegalNames: (data.memberLegalNames && typeof data.memberLegalNames === 'object')
      ? (data.memberLegalNames as Record<string, string>)
      : undefined,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
  }
}

export async function loadTeamingDoc(instanceId: string): Promise<TeamingDoc | null> {
  const snap = await getDoc(teamingRef(instanceId))
  return snap.exists() ? parseTeamingDoc(snap.data()) : null
}

export function useTeamingDoc(instanceId: string) {
  const [loadState, setLoadState] = useState<TeamingLoadState>({ status: 'loading' })
  const [saveState, setSaveState] = useState<TeamingSaveState>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setLoadState({ status: 'loading' })
    getDoc(teamingRef(instanceId))
      .then(snap => {
        if (cancelled) return
        setLoadState({ status: 'ready', doc: snap.exists() ? parseTeamingDoc(snap.data()) : null })
      })
      // A load failure must NOT be treated as "no saved teams" — the caller
      // would mount an empty editor and the next edit would overwrite the
      // real doc. Surface it as an error and let the caller block editing.
      .catch(() => { if (!cancelled) setLoadState({ status: 'error' }) })
    return () => { cancelled = true }
  }, [instanceId])

  // Debounced save-as-you-go. The pending timeout deliberately survives
  // unmount: clicking to another tab within the debounce window still flushes.
  function scheduleSave(
    groups: TeamGroup[],
    pool: string[],
    memberNames: Record<string, string>,
    memberLegalNames?: Record<string, string>,
  ) {
    window.clearTimeout(timer.current)
    setSaveState('saving')
    // JSON round-trip strips `undefined` optional fields (division,
    // isAiSuggested), which Firestore rejects.
    const payload: TeamingDoc = JSON.parse(JSON.stringify({
      groups, pool, memberNames, memberLegalNames, updatedAt: new Date().toISOString(),
    }))
    timer.current = window.setTimeout(() => {
      setDoc(teamingRef(instanceId), payload)
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'))
    }, 600)
  }

  return { loadState, saveState, scheduleSave }
}

function firstNameOf(fullName: string) {
  return fullName.split(' ')[0]
}

/**
 * Load number per team, by position in the saved order.
 *
 * Loads are break points rather than a fixed teams-per-load count: the first
 * team opens Load 1, and every team flagged `startsLoad` opens the next one.
 * Uneven loads are the normal case — a Skyvan and an Otter don't hold the same
 * number of teams, and a weather hold splits one in half.
 */
export function loadNumbersFor(groups: Pick<TeamGroup, 'startsLoad'>[]): number[] {
  let n = 0
  return groups.map((g, i) => {
    if (i === 0 || g.startsLoad) n += 1
    return n
  })
}

/**
 * Turn a saved teaming doc into the TeamAssignment + TeamRegistration shapes
 * the print and check-in surfaces consume. Registrations are synthesized from
 * the denormalized name map (those pages are public and can't call the
 * auth-gated Fury API), including one per named video slot so
 * `videoPersonId` resolves to a name through the usual regById lookup.
 */
export function teamingDocToPrintData(tdoc: TeamingDoc, eventId: string): {
  assignments: TeamAssignment[]
  registrations: TeamRegistration[]
} {
  const syntheticReg = (id: string, name: string): TeamRegistration => ({
    id,
    eventId,
    division: 'A',
    teamName: '',
    members: [{ id, name }],
    // 'approved' so print slips don't flag everyone NOT REG; payment fields
    // are placeholders — payment data isn't wired into teaming.
    status: 'approved',
    paymentStatus: 'unpaid',
    balance: 0,
    submittedAt: '',
  })

  const registrations: TeamRegistration[] = Object.entries(tdoc.memberNames)
    .map(([id, name]) => syntheticReg(id, name))

  // Loads are resolved against the FULL group list, before empty shells are
  // dropped — otherwise removing an empty team would renumber every load below
  // it. The time is taken from whichever team opens the load, so it survives
  // even when that team is an empty shell that never prints.
  const loadNos = loadNumbersFor(tdoc.groups)
  const loadTimes: Record<number, string> = {}
  tdoc.groups.forEach((g, i) => {
    const opens = i === 0 || g.startsLoad
    if (opens && g.loadTime) loadTimes[loadNos[i]] = g.loadTime
  })

  const assignments: TeamAssignment[] = tdoc.groups
    .map((g, i) => ({ g, loadNumber: loadNos[i] }))
    // Empty shells (no confirmed members) have nothing to print or check in.
    .filter(({ g }) => g.memberIds.length > 0)
    .map(({ g, loadNumber }) => {
      const autoName = g.memberIds
        .map(id => tdoc.memberNames[id])
        .filter(Boolean)
        .map(firstNameOf)
        .join('-')
      let videoPersonId: string | undefined
      if (g.videoName) {
        videoPersonId = `${g.id}-video`
        registrations.push(syntheticReg(videoPersonId, g.videoName))
      }
      return {
        id: g.id,
        eventId,
        division: g.division,
        teamName: g.customName || autoName || undefined,
        memberIds: g.memberIds,
        videoPersonId,
        videoMemberId: g.videoMemberId,
        isConfirmed: false,
        loadNumber,
        loadTime: loadTimes[loadNumber],
        pendingNames: g.pendingSlots.length ? g.pendingSlots : undefined,
      }
    })

  return { assignments, registrations }
}
