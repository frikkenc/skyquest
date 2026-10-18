import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { EVENT_INSTANCES } from '../data/mockData'
import type { TeamingDoc } from '../types'
import { loadTeamingDoc } from '../hooks/useTeamingDoc'
import { useAuth } from '../hooks/useAuth'
import { useJumpNumbers, adminSetJumps, submitJumpNumbers, type JumpsByReg } from '../hooks/useJumpNumbers'

/**
 * /jumps/:instanceId — each jumper enters their own jump number, identified by
 * the email they registered with. The email is matched server-side
 * (submitJumpNumbers) so the roster's emails never reach this public page.
 *
 * A signed-in admin also gets the whole roster below the form, every number
 * editable in place — for the people who show up without their phone.
 */
export default function JumpsPage() {
  const { instanceId = '' } = useParams<{ instanceId: string }>()
  const event = EVENT_INSTANCES.find(e => e.id === instanceId)
  const { user } = useAuth()
  const byReg = useJumpNumbers(instanceId)

  if (!event) {
    return <Shell><p style={{ padding: 32, textAlign: 'center' }}>Event not found.</p></Shell>
  }

  const eventDate = new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <Shell wide={!!user}>
      <div style={{ background: '#1a1a1a', borderBottom: '3px solid #d81818', padding: '18px 20px 16px' }}>
        <div style={{ fontSize: 11, color: '#888', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>Jump Numbers</div>
        <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.1 }}>{event.name}</div>
        <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>{eventDate} · {event.dropzone}</div>
      </div>

      <SelfEntry instanceId={instanceId} />

      {user && <AdminRoster instanceId={instanceId} byReg={byReg} />}

      <div style={{ textAlign: 'center', padding: '8px 0 24px', fontSize: 11, color: '#444' }}>SoCal SkyQuest</div>
    </Shell>
  )
}

function Shell({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: wide ? 760 : 540, margin: '0 auto' }}>{children}</div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', fontSize: 18, background: '#1c1c1c',
  border: '1px solid #3a3a3a', borderRadius: 8, color: '#fff', padding: '13px 14px', outline: 'none',
}

// ── Self-entry ─────────────────────────────────────────────────────────────────

function SelfEntry({ instanceId }: { instanceId: string }) {
  const [email, setEmail] = useState('')
  const [jumps, setJumps] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [choices, setChoices] = useState<{ regId: string; name: string }[] | null>(null)
  const [savedFor, setSavedFor] = useState<{ name: string; jumps: number } | null>(null)

  const n = parseInt(jumps, 10)
  const ready = /\S+@\S+\.\S+/.test(email.trim()) && n > 0

  async function submit(regId?: string) {
    if (!ready || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await submitJumpNumbers({ instanceId, email: email.trim(), jumps: n, ...(regId ? { regId } : {}) })
      if (res.data.status === 'choose') {
        setChoices(res.data.options)
      } else {
        setChoices(null)
        setSavedFor({ name: res.data.names[0] || 'you', jumps: n })
      }
    } catch (e) {
      setError((e as { message?: string }).message || 'Could not save — check your signal and try again.')
    } finally {
      setSaving(false)
    }
  }

  if (savedFor) {
    return (
      <div style={{ padding: '36px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, lineHeight: 1, color: '#5fe87e', marginBottom: 10 }}>✓</div>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>Saved for {savedFor.name}</div>
        <div style={{ fontSize: 15, color: '#aaa', marginBottom: 26 }}>{savedFor.jumps.toLocaleString()} jumps</div>
        <button onClick={() => { setSavedFor(null); setEmail(''); setJumps('') }}
          style={{ background: 'none', border: '1px solid #333', borderRadius: 8, color: '#aaa', padding: '11px 24px', fontSize: 14, cursor: 'pointer' }}>
          Enter another jumper
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '18px 16px 28px' }}>
      <p style={{ fontSize: 13, color: '#888', margin: '0 0 18px', lineHeight: 1.6 }}>
        Enter the email you registered with and your <strong style={{ color: '#bbb' }}>total jump count as of today</strong>.
        It sets your team's handicap. Re-submit any time to fix it.
      </p>

      <label style={{ display: 'block', fontSize: 11, color: '#888', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>Registration email</label>
      <input type="email" autoComplete="email" inputMode="email" value={email}
        onChange={e => { setEmail(e.target.value); setChoices(null) }}
        placeholder="you@example.com" style={{ ...inputStyle, marginBottom: 16 }} />

      <label style={{ display: 'block', fontSize: 11, color: '#888', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>Total jumps</label>
      <input type="number" inputMode="numeric" min={1} value={jumps}
        onChange={e => setJumps(e.target.value.replace(/\D/g, ''))}
        onKeyDown={e => { if (e.key === 'Enter') submit() }}
        placeholder="—" style={{ ...inputStyle, fontSize: 26, fontWeight: 700, textAlign: 'center', marginBottom: 20 }} />

      {choices ? (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: '#bbb', marginBottom: 10 }}>That email is on more than one registration. Who is this for?</div>
          {choices.map(c => (
            <button key={c.regId} onClick={() => submit(c.regId)} disabled={saving}
              style={{ display: 'block', width: '100%', marginBottom: 8, padding: '14px', borderRadius: 10, border: '1px solid #2a6c2a', background: '#1a2e1a', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              {c.name || 'Unnamed'}
            </button>
          ))}
        </div>
      ) : (
        <button onClick={() => submit()} disabled={!ready || saving}
          style={{
            width: '100%', padding: '17px', borderRadius: 10, border: 'none',
            background: ready ? '#1a5c2a' : '#222', color: ready ? '#fff' : '#555',
            fontSize: 16, fontWeight: 800, cursor: ready && !saving ? 'pointer' : 'not-allowed',
            letterSpacing: '.05em', textTransform: 'uppercase',
          }}>
          {saving ? 'Saving…' : 'Submit'}
        </button>
      )}

      {error && <p style={{ textAlign: 'center', fontSize: 13, color: '#ff6b6b', marginTop: 12 }}>{error}</p>}
    </div>
  )
}

// ── Admin: everyone, editable ──────────────────────────────────────────────────

function AdminRoster({ instanceId, byReg }: { instanceId: string; byReg: JumpsByReg | null }) {
  const [tdoc, setTdoc] = useState<TeamingDoc | null | undefined>(undefined)
  useEffect(() => {
    loadTeamingDoc(instanceId).then(setTdoc).catch(() => setTdoc(null))
  }, [instanceId])

  if (tdoc === undefined || byReg === null) {
    return <div style={{ padding: 20, color: '#666', fontSize: 13 }}>Loading roster…</div>
  }
  if (!tdoc) {
    return <div style={{ padding: 20, color: '#666', fontSize: 13 }}>No teams saved for this event yet.</div>
  }

  const name = (id: string) => tdoc.memberNames[id] || '—'
  const teams = tdoc.groups
    .filter(g => g.memberIds.length > 0)
    .map((g, i) => {
      const ids = g.memberIds.filter(id => id !== g.videoMemberId)
      return { id: g.id, label: g.customName || ids.map(id => name(id).split(' ')[0]).join('-') || `Team ${i + 1}`, ids }
    })
  const people = teams.flatMap(t => t.ids)
  const entered = people.filter(id => byReg[id]?.jumps).length

  return (
    <div style={{ borderTop: '1px solid #2a2a2a', padding: '18px 16px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#64b5f6', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>Admin · everyone</span>
        <span style={{ fontSize: 12, color: '#888' }}>{entered}/{people.length} entered · saves when you leave a box</span>
      </div>

      {teams.map(t => {
        const total = t.ids.reduce((s, id) => s + (byReg[id]?.jumps ?? 0), 0)
        const missing = t.ids.filter(id => !byReg[id]?.jumps).length
        return (
          <div key={t.id} style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#1c1c1c' }}>
              <span style={{ fontWeight: 800, fontSize: 15, flex: 1 }}>{t.label}</span>
              {missing > 0
                ? <span style={{ fontSize: 11, color: '#ff7043', fontWeight: 700 }}>{missing} missing</span>
                : <span style={{ fontSize: 11, color: '#5fe87e', fontWeight: 700 }}>✓ complete</span>}
              <span style={{ fontSize: 13, color: '#aaa', minWidth: 70, textAlign: 'right' }}>{total.toLocaleString()}</span>
            </div>
            {t.ids.map(id => (
              <AdminRow key={id} instanceId={instanceId} regId={id} name={name(id)} entry={byReg[id]} />
            ))}
          </div>
        )
      })}

      {tdoc.pool.length > 0 && (
        <div style={{ background: '#161616', border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '10px 14px', background: '#1c1c1c', fontWeight: 800, fontSize: 15, color: '#888' }}>Not on a team</div>
          {tdoc.pool.map(id => (
            <AdminRow key={id} instanceId={instanceId} regId={id} name={name(id)} entry={byReg[id]} />
          ))}
        </div>
      )}
    </div>
  )
}

function AdminRow({ instanceId, regId, name, entry }: {
  instanceId: string; regId: string; name: string; entry?: JumpsByReg[string]
}) {
  const current = entry?.jumps ? String(entry.jumps) : ''
  const [val, setVal] = useState(current)
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle')
  const [focused, setFocused] = useState(false)

  // Follow live updates (a jumper submitting from their phone) unless the
  // admin is mid-edit in this box.
  useEffect(() => { if (!focused) setVal(current) }, [current, focused])

  function commit() {
    setFocused(false)
    if (val === current) return
    setState('saving')
    adminSetJumps(instanceId, regId, parseInt(val, 10) || 0)
      .then(() => setState('idle'))
      .catch(() => setState('error'))
  }

  const by = entry?.jumps ? ({ self: 'self', team: 'team', admin: 'admin' } as const)[entry.by] : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderTop: '1px solid #222' }}>
      <span style={{ flex: 1, minWidth: 0, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ fontSize: 10, color: state === 'error' ? '#ff6b6b' : '#555', width: 52, textAlign: 'right' }}>
        {state === 'saving' ? 'saving…' : state === 'error' ? 'not saved' : by}
      </span>
      <input type="number" inputMode="numeric" min={0} value={val}
        onFocus={() => setFocused(true)}
        onChange={e => setVal(e.target.value.replace(/\D/g, ''))}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
        placeholder="—"
        style={{
          width: 96, textAlign: 'center', fontSize: 16, fontWeight: 700,
          background: val ? '#1a2e1a' : '#222', border: `1px solid ${val ? '#2a6c2a' : '#3a3a3a'}`,
          borderRadius: 6, color: val ? '#5fe87e' : '#666', padding: '7px 4px', outline: 'none',
        }} />
    </div>
  )
}
