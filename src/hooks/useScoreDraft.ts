import { useRef, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

// Judging-table entry synced to Firestore `scoreDrafts/{instanceId}` as you
// type, with localStorage kept as the offline copy (bad signal at the DZ).
// The SCSL/Dueling and Poker Run tabs were localStorage-only, so a meet's
// scoring lived in one laptop until Publish. Same pattern as Crazy 8s.

export type SyncState = 'idle' | 'saving' | 'synced' | 'error'

const draftRef = (instanceId: string) => doc(db, 'scoreDrafts', instanceId)

export async function loadScoreDraft<T>(instanceId: string): Promise<(T & { updatedAt?: string }) | null> {
  try {
    const snap = await getDoc(draftRef(instanceId))
    return snap.exists() ? (snap.data() as T & { updatedAt?: string }) : null
  } catch { return null }
}

/**
 * Which copy wins on load. More entered scoring always wins — a near-empty
 * draft from a second machine must never overwrite the laptop that holds the
 * meet. Only on a tie does the newer stamp decide.
 */
export function pickDraft<T extends { updatedAt?: string }>(
  local: T | null, remote: T | null, weight: (s: T) => number,
): 'local' | 'remote' | 'none' {
  if (!remote) return local ? 'local' : 'none'
  if (!local) return 'remote'
  const lw = weight(local), rw = weight(remote)
  if (rw !== lw) return rw > lw ? 'remote' : 'local'
  return (remote.updatedAt ?? '') >= (local.updatedAt ?? '') ? 'remote' : 'local'
}

/**
 * Day-of standings, public-read at `liveScores/{instanceId}`: the same shape
 * as a published result, rewritten on every draft push so the event page can
 * show "live, not final" scores before Publish. The draft itself stays
 * admin-only.
 */
export const liveScoresRef = (instanceId: string) => doc(db, 'liveScores', instanceId)

/** Debounced Firestore push. `live` (optional) is the public standings snapshot. */
export function useScoreDraftPush(instanceId: string) {
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const timer = useRef<number | undefined>(undefined)

  function push<T extends object>(state: T, live?: object) {
    const updatedAt = new Date().toISOString()
    // JSON round-trip strips `undefined` fields, which Firestore rejects.
    const payload = JSON.parse(JSON.stringify({ ...state, updatedAt }))
    const livePayload = live ? JSON.parse(JSON.stringify({ ...live, updatedAt })) : null
    window.clearTimeout(timer.current)
    setSyncState('saving')
    timer.current = window.setTimeout(() => {
      setDoc(draftRef(instanceId), payload)
        .then(() => setSyncState('synced'))
        .catch(() => setSyncState('error'))
      if (livePayload) setDoc(liveScoresRef(instanceId), livePayload).catch(console.error)
    }, 700)
  }

  return { push, syncState }
}
