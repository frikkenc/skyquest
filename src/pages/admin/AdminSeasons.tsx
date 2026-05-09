import { useState } from 'react'
import { SEASONS, EVENT_TYPES, EVENT_TYPE_SETTINGS } from '../../data/mockData'
import type { Season, SeasonEventConfig } from '../../types'
import styles from './AdminSeasons.module.css'

function fmtDate(iso: string | undefined) {
  if (!iso) return '—'
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState<Season[]>(SEASONS)
  const activeSeason = seasons.find(s => s.isActive) ?? seasons[0]
  const [selectedId, setSelectedId] = useState(activeSeason?.id ?? '')
  const [editingEventIdx, setEditingEventIdx] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<SeasonEventConfig | null>(null)

  const season = seasons.find(s => s.id === selectedId)

  function startEdit(idx: number) {
    setEditingEventIdx(idx)
    setEditDraft({ ...(season!.events[idx]) })
  }

  function saveEdit() {
    if (editingEventIdx === null || !editDraft || !season) return
    setSeasons(prev => prev.map(s => {
      if (s.id !== season.id) return s
      const events = [...s.events]
      events[editingEventIdx] = editDraft
      return { ...s, events }
    }))
    setEditingEventIdx(null)
    setEditDraft(null)
  }

  function cancelEdit() {
    setEditingEventIdx(null)
    setEditDraft(null)
  }

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Season Setup</h1>
          <p className={styles.subtitle}>Configure event dates, dropzones, and Fury Registration links for each season.</p>
        </div>
        <button className={styles.btnPrimary}>+ New Season</button>
      </div>

      {/* Season selector */}
      <div className={styles.seasonTabs}>
        {seasons.map(s => (
          <button
            key={s.id}
            className={`${styles.seasonTab} ${s.id === selectedId ? styles.seasonTabActive : ''}`}
            onClick={() => setSelectedId(s.id)}
          >
            {s.name}
            {s.isActive && <span className={styles.activeBadge}>Active</span>}
          </button>
        ))}
      </div>

      {season && (
        <>
          {/* Season meta */}
          <div className={styles.seasonMeta}>
            <div className={styles.metaField}>
              <label>Season Name</label>
              <input className={styles.input} defaultValue={season.name} />
            </div>
            <div className={styles.metaField}>
              <label>Year</label>
              <input className={styles.input} type="number" defaultValue={season.year} style={{ width: 90 }} />
            </div>
            <div className={styles.metaField}>
              <label>Status</label>
              <span className={season.isActive ? styles.activeTag : styles.inactiveTag}>
                {season.isActive ? 'Active Season' : 'Inactive'}
              </span>
              {!season.isActive && <button className={styles.btnSm}>Set Active</button>}
            </div>
          </div>

          {/* Event type settings strip */}
          <div className={styles.sectionHd}>
            <span className={styles.sectionLabel}>Event Type Settings</span>
            <span className={styles.hint}>Per-type defaults</span>
          </div>
          <div className={styles.settingsGrid}>
            {EVENT_TYPE_SETTINGS.filter(s => s.typeSlug !== 'awards').map(setting => {
              const type = EVENT_TYPES.find(t => t.slug === setting.typeSlug)!
              return (
                <div key={setting.typeSlug} className={styles.settingCard}>
                  <div className={styles.settingName}>{type.shortName}</div>
                  <div className={styles.settingRow}>
                    <span>Team size</span>
                    <input className={styles.inputSm} type="number" defaultValue={setting.defaultTeamSize} min={1} max={20} />
                  </div>
                  <div className={styles.settingRow}>
                    <span>Video slot</span>
                    <input type="checkbox" defaultChecked={setting.hasVideoSlot} />
                  </div>
                  <div className={styles.settingRow}>
                    <span>Scoring</span>
                    <select className={styles.selectSm} defaultValue={setting.scoringType}>
                      <option value="rounds">Rounds</option>
                      <option value="poker">Poker</option>
                      <option value="crazy8s">Crazy 8s</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                  <div className={styles.settingRow}>
                    <span>Reg method</span>
                    <select className={styles.selectSm} defaultValue={setting.registrationMethod}>
                      <option value="fury">Fury Reg</option>
                      <option value="manual">Manual</option>
                    </select>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Event schedule */}
          <div className={styles.sectionHd} style={{ marginTop: 32 }}>
            <span className={styles.sectionLabel}>Event Schedule</span>
            <button className={styles.btnSm}>+ Add Event</button>
          </div>

          <div className={styles.eventTable}>
            <div className={styles.eventTableHead}>
              <div>Event Type</div>
              <div>Date</div>
              <div>Dropzone</div>
              <div>Reg Open</div>
              <div>Reg Close</div>
              <div>Fury Registration</div>
              <div>Status</div>
              <div></div>
            </div>

            {season.events.map((ev, idx) => {
              const type = EVENT_TYPES.find(t => t.slug === ev.eventTypeSlug)
              const settings = EVENT_TYPE_SETTINGS.find(s => s.typeSlug === ev.eventTypeSlug)
              const isEditing = editingEventIdx === idx
              const hasFury = !!ev.furyEventId
              const isLinked = !!ev.instanceId

              return (
                <div key={idx}>
                  {/* Display row — always visible */}
                  <div className={`${styles.eventRow} ${isEditing ? styles.eventRowEditing : ''}`}>
                    <div>
                      <span className={styles.eventTypeName} style={{ color: type?.color }}>{type?.shortName}</span>
                      {settings?.registrationMethod === 'manual' && (
                        <span className={styles.manualTag}>manual reg</span>
                      )}
                    </div>
                    <div className={styles.dateCell}>{fmtDate(ev.tentativeDate)}</div>
                    <div className={styles.dzCell}>{ev.dropzone ?? <span className={styles.missing}>—</span>}</div>
                    <div className={styles.dateSmall}>{fmtDate(ev.registrationOpenDate)}</div>
                    <div className={styles.dateSmall}>{fmtDate(ev.registrationCloseDate)}</div>
                    <div className={styles.furyCol}>
                      {settings?.registrationMethod === 'manual' ? (
                        <span className={styles.manualNote}>Not via Fury</span>
                      ) : hasFury ? (
                        <>
                          <span className={styles.furyId}>{ev.furyEventId}</span>
                          {ev.furyRegistrationUrl && (
                            <a href={ev.furyRegistrationUrl} target="_blank" rel="noreferrer" className={styles.furyLink}>
                              fury.coach ↗
                            </a>
                          )}
                        </>
                      ) : (
                        <span className={styles.missing}>Not linked</span>
                      )}
                    </div>
                    <div>
                      {isLinked ? (
                        <span className={styles.statusLinked}>✓ Linked</span>
                      ) : (
                        <span className={styles.statusDraft}>Draft</span>
                      )}
                    </div>
                    <div className={styles.rowActions}>
                      {isEditing ? (
                        <>
                          <button className={styles.btnPrimary} onClick={saveEdit}>Save</button>
                          <button className={styles.btnGhost} onClick={cancelEdit}>Cancel</button>
                        </>
                      ) : (
                        <button className={styles.btnGhost} onClick={() => startEdit(idx)}>Edit</button>
                      )}
                    </div>
                  </div>

                  {/* Expanded edit panel — shown below the row when editing */}
                  {isEditing && editDraft && (
                    <div className={styles.editPanel}>
                      <div className={styles.editGrid}>
                        <div className={styles.editField}>
                          <label>Date</label>
                          <input
                            className={styles.input}
                            type="date"
                            value={editDraft.tentativeDate ?? ''}
                            onChange={e => setEditDraft({ ...editDraft, tentativeDate: e.target.value })}
                          />
                        </div>
                        <div className={styles.editField}>
                          <label>Dropzone</label>
                          <input
                            className={styles.input}
                            value={editDraft.dropzone ?? ''}
                            placeholder="Dropzone name"
                            onChange={e => setEditDraft({ ...editDraft, dropzone: e.target.value })}
                          />
                        </div>
                        <div className={styles.editField}>
                          <label>Reg Opens</label>
                          <input
                            className={styles.input}
                            type="date"
                            value={editDraft.registrationOpenDate ?? ''}
                            onChange={e => setEditDraft({ ...editDraft, registrationOpenDate: e.target.value })}
                          />
                        </div>
                        <div className={styles.editField}>
                          <label>Reg Closes</label>
                          <input
                            className={styles.input}
                            type="date"
                            value={editDraft.registrationCloseDate ?? ''}
                            onChange={e => setEditDraft({ ...editDraft, registrationCloseDate: e.target.value })}
                          />
                        </div>
                        {settings?.registrationMethod === 'fury' && (
                          <>
                            <div className={styles.editField}>
                              <label>Fury Event ID</label>
                              <input
                                className={styles.input}
                                value={editDraft.furyEventId ?? ''}
                                placeholder="fury-event-id"
                                onChange={e => setEditDraft({ ...editDraft, furyEventId: e.target.value })}
                              />
                            </div>
                            <div className={`${styles.editField} ${styles.editFieldWide}`}>
                              <label>Fury Registration URL</label>
                              <input
                                className={styles.input}
                                value={editDraft.furyRegistrationUrl ?? ''}
                                placeholder="https://fury.coach/events/..."
                                onChange={e => setEditDraft({ ...editDraft, furyRegistrationUrl: e.target.value })}
                              />
                            </div>
                          </>
                        )}
                        <div className={`${styles.editField} ${styles.editFieldWide}`}>
                          <label>Notes</label>
                          <input
                            className={styles.input}
                            value={editDraft.notes ?? ''}
                            placeholder="Internal notes..."
                            onChange={e => setEditDraft({ ...editDraft, notes: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className={styles.saveBar}>
            <button className={styles.btnPrimary}>Save Season</button>
            <span className={styles.saveHint}>Changes are saved locally until you click Save Season.</span>
          </div>
        </>
      )}
    </>
  )
}
