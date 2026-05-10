import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { EventInstance, EventStatus } from '../types'
import styles from './EditEventModal.module.css'

const STATUS_OPTIONS: EventStatus[] = ['upcoming', 'open', 'closed', 'complete']

export function EditEventModal({
  event,
  onClose,
}: {
  event: EventInstance
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(event.name)
  const [date, setDate] = useState(event.date)
  const [dropzone, setDropzone] = useState(event.dropzone)
  const [status, setStatus] = useState<EventStatus>(event.status)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    await setDoc(doc(db, 'eventConfig', event.id), { name, date, dropzone, status }, { merge: true })
    await queryClient.invalidateQueries({ queryKey: ['eventConfig'] })
    setSaving(false)
    onClose()
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.hd}>
          <span className={styles.title}>Edit Event</span>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>
        <div className={styles.body}>
          <label className={styles.lbl}>Name</label>
          <input className={styles.input} value={name} onChange={e => setName(e.target.value)} />

          <label className={styles.lbl}>Date</label>
          <input className={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />

          <label className={styles.lbl}>Dropzone</label>
          <input className={styles.input} value={dropzone} onChange={e => setDropzone(e.target.value)} />

          <label className={styles.lbl}>Status</label>
          <select className={styles.input} value={status} onChange={e => setStatus(e.target.value as EventStatus)}>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {event.furyEventId && (
            <div className={styles.note}>
              Synced from Fury — local edits override the live data until the next sync.
            </div>
          )}
        </div>
        <div className={styles.footer}>
          <button className={styles.btn} onClick={onClose}>Cancel</button>
          <button className={`${styles.btn} ${styles.primary}`} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
