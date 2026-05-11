import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { EVENT_INSTANCES } from '../data/mockData'
import type { TeamAssignment, TeamRegistration } from '../types'

type JumpData = Record<string, number[]>  // assignmentId → per-member jump counts

function lsKey(instanceId: string) { return `sq-jumps-${instanceId}` }
function loadJumps(id: string): JumpData { try { return JSON.parse(localStorage.getItem(lsKey(id)) ?? '{}') } catch { return {} } }
function saveJumps(id: string, data: JumpData) { localStorage.setItem(lsKey(id), JSON.stringify(data)) }

export default function CheckInPage() {
  const { instanceId = '' } = useParams<{ instanceId: string }>()
  const event = EVENT_INSTANCES.find(e => e.id === instanceId)
  const allRegs: TeamRegistration[] = []
  const regById = Object.fromEntries(allRegs.map(r => [r.id, r])) as Record<string, TeamRegistration>
  const teams: TeamAssignment[] = []

  const [view, setView] = useState<'list' | 'entry' | 'done'>('list')
  const [selected, setSelected] = useState<TeamAssignment | null>(null)
  const [jumps, setJumps] = useState<number[]>([])
  const [allJumps, setAllJumps] = useState<JumpData>(() => loadJumps(instanceId))

  useEffect(() => {
    if (selected) {
      const existing = allJumps[selected.id]
      setJumps(existing ? [...existing] : Array(selected.memberIds.length).fill(0))
    }
  }, [selected])

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', background: '#111', color: '#fff', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <p>Event not found.</p>
      </div>
    )
  }

  function selectTeam(team: TeamAssignment) {
    setSelected(team)
    setView('entry')
  }

  function submit() {
    if (!selected) return
    const updated = { ...allJumps, [selected.id]: [...jumps] }
    saveJumps(instanceId, updated)
    setAllJumps(updated)
    setView('done')
  }

  function memberNames(team: TeamAssignment) {
    return team.memberIds.map(id => regById[id]?.members[0]?.name ?? '—')
  }

  const eventDate = new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // ── List ──────────────────────────────────────────────────────────────────────
  if (view === 'list') {
    const checkedIn = teams.filter(t => allJumps[t.id]).length
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'Arial, sans-serif', maxWidth: 540, margin: '0 auto' }}>
        <div style={{ background: '#1a1a1a', borderBottom: '3px solid #d81818', padding: '18px 20px 16px' }}>
          <div style={{ fontSize: 11, color: '#888', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Jump Number Check-In</div>
          <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>{event.name}</div>
          <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>{eventDate} · {event.dropzone}</div>
        </div>

        <div style={{ padding: '16px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 12, color: '#888', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            {teams.length} Team{teams.length !== 1 ? 's' : ''} — Tap yours
          </div>
          {checkedIn > 0 && (
            <div style={{ fontSize: 12, color: '#5fe87e' }}>✓ {checkedIn}/{teams.length} checked in</div>
          )}
        </div>

        <div style={{ padding: '0 16px 40px' }}>
          {teams.map((team, i) => {
            const names = memberNames(team)
            const done = !!allJumps[team.id]
            const totalJumps = done ? allJumps[team.id].reduce((s, n) => s + (n || 0), 0) : 0
            return (
              <div key={team.id} onClick={() => selectTeam(team)}
                style={{
                  background: done ? 'rgba(26,92,42,.25)' : '#1e1e1e',
                  border: `1px solid ${done ? '#2a6c2a' : '#2a2a2a'}`,
                  borderRadius: 10, padding: '14px 16px', marginBottom: 10, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 3 }}>
                    {team.teamName || `Team ${i + 1}`}
                  </div>
                  <div style={{ fontSize: 12, color: '#777', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {names.join(' · ')}
                  </div>
                </div>
                {done
                  ? <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 11, background: 'rgba(26,92,42,.8)', color: '#5fe87e', padding: '3px 8px', borderRadius: 4, fontWeight: 700, marginBottom: 2 }}>✓ Done</div>
                      <div style={{ fontSize: 10, color: '#666' }}>{totalJumps.toLocaleString()} jumps</div>
                    </div>
                  : <span style={{ fontSize: 22, color: '#444', flexShrink: 0 }}>›</span>
                }
              </div>
            )
          })}

          {teams.length === 0 && (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px 20px', fontSize: 14 }}>
              No teams assigned yet.
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', padding: '0 0 24px', fontSize: 11, color: '#444' }}>
          SoCal SkyQuest · furycoaching.com/socal-skyquest
        </div>
      </div>
    )
  }

  // ── Entry ─────────────────────────────────────────────────────────────────────
  if (view === 'entry' && selected) {
    const names = memberNames(selected)
    const label = selected.teamName || `Team ${teams.indexOf(selected) + 1}`
    const sumJumps = jumps.reduce((s, n) => s + (n || 0), 0)
    const allFilled = jumps.length > 0 && jumps.every(j => j > 0)

    return (
      <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'Arial, sans-serif', maxWidth: 540, margin: '0 auto' }}>
        <div style={{ background: '#1a1a1a', borderBottom: '3px solid #d81818', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setView('list')}
            style={{ background: 'none', border: 'none', color: '#888', fontSize: 24, cursor: 'pointer', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}>‹</button>
          <div>
            <div style={{ fontSize: 11, color: '#888', letterSpacing: '.08em', textTransform: 'uppercase' }}>Jump Numbers</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{label}</div>
          </div>
        </div>

        <div style={{ padding: '14px 16px 0' }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
            Enter each jumper's <strong style={{ color: '#bbb' }}>current total jump count</strong> as of today. Check your logbook or USPA app if unsure.
          </p>

          {names.map((name, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, background: '#1c1c1c', borderRadius: 10, padding: '12px 16px', border: '1px solid #2a2a2a' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{name}</div>
                <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>Jumper {i + 1}</div>
              </div>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={jumps[i] || ''}
                onChange={e => {
                  const v = Math.max(0, parseInt(e.target.value) || 0)
                  setJumps(prev => { const n = [...prev]; n[i] = v; return n })
                }}
                placeholder="—"
                style={{
                  width: 100, textAlign: 'center', fontSize: 24, fontWeight: 700,
                  background: jumps[i] ? '#1a2e1a' : '#222',
                  border: `1px solid ${jumps[i] ? '#2a6c2a' : '#3a3a3a'}`,
                  borderRadius: 8, color: jumps[i] ? '#5fe87e' : '#666',
                  padding: '10px 6px', outline: 'none',
                  // hide spinners
                  MozAppearance: 'textfield',
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>

        <div style={{ padding: '16px 16px 40px' }}>
          {sumJumps > 0 && (
            <div style={{ textAlign: 'center', fontSize: 12, color: '#666', marginBottom: 14 }}>
              Team total: <strong style={{ color: '#aaa' }}>{sumJumps.toLocaleString()}</strong> jumps
            </div>
          )}
          <button onClick={submit}
            disabled={!allFilled}
            style={{
              width: '100%', padding: '17px', borderRadius: 10, border: 'none',
              background: allFilled ? '#1a5c2a' : '#222',
              color: allFilled ? '#fff' : '#555',
              fontSize: 16, fontWeight: 800, cursor: allFilled ? 'pointer' : 'not-allowed',
              letterSpacing: '.05em', textTransform: 'uppercase',
            }}>
            Submit Jump Numbers
          </button>
          {!allFilled && (
            <p style={{ textAlign: 'center', fontSize: 11, color: '#555', marginTop: 8 }}>
              Enter all {names.length} jump numbers to continue
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Done ──────────────────────────────────────────────────────────────────────
  if (view === 'done' && selected) {
    const label = selected.teamName || `Team ${teams.indexOf(selected) + 1}`
    const names = memberNames(selected)
    const savedJumps = allJumps[selected.id] ?? []
    const total = savedJumps.reduce((s, n) => s + (n || 0), 0)

    return (
      <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'Arial, sans-serif', maxWidth: 540, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
        <div style={{ fontSize: 64, marginBottom: 12, lineHeight: 1, color: '#5fe87e' }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 28 }}>Jump numbers recorded</div>

        <div style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: 12, padding: '16px 20px', width: '100%', maxWidth: 340, marginBottom: 24 }}>
          {names.map((name, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < names.length - 1 ? '1px solid #232323' : 'none' }}>
              <span style={{ fontSize: 14 }}>{name}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#5fe87e' }}>{(savedJumps[i] ?? 0).toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginTop: 4, borderTop: '1px solid #2a2a2a' }}>
            <span style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '.05em' }}>Team total</span>
            <span style={{ fontSize: 16, fontWeight: 700 }}>{total.toLocaleString()}</span>
          </div>
        </div>

        <button onClick={() => setView('entry')}
          style={{ background: 'none', border: '1px solid #333', borderRadius: 8, color: '#888', padding: '11px 24px', fontSize: 14, cursor: 'pointer', marginBottom: 10, width: '100%', maxWidth: 220 }}>
          Edit numbers
        </button>
        <button onClick={() => setView('list')}
          style={{ background: 'none', border: 'none', color: '#555', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
          Back to all teams
        </button>

        <div style={{ marginTop: 48, fontSize: 11, color: '#333' }}>
          SoCal SkyQuest · furycoaching.com/socal-skyquest
        </div>
      </div>
    )
  }

  return null
}
