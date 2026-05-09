import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  EVENT_INSTANCES, EVENT_TYPES, EVENT_TYPE_SETTINGS, REGISTRATIONS, SCSL_REGISTRATIONS,
  TEAM_ASSIGNMENTS,
} from '../../data/mockData'
import StatusPill from '../../components/StatusPill'
import EventBadge from '../../components/EventBadge'
import type { Division, TeamRegistration, TeamAssignment } from '../../types'
import styles from './AdminEventInstance.module.css'
import teamStyles from './AdminTeaming.module.css'
import PrintablesTab from './AdminPrintables'
import ScoresTab from './AdminScores'

type Tab = 'Registrations' | 'Teaming' | 'Scores' | 'Waitlist' | 'Payments' | 'Emails' | 'Printables'
const TABS_FURY: Tab[]   = ['Registrations', 'Teaming', 'Scores', 'Emails', 'Printables']
const TABS_MANUAL: Tab[] = ['Registrations', 'Teaming', 'Scores', 'Waitlist', 'Payments', 'Emails', 'Printables']

const DIVISIONS: Division[] = ['AAA', 'AA', 'A', 'Rookie']

export default function AdminEventInstance() {
  const { typeSlug, instanceId } = useParams<{ typeSlug: string; instanceId: string }>()
  const [tab, setTab] = useState<Tab>('Registrations')
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())

  const event = EVENT_INSTANCES.find(e => e.id === instanceId)
  const eventType = EVENT_TYPES.find(t => t.slug === typeSlug)
  const eventSettings = EVENT_TYPE_SETTINGS.find(s => s.typeSlug === typeSlug)
  const isManualReg = eventSettings?.registrationMethod === 'manual'
  const tabs = TABS_FURY
  const allRegistrations = [...REGISTRATIONS, ...SCSL_REGISTRATIONS]
  const registrations = allRegistrations.filter(r => r.eventId === instanceId)
  const lftCount = registrations.filter(r => !r.teamName && r.status !== 'denied').length

  if (!event || !eventType) {
    return <div style={{ padding: 48, color: 'var(--adm-mute)' }}>Event not found.</div>
  }

  function formatDate(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function toggleBulk(id: string) {
    setBulkSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const statusColors: Record<string, string> = {
    approved: 'var(--sq-signal)',
    pending: 'var(--sq-yellow)',
    waitlist: '#2196F3',
    denied: 'var(--sq-red)',
    unmatched: '#ff7043',
  }
  const payColors: Record<string, string> = {
    paid: 'var(--sq-signal)',
    partial: 'var(--sq-yellow)',
    unpaid: 'var(--sq-red)',
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className={styles.crumbs}>
        <Link to="/admin">Dashboard</Link>
        {' / '}
        <Link to={`/admin/events/${typeSlug}`}>{eventType.name}</Link>
        {' / '}
        {event.name}
      </div>

      {/* Hero — collapsed on Teaming tab to maximize vertical space */}
      {tab === 'Teaming' ? (
        <div className={styles.heroMini}>
          <EventBadge slug={event.typeSlug} size={28} />
          <span className={styles.heroMiniTitle}>{event.name}</span>
          <span className={styles.heroMiniMeta}>{formatDate(event.date)} · {event.dropzone}</span>
          <StatusPill status={event.status} />
        </div>
      ) : (
        <div className={styles.hero}>
          <EventBadge slug={event.typeSlug} size={64} />
          <div className={styles.heroInfo}>
            <div className={styles.heroTitle}>{event.name}</div>
            <div className={styles.heroMeta}>
              {formatDate(event.date)} · {event.dropzone} · <StatusPill status={event.status} />
            </div>
          </div>
          <div className={styles.heroKpis}>
            {[
              { n: event.registrationCount, l: 'Reg\'d' },
              { n: event.approvedCount, l: 'Approved' },
              { n: `$${(event.revenue ?? 0).toLocaleString()}`, l: 'Revenue' },
              { n: lftCount, l: 'LFT', warn: lftCount > 0 },
            ].map(k => (
              <div key={k.l} className={styles.heroKpi}>
                <div className={styles.heroKpiN} style={k.warn ? { color: '#ffab40' } : undefined}>{k.n}</div>
                <div className={styles.heroKpiL}>{k.l}</div>
              </div>
            ))}
          </div>
          <div className={styles.heroActions}>
            <button className={`${styles.adminBtn} ${styles.primary}`}>Email All ▸</button>
            <button className={styles.adminBtn}>⟲ Sync</button>
            <button className={styles.adminBtn}>Export PDF</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabOn : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t === 'Registrations' && registrations.filter(r => r.status === 'pending').length > 0 && (
              <span className={styles.tabBadge}>{registrations.filter(r => r.status === 'pending').length}</span>
            )}
            {t === 'Teaming' && lftCount > 0 && (
              <span className={`${styles.tabBadge} ${styles.tabBadgeWarn}`}>{lftCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── REGISTRATIONS TAB ── */}
      {tab === 'Registrations' && isManualReg && (
        <ManualRegTab registrations={registrations} eventId={instanceId ?? ''} />
      )}

      {tab === 'Registrations' && !isManualReg && (
        <div>
          <div className={styles.toolbar}>
            <div className={styles.toolbarLeft}>
              <select className={styles.inlineSelect}>
                <option>All Divisions</option>
                {DIVISIONS.map(d => <option key={d}>{d}</option>)}
              </select>
              <select className={styles.inlineSelect}>
                <option>All Statuses</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Waitlist</option>
                <option>Denied</option>
              </select>
            </div>
            {bulkSelected.size > 0 && (
              <div className={styles.bulkBar}>
                <span>{bulkSelected.size} selected</span>
                <button className={`${styles.aqBtn} ${styles.approve}`} onClick={() => setBulkSelected(new Set())}>✓ Approve All</button>
                <button className={`${styles.aqBtn} ${styles.deny}`} onClick={() => setBulkSelected(new Set())}>✕ Deny All</button>
              </div>
            )}
            <button className={`${styles.adminBtn} ${styles.primary}`} style={{ marginLeft: 'auto' }}>+ Add Team</button>
          </div>

          <div className={styles.table}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}><input type="checkbox" onChange={e => {
                    if (e.target.checked) setBulkSelected(new Set(registrations.map(r => r.id)))
                    else setBulkSelected(new Set())
                  }} /></th>
                  <th style={thStyle}>Team / Registrant</th>
                  <th style={thStyle}>Division</th>
                  <th style={thStyle}>Members</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Balance</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <td style={tdStyle}>
                      <input type="checkbox" checked={bulkSelected.has(reg.id)} onChange={() => toggleBulk(reg.id)} />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>
                      {reg.teamName || <span style={{ color: 'var(--adm-mute)', fontWeight: 400, fontStyle: 'italic' }}>No team name</span>}
                    </td>
                    <td style={tdStyle}>{reg.division}</td>
                    <td style={{ ...tdStyle, color: 'var(--adm-mute)', fontSize: 12 }}>
                      {reg.members.map(m => (
                        <span key={m.id}>
                          {m.name}
                          {m.isSoft && <span style={{ color: '#ffab40', fontSize: 10 }}> (soft)</span>}
                          {m.isAlternate && <span style={{ color: '#64b5f6', fontSize: 10 }}> (alt)</span>}
                          {m.isVideo && <span style={{ color: '#ce93d8', fontSize: 10 }}> (📷)</span>}
                          {', '}
                        </span>
                      ))}
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: `${statusColors[reg.status]}22`, color: statusColors[reg.status], border: `1px solid ${statusColors[reg.status]}44`, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>
                        {reg.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: `${payColors[reg.paymentStatus]}22`, color: payColors[reg.paymentStatus], border: `1px solid ${payColors[reg.paymentStatus]}44`, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>
                        {reg.paymentStatus}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'Bungee', fontStyle: 'italic', color: reg.balance > 0 ? 'var(--sq-yellow)' : 'var(--adm-mute)' }}>
                      {reg.balance > 0 ? `$${reg.balance}` : '—'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {reg.status === 'pending' && <>
                          <button className={`${styles.aqBtn} ${styles.approve}`}>✓</button>
                          <button className={`${styles.aqBtn} ${styles.waitlist}`}>WL</button>
                          <button className={`${styles.aqBtn} ${styles.deny}`}>✕</button>
                        </>}
                        <button className={styles.aqBtn}>···</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TEAMING TAB ── */}
      {tab === 'Teaming' && (
        <TeamingTab registrations={registrations} initialAssignments={TEAM_ASSIGNMENTS.filter(a => a.eventId === instanceId)} teamSize={eventSettings?.defaultTeamSize ?? 4} />
      )}

      {/* ── SCORES TAB ── */}
      {tab === 'Scores' && (
        <ScoresTab eventTypeSlug={event.typeSlug} />
      )}

      {/* ── WAITLIST TAB ── */}
      {tab === 'Waitlist' && (
        <div className={styles.table}>
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--adm-mute)', fontSize: 13 }}>
            No teams on waitlist for this event.
          </div>
        </div>
      )}

      {/* ── PAYMENTS TAB ── */}
      {tab === 'Payments' && (
        <div>
          <div className={styles.toolbar}>
            <span style={{ fontSize: 13, color: 'var(--adm-mute)' }}>
              {registrations.filter(r => r.paymentStatus !== 'paid').length} unpaid / {registrations.length} total
            </span>
            <button className={`${styles.adminBtn} ${styles.primary}`} style={{ marginLeft: 'auto' }}>Export CSV</button>
          </div>
          <div className={styles.table}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Team', 'Division', 'Members', 'Reg Fee', 'Paid', 'Balance', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{reg.teamName}</td>
                    <td style={tdStyle}>{reg.division}</td>
                    <td style={{ ...tdStyle, fontSize: 12, color: 'var(--adm-mute)' }}>
                      {reg.members.map(m => m.name).join(', ')}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'Bungee', fontStyle: 'italic' }}>$120</td>
                    <td style={{ ...tdStyle, fontFamily: 'Bungee', fontStyle: 'italic', color: 'var(--sq-signal)' }}>
                      ${120 - reg.balance}
                    </td>
                    <td style={{ ...tdStyle, fontFamily: 'Bungee', fontStyle: 'italic', color: reg.balance > 0 ? 'var(--sq-yellow)' : 'var(--adm-mute)' }}>
                      {reg.balance > 0 ? `$${reg.balance}` : '—'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {reg.balance > 0 && (
                          <button className={`${styles.aqBtn} ${styles.approve}`}>Record Payment</button>
                        )}
                        <button className={styles.aqBtn}>Void</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PRINTABLES TAB ── */}
      {tab === 'Printables' && (
        <PrintablesTab
          event={event}
          assignments={TEAM_ASSIGNMENTS.filter(a => a.eventId === instanceId)}
          registrations={registrations}
        />
      )}

      {/* ── EMAILS TAB ── */}
      {tab === 'Emails' && (
        <div>
          <div className={styles.toolbar}>
            <span style={{ fontSize: 13, color: 'var(--adm-mute)' }}>
              Event-scoped emails for {event.name}
            </span>
            <button className={`${styles.adminBtn} ${styles.primary}`} style={{ marginLeft: 'auto' }}>+ Compose Email</button>
          </div>
          <div className={styles.table}>
            {[
              { name: 'reg_confirmation', subject: "You're in! — Registration Confirmed", sent: 6, date: 'May 1' },
              { name: 'payment_reminder', subject: 'Reminder: Balance due for Poker Run', sent: 3, date: 'May 6' },
            ].map(email => (
              <div key={email.name} style={{ display: 'flex', gap: 14, padding: '12px 16px', borderBottom: '1px solid var(--adm-border)', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{email.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--adm-mute)', marginTop: 3 }}>{email.subject}</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--adm-mute)' }}>{email.sent} sent · {email.date}</div>
                <button className={styles.adminBtn}>View</button>
                <button className={`${styles.adminBtn} ${styles.primary}`}>Resend</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ── MANUAL REG TAB (Poker Run etc.) ──────────────────────────────────────────

function ManualRegTab({ registrations, eventId }: { registrations: TeamRegistration[], eventId: string }) {
  const [teams, setTeams] = useState(
    registrations.map(r => ({
      id: r.id,
      name: r.teamName,
      members: r.members.map(m => m.name).join(', '),
    }))
  )
  const [newName, setNewName] = useState('')
  const [newMembers, setNewMembers] = useState('')

  function addTeam() {
    if (!newName.trim()) return
    setTeams(prev => [...prev, { id: 'new-' + Date.now(), name: newName.trim(), members: newMembers.trim() }])
    setNewName('')
    setNewMembers('')
  }

  return (
    <div>
      <div style={{ background: 'rgba(255,171,64,.06)', border: '1px solid rgba(255,171,64,.2)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#ffab40' }}>
        Poker Run registration is handled by email outside of Fury. Enter the final team roster manually here.
      </div>

      <div className={styles.table}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Team Name</th>
              <th style={thStyle}>Members</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, idx) => (
              <tr key={team.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                <td style={{ ...tdStyle, minWidth: 160 }}>
                  <input
                    className={styles.inlineInput}
                    value={team.name}
                    onChange={e => setTeams(prev => prev.map((t, i) => i === idx ? { ...t, name: e.target.value } : t))}
                  />
                </td>
                <td style={tdStyle}>
                  <input
                    className={styles.inlineInput}
                    style={{ width: '100%' }}
                    value={team.members}
                    placeholder="Name, Name, Name..."
                    onChange={e => setTeams(prev => prev.map((t, i) => i === idx ? { ...t, members: e.target.value } : t))}
                  />
                </td>
                <td style={tdStyle}>
                  <button
                    className={`${styles.aqBtn} ${styles.deny}`}
                    onClick={() => setTeams(prev => prev.filter((_, i) => i !== idx))}
                  >✕</button>
                </td>
              </tr>
            ))}
            {/* Add row */}
            <tr style={{ borderTop: '1px solid var(--adm-border)', background: 'rgba(255,255,255,.01)' }}>
              <td style={tdStyle}>
                <input
                  className={styles.inlineInput}
                  placeholder="Team name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTeam()}
                />
              </td>
              <td style={tdStyle}>
                <input
                  className={styles.inlineInput}
                  style={{ width: '100%' }}
                  placeholder="Name, Name, Name..."
                  value={newMembers}
                  onChange={e => setNewMembers(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTeam()}
                />
              </td>
              <td style={tdStyle}>
                <button className={`${styles.adminBtn} ${styles.primary}`} onClick={addTeam}>+ Add</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
        <button className={`${styles.adminBtn} ${styles.primary}`}>Save Roster</button>
      </div>
    </div>
  )
}

// ── TEAMING TAB COMPONENT ─────────────────────────────────────────────────────

interface TeamGroup {
  id: string
  customName: string   // empty = use auto name
  division?: Division  // picked day-of, not during registration
  memberIds: string[]
  pendingSlots: string[]   // names of people expected but not yet registered
  videoName: string        // '' = unset
  videoTbd: boolean
}

function makeGroupId() {
  return 'g-' + Math.random().toString(36).slice(2, 8)
}

function firstName(fullName: string) {
  return fullName.split(' ')[0]
}

function autoName(memberIds: string[], regById: Record<string, TeamRegistration>) {
  const names = memberIds
    .map(id => regById[id]?.members[0]?.name)
    .filter(Boolean)
    .map(n => firstName(n!))
  return names.length ? names.join('-') : 'New Team'
}

function TeamingTab({
  registrations,
  initialAssignments,
  teamSize,
}: {
  registrations: TeamRegistration[]
  initialAssignments: TeamAssignment[]
  teamSize: number
}) {
  const regById = Object.fromEntries(registrations.map(r => [r.id, r]))

  const init = {
    groups: [] as TeamGroup[],
    pool: registrations.map(r => r.id),
  }
  const [groups, setGroups] = useState<TeamGroup[]>(init.groups)
  const [pool, setPool] = useState<string[]>(init.pool)
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [nameDraft, setNameDraft] = useState('')
  const [aiSuggesting, setAiSuggesting] = useState(false)
  const [aiSuggested, setAiSuggested] = useState(false)
  const [addingVideoId, setAddingVideoId] = useState<string | null>(null)
  const [videoDraft, setVideoDraft] = useState('')
  const [addingPendingId, setAddingPendingId] = useState<string | null>(null)
  const [pendingDraft, setPendingDraft] = useState('')

  // Drag state — tracked in ref to avoid re-renders during drag
  const dragInfo = useRef<{ source: 'pool' | 'group'; personId: string; fromGroupId?: string } | null>(null)
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null)
  const [dragOverPool, setDragOverPool] = useState(false)

  // ── Drag handlers ──

  function onPersonDragStart(e: React.DragEvent, personId: string, source: 'pool' | 'group', fromGroupId?: string) {
    dragInfo.current = { source, personId, fromGroupId }
    e.dataTransfer.effectAllowed = 'move'
  }

  function onGroupDragOver(e: React.DragEvent, groupId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverGroupId(groupId)
  }

  function onGroupDrop(e: React.DragEvent, targetGroupId: string) {
    e.preventDefault()
    setDragOverGroupId(null)
    const info = dragInfo.current
    if (!info) return
    const { source, personId, fromGroupId } = info
    dragInfo.current = null

    if (source === 'pool') {
      // Move from pool → group
      setPool(prev => prev.filter(id => id !== personId))
      const droppedReg = regById[personId]
      setGroups(prev => prev.map(g => {
        if (g.id !== targetGroupId || g.memberIds.includes(personId)) return g
        const updates: Partial<typeof g> = { memberIds: [...g.memberIds, personId] }
        // Auto-fill video slot if registrant signed up as video and slot is empty
        if (droppedReg?.offeringType === 'video' && !g.videoName && !g.videoTbd) {
          updates.videoName = droppedReg.members[0]?.name ?? ''
        }
        return { ...g, ...updates }
      }))
    } else if (source === 'group' && fromGroupId !== targetGroupId) {
      // Drag from one group to another = COPY (stays in original — multi-team)
      setGroups(prev => prev.map(g =>
        g.id === targetGroupId && !g.memberIds.includes(personId)
          ? { ...g, memberIds: [...g.memberIds, personId] }
          : g
      ))
    }
  }

  function onPoolDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOverPool(true)
  }

  function onPoolDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOverPool(false)
    const info = dragInfo.current
    if (!info || info.source !== 'group' || !info.fromGroupId) return
    const { personId, fromGroupId } = info
    dragInfo.current = null
    // Remove from group, add back to pool
    setGroups(prev => prev.map(g =>
      g.id === fromGroupId
        ? { ...g, memberIds: g.memberIds.filter(id => id !== personId) }
        : g
    ))
    if (!pool.includes(personId)) setPool(prev => [...prev, personId])
  }

  function removeFromGroup(groupId: string, personId: string) {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, memberIds: g.memberIds.filter(id => id !== personId) } : g
    ))
    // Only add back to pool if not in any other group
    const inOtherGroup = groups.some(g => g.id !== groupId && g.memberIds.includes(personId))
    if (!inOtherGroup && !pool.includes(personId)) setPool(prev => [...prev, personId])
  }

  function addGroup() {
    setGroups(prev => [...prev, { id: makeGroupId(), customName: '', memberIds: [], pendingSlots: [], videoName: '', videoTbd: false }])
  }

  function setGroupDivision(groupId: string, div: Division | '') {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, division: div || undefined } : g))
  }

  function moveGroup(groupId: string, dir: 'up' | 'down') {
    setGroups(prev => {
      const idx = prev.findIndex(g => g.id === groupId)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  function setVideoForGroup(groupId: string, name: string) {
    if (!name.trim()) return
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, videoName: name.trim(), videoTbd: false } : g))
    setAddingVideoId(null)
    setVideoDraft('')
  }

  function setVideoTbd(groupId: string) {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, videoTbd: true, videoName: '' } : g))
    setAddingVideoId(null)
    setVideoDraft('')
  }

  function clearVideo(groupId: string) {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, videoName: '', videoTbd: false } : g))
  }

  function addPending(groupId: string, name: string) {
    if (!name.trim()) { setAddingPendingId(null); setPendingDraft(''); return }
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, pendingSlots: [...g.pendingSlots, name.trim()] } : g))
    setAddingPendingId(null)
    setPendingDraft('')
  }

  function removePending(groupId: string, name: string) {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, pendingSlots: g.pendingSlots.filter(n => n !== name) } : g))
  }

  function startRename(groupId: string, currentName: string) {
    setEditingNameId(groupId)
    setNameDraft(currentName)
  }

  function saveRename(groupId: string) {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, customName: nameDraft.trim() } : g))
    setEditingNameId(null)
  }

  function simulateAiSuggest() {
    setAiSuggesting(true)
    setTimeout(() => {
      setAiSuggesting(false)
      setAiSuggested(true)
      const remaining = [...pool]
      const newGroups: TeamGroup[] = []
      while (remaining.length >= 2) {
        const batch = remaining.splice(0, 4)
        newGroups.push({ id: makeGroupId(), customName: '', memberIds: batch, pendingSlots: [], videoName: '', videoTbd: false })
      }
      setGroups(prev => [...prev, ...newGroups])
      setPool(remaining)
    }, 1500)
  }

  const visiblePool = pool
  const visibleGroups = groups

  // People assigned to multiple groups
  const multiTeamIds = new Set(
    groups.flatMap(g => g.memberIds).filter(id => groups.filter(g => g.memberIds.includes(id)).length > 1)
  )

  return (
    <div className={teamStyles.container}>
      <div className={teamStyles.header}>
        <div className={teamStyles.headerLeft}>
          <span className={teamStyles.badge} style={{ background: visiblePool.length > 0 ? 'rgba(255,171,64,.15)' : 'rgba(76,175,80,.15)', color: visiblePool.length > 0 ? '#ffab40' : '#81c784' }}>
            {visiblePool.length > 0 ? `${visiblePool.length} in pool` : '✓ Everyone assigned'}
          </span>
          <span className={teamStyles.badge} style={{ background: 'rgba(255,255,255,.06)', color: 'var(--adm-mute)' }}>
            {visibleGroups.length} {visibleGroups.length === 1 ? 'team' : 'teams'}
          </span>
        </div>
        <div className={teamStyles.headerRight}>
          <button className={teamStyles.aiBtn} onClick={simulateAiSuggest} disabled={aiSuggesting || visiblePool.length === 0}>
            {aiSuggesting ? '✦ Thinking...' : aiSuggested ? '✦ Re-suggest' : '✦ AI Suggest'}
          </button>
          <button className={teamStyles.btnGhost} onClick={addGroup}>+ New Team</button>
        </div>
      </div>

      {aiSuggested && (
        <div className={teamStyles.aiNote}>
          ✦ Grouped unassigned people by teammate notes. Existing teams untouched — drag to adjust, or drop onto another team to add to both (multi-team).
        </div>
      )}

      <div className={teamStyles.layout}>
        {/* Left: Pool */}
        <div
          className={`${teamStyles.pool} ${dragOverPool ? teamStyles.poolDragOver : ''}`}
          onDragOver={onPoolDragOver}
          onDragLeave={() => setDragOverPool(false)}
          onDrop={onPoolDrop}
        >
          <div className={teamStyles.poolHeader}>
            Unassigned · {visiblePool.length}
            <span className={teamStyles.poolHint}>drag to a team →</span>
          </div>

          {visiblePool.length === 0 ? (
            <div className={teamStyles.poolEmpty}>✓ Everyone is on a team</div>
          ) : visiblePool.map(regId => {
            const reg = regById[regId]
            if (!reg) return null
            return (
              <div
                key={regId}
                className={teamStyles.regCard}
                draggable
                onDragStart={e => onPersonDragStart(e, regId, 'pool')}
                onDragEnd={() => { dragInfo.current = null }}
              >
                <div className={teamStyles.regName}>
                  <span className={teamStyles.dragHandle}>⠿</span>
                  {reg.members[0]?.name}
                  {reg.offeringType === 'video' && <span className={teamStyles.offeringVideo}>📷 video</span>}
                  {reg.offeringType === 'captain' && <span className={teamStyles.offeringCaptain}>⭐ captain</span>}
                </div>
                {reg.teammateNote && (
                  <div className={teamStyles.regNote}>"{reg.teammateNote}"</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right: Teams */}
        <div className={teamStyles.teams}>
          {visibleGroups.map((group, groupIdx) => {
            const displayName = group.customName || autoName(group.memberIds, regById)
            const isOver = dragOverGroupId === group.id
            const memberCount = group.memberIds.length + group.pendingSlots.length
            const sizeClass = memberCount === 0 ? '' : memberCount < teamSize ? teamStyles.sizeUnder : memberCount === teamSize ? teamStyles.sizeFull : teamStyles.sizeOver
            return (
              <div
                key={group.id}
                className={`${teamStyles.groupCard} ${isOver ? teamStyles.groupDragOver : ''}`}
                onDragOver={e => onGroupDragOver(e, group.id)}
                onDragLeave={() => setDragOverGroupId(null)}
                onDrop={e => onGroupDrop(e, group.id)}
              >
                <div className={teamStyles.groupRow}>
                  {/* Slot badge — click to rename */}
                  <div
                    className={teamStyles.slotBadge}
                    title={`#${groupIdx + 1}: ${displayName} — click to rename`}
                    onClick={() => startRename(group.id, group.customName)}
                    style={{ cursor: 'pointer' }}
                  >{groupIdx + 1}</div>

                  {/* Size indicator */}
                  {memberCount > 0 && (
                    <div className={`${teamStyles.sizeIndicator} ${sizeClass}`} title={memberCount < teamSize ? 'Needs more people' : memberCount > teamSize ? 'Overfull' : 'Full!'}>
                      {memberCount}/{teamSize}
                    </div>
                  )}

                  {/* Chips */}
                  <div className={teamStyles.chipRow}>
                    {group.memberIds.length === 0 && group.pendingSlots.length === 0 ? (
                      <div className={teamStyles.emptyGroup}>Drop here</div>
                    ) : (
                      <>
                        {group.memberIds.map(personId => {
                          const reg = regById[personId]
                          if (!reg) return null
                          const isMulti = multiTeamIds.has(personId)
                          return (
                            <div
                              key={personId}
                              className={`${teamStyles.memberChip} ${isMulti ? teamStyles.memberChipMulti : ''}`}
                              draggable
                              onDragStart={e => onPersonDragStart(e, personId, 'group', group.id)}
                              onDragEnd={() => { dragInfo.current = null; setDragOverGroupId(null) }}
                            >
                              <span className={teamStyles.dragHandle}>⠿</span>
                              <span className={teamStyles.memberChipName}>{reg.members[0]?.name}</span>
                              {reg.offeringType === 'video' && <span className={teamStyles.chipOfferingVideo}>📷</span>}
                              {reg.offeringType === 'captain' && <span className={teamStyles.chipOfferingCaptain}>⭐</span>}
                              {isMulti && <span className={teamStyles.multiTag} title="On multiple teams">×2</span>}
                              <button
                                className={teamStyles.chipRemove}
                                onClick={e => { e.stopPropagation(); removeFromGroup(group.id, personId) }}
                              >×</button>
                              {reg.teammateNote && (
                                <div className={teamStyles.chipNote}>"{reg.teammateNote}"</div>
                              )}
                            </div>
                          )
                        })}
                        {group.pendingSlots.map(name => (
                          <div key={name} className={teamStyles.pendingChip}>
                            <span className={teamStyles.pendingIcon}>?</span>
                            <span className={teamStyles.memberChipName}>{name}</span>
                            <span className={teamStyles.pendingTag}>pending</span>
                            <button className={teamStyles.chipRemove} onClick={e => { e.stopPropagation(); removePending(group.id, name) }}>×</button>
                          </div>
                        ))}
                      </>
                    )}
                    {addingPendingId === group.id ? (
                      <input
                        className={teamStyles.inlineChipInput}
                        placeholder="Name..."
                        autoFocus
                        value={pendingDraft}
                        onChange={e => setPendingDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addPending(group.id, pendingDraft); if (e.key === 'Escape') { setAddingPendingId(null); setPendingDraft('') } }}
                        onBlur={() => addPending(group.id, pendingDraft)}
                      />
                    ) : (
                      <button className={teamStyles.addSlotBtn} onClick={() => setAddingPendingId(group.id)}>+ Pending</button>
                    )}

                    {/* Video — inline */}
                    <div className={teamStyles.videoInline}>
                      <span className={teamStyles.videoLabel}>📷</span>
                      {group.videoTbd ? (
                        <div className={teamStyles.videoChip}>
                          <span className={teamStyles.videoTbdText}>TBD</span>
                          <button className={teamStyles.chipRemove} onClick={() => clearVideo(group.id)}>×</button>
                        </div>
                      ) : group.videoName ? (
                        <div className={teamStyles.videoChip}>
                          <span>{group.videoName}</span>
                          <button className={teamStyles.chipRemove} onClick={() => clearVideo(group.id)}>×</button>
                        </div>
                      ) : addingVideoId === group.id ? (
                        <div className={teamStyles.videoInputRow}>
                          <input
                            className={teamStyles.inlineChipInput}
                            placeholder="Video person..."
                            autoFocus
                            value={videoDraft}
                            onChange={e => setVideoDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') setVideoForGroup(group.id, videoDraft); if (e.key === 'Escape') { setAddingVideoId(null); setVideoDraft('') } }}
                          />
                          <button className={teamStyles.videoTbdBtn} onClick={() => setVideoTbd(group.id)}>TBD</button>
                          <button className={teamStyles.chipRemove} onClick={() => { setAddingVideoId(null); setVideoDraft('') }}>×</button>
                        </div>
                      ) : (
                        <button className={teamStyles.addVideoBtn} onClick={() => setAddingVideoId(group.id)}>+ video</button>
                      )}
                    </div>
                  </div>

                  {/* Name edit / custom name label */}
                  {editingNameId === group.id ? (
                    <input
                      className={teamStyles.nameInput}
                      value={nameDraft}
                      autoFocus
                      onChange={e => setNameDraft(e.target.value)}
                      onBlur={() => saveRename(group.id)}
                      onKeyDown={e => { if (e.key === 'Enter') saveRename(group.id); if (e.key === 'Escape') setEditingNameId(null) }}
                      placeholder={autoName(group.memberIds, regById)}
                    />
                  ) : group.customName ? (
                    <div
                      className={teamStyles.groupName}
                      onClick={() => startRename(group.id, group.customName)}
                      title="Click to rename"
                    >
                      {group.customName}
                    </div>
                  ) : null}

                  <div className={teamStyles.groupActions}>
                    <select
                      className={`${teamStyles.divisionSelect} ${group.division ? teamStyles.divisionSelectSet : ''}`}
                      value={group.division ?? ''}
                      onChange={e => setGroupDivision(group.id, e.target.value as Division | '')}
                      title="Pick division day-of"
                    >
                      <option value="">Div?</option>
                      {(['AAA', 'AA', 'A', 'Rookie'] as Division[]).map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <button className={teamStyles.moveBtn} onClick={() => moveGroup(group.id, 'up')} title="Move up" disabled={groupIdx === 0}>↑</button>
                    <button className={teamStyles.moveBtn} onClick={() => moveGroup(group.id, 'down')} title="Move down" disabled={groupIdx === visibleGroups.length - 1}>↓</button>
                    <button
                      className={teamStyles.deleteGroupBtn}
                      onClick={() => {
                        const returning = group.memberIds.filter(id => !groups.some(g => g.id !== group.id && g.memberIds.includes(id)))
                        setPool(prev => [...prev, ...returning.filter(id => !prev.includes(id))])
                        setGroups(prev => prev.filter(g => g.id !== group.id))
                      }}
                    >✕</button>
                  </div>
                </div>
              </div>
            )
          })}

          {visibleGroups.length === 0 && (
            <div className={teamStyles.noGroups}>
              Click "+ New Team" or "✦ AI Suggest" to start grouping.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── SCORES TAB COMPONENT ──────────────────────────────────────────────────────


const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  color: 'var(--adm-mute)',
  fontFamily: 'Bungee, sans-serif',
  fontStyle: 'italic',
  fontSize: 11,
  borderBottom: '1px solid var(--adm-border)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  background: 'rgba(255,255,255,.02)',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 13,
  color: 'var(--adm-ink)',
  verticalAlign: 'middle',
}
