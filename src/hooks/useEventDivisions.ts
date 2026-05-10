import { useState, useEffect } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Division } from '../types'

export function useEventDivisions(instanceId: string, fallback: Division[]) {
  const [divisions, setDivisionsState] = useState<Division[]>(fallback)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!instanceId) return
    getDoc(doc(db, 'eventConfig', instanceId)).then(snap => {
      const data = snap.data()
      if (snap.exists() && Array.isArray(data?.divisions)) {
        setDivisionsState(data.divisions as Division[])
      }
    }).catch(() => { /* fall back to mockData default */ })
  }, [instanceId])

  async function saveDivisions(divs: Division[]) {
    setDivisionsState(divs)
    setSaving(true)
    try {
      await setDoc(doc(db, 'eventConfig', instanceId), { divisions: divs }, { merge: true })
    } finally {
      setSaving(false)
    }
  }

  return { divisions, saveDivisions, saving }
}
