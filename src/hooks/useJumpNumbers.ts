import { useEffect, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../firebase'
import type { TeamRegistration } from '../types'

// Dueling DZs handicap input: each jumper's total jump count on the day.
//
// Lived in localStorage until this existed, so a number submitted on a
// jumper's phone never reached the judging laptop — the check-in page "worked"
// only if everyone typed into the one device the scores were entered on.
//
// Now one Firestore doc per event, `jumpNumbers/{instanceId}`, keyed by
// registration id (not team), so a roster shuffle after check-in doesn't
// strand anyone's number. Public read (the check-in pages show what's been
// entered); public writes go through the `submitJumpNumbers` Cloud Function,
// admin edits write directly.

export interface JumpEntry {
  jumps: number
  updatedAt: string
  by: 'self' | 'team' | 'admin'
}

export type JumpsByReg = Record<string, JumpEntry>

function jumpRef(instanceId: string) {
  return doc(db, 'jumpNumbers', instanceId)
}

/** Live view of every jump number entered for the event. null = still loading. */
export function useJumpNumbers(instanceId: string): JumpsByReg | null {
  const [byReg, setByReg] = useState<JumpsByReg | null>(null)
  useEffect(() => {
    setByReg(null)
    return onSnapshot(
      jumpRef(instanceId),
      snap => setByReg((snap.data()?.byReg as JumpsByReg | undefined) ?? {}),
      () => setByReg({}),
    )
  }, [instanceId])
  return byReg
}

/** Admin-only direct write (rules gate it on sign-in). 0 / empty clears the entry's count. */
export function adminSetJumps(instanceId: string, regId: string, jumps: number) {
  const entry: JumpEntry = { jumps, updatedAt: new Date().toISOString(), by: 'admin' }
  return setDoc(jumpRef(instanceId), { byReg: { [regId]: entry } }, { merge: true })
}

/** Per-member counts for a team, in member order. 0 = not entered. */
export function teamJumps(byReg: JumpsByReg, memberIds: string[]): number[] {
  return memberIds.map(id => byReg[id]?.jumps ?? 0)
}

export type SubmitJumpsRequest =
  | { instanceId: string; email: string; jumps: number; regId?: string }
  | { instanceId: string; teamId: string; teamJumps: number[] }

export type SubmitJumpsResponse =
  | { status: 'saved'; names: string[] }
  | { status: 'choose'; options: { regId: string; name: string }[] }

export const submitJumpNumbers = httpsCallable<SubmitJumpsRequest, SubmitJumpsResponse>(
  functions, 'submitJumpNumbers',
)

// ── Email lookup for self-entry ────────────────────────────────────────────────
//
// The public page can't call the auth-gated Fury API, and emails must not go
// in the public `teaming` doc. So the admin event page mirrors regId → email
// into `teamingPrivate/{instanceId}` (sign-in only) whenever it loads the Fury
// roster, and the Cloud Function matches against that.

export interface PrivatePerson { email: string; name: string }

export function savePrivateRoster(instanceId: string, registrations: TeamRegistration[]) {
  const people: Record<string, PrivatePerson> = {}
  for (const r of registrations) {
    // Video flyers don't count toward the handicap; cancelled/denied aren't jumping.
    if (r.offeringType === 'video' || r.status === 'cancelled' || r.status === 'denied') continue
    if (!r.email) continue
    people[r.id] = { email: r.email.trim().toLowerCase(), name: r.members[0]?.name || r.fullName || '' }
  }
  return setDoc(doc(db, 'teamingPrivate', instanceId), { people, updatedAt: new Date().toISOString() })
}
