import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { EVENT_INSTANCES, POKER_RUN_SEEDS } from '../../data/mockData'
import type { PublishedEventResult, PublishedTeamResult } from '../../types'
import styles from './AdminEventInstance.module.css'

/**
 * Poker Run scoring tab.
 *
 * Mirrors the SCSL ScoresTab shape (per-round cells, click-to-edit, Publish
 * writes to results_2026), but tailored:
 *   - Single division ('Open') — no AAA/AA/A split.
 *   - Handicap column per team (display-only by default; raw round sum is
 *     used as the team's total unless the photo-data contradicts that — if it
 *     does, change `effectiveTotal` to subtract handicap and add a comment.).
 *   - Larger teams (6 members + 1 video) and no busts field.
 *   - Add/edit/remove teams inline — Poker Run rosters aren't pre-staged in
 *     EVENT_RESULTS like SCSL's are.
 *
 * Data flow:
 *   1. On mount, load from localStorage `sq-pokerrun-{instanceId}` if present.
 *   2. Otherwise seed from `POKER_RUN_SEEDS[instanceId]` (curated mock data).
 *   3. Save-as-you-go to localStorage; Publish writes the rolled-up
 *      PublishedEventResult to Firestore `results_2026/{instanceId}`.
 */

const RANKING_POINTS = [150, 120, 100, 80, 65, 55, 45, 35, 25, 15]
function rankingPoints(rank: number) { return RANKING_POINTS[rank - 1] ?? 10 }

interface PokerTeam {
  teamId: string
  teamName: string
  handicap: number
  members: { id: string; name: string }[]
  videoName?: string
  scores: number[]
}

interface PokerState {
  rounds: number
  teams: PokerTeam[]
}

function localKey(instanceId: string) {
  return `sq-pokerrun-${instanceId}`
}

function loadLocal(instanceId: string): PokerState | null {
  try {
    const raw = localStorage.getItem(localKey(instanceId))
    if (!raw) return null
    return JSON.parse(raw) as PokerState
  } catch { return null }
}

function saveLocal(instanceId: string, state: PokerState) {
  try { localStorage.setItem(localKey(instanceId), JSON.stringify(state)) } catch { /* quota */ }
}

function makeTeamId() {
  // Short, URL-safe-ish; doesn't need to be cryptographic.
  return `pr-${Math.random().toString(36).slice(2, 10)}`
}

function slugMemberId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'unnamed'
}

function emptyTeam(): PokerTeam {
  return {
    teamId: makeTeamId(),
    teamName: '',
    handicap: 0,
    members: [],
    videoName: '',
    scores: [],
  }
}

function totalFor(t: PokerTeam, rounds: number) {
  let s = 0
  for (let i = 0; i < rounds; i++) s += t.scores[i] ?? 0
  return s
}

export default function AdminScoresPokerRun({ instanceId }: { instanceId: string }) {
  const event = EVENT_INSTANCES.find(e => e.id === instanceId)

  const initial: PokerState = (() => {
    const fromLocal = loadLocal(instanceId)
    if (fromLocal) return fromLocal
    const seed = POKER_RUN_SEEDS[instanceId]
    if (seed) return { rounds: seed.rounds, teams: seed.teams.map(t => ({ ...t })) }
    return { rounds: 3, teams: [] }
  })()

  const [rounds, setRoundsState] = useState(initial.rounds)
  const [teams, setTeamsState] = useState<PokerTeam[]>(initial.teams)
  const [editCell, setEditCell] = useState<{ teamId: string; round: number } | null>(null)
  const [editVal, setEditVal] = useState('')
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null)
  const [saved, setSaved] = useState(true)  // starts in saved state since we just loaded
  const [published, setPublished] = useState(false)

  function commit(next: { rounds?: number; teams?: PokerTeam[] }) {
    const merged: PokerState = {
      rounds: next.rounds ?? rounds,
      teams: next.teams ?? teams,
    }
    if (next.rounds != null) setRoundsState(merged.rounds)
    if (next.teams != null) setTeamsState(merged.teams)
    saveLocal(instanceId, merged)
    setSaved(false)
    setPublished(false)
  }

  function setRounds(n: number) {
    const clamped = Math.max(1, Math.min(10, n))
    commit({ rounds: clamped })
  }

  function startEdit(teamId: string, round: number) {
    const t = teams.find(x => x.teamId === teamId)
    if (!t) return
    setEditCell({ teamId, round })
    const v = t.scores[round]
    setEditVal(v != null && v !== 0 ? String(v) : '')
  }

  function commitScore() {
    if (!editCell) return
    const num = parseInt(editVal, 10)
    const next = teams.map(t => {
      if (t.teamId !== editCell.teamId) return t
      const scores = [...t.scores]
      while (scores.length <= editCell.round) scores.push(0)
      scores[editCell.round] = isNaN(num) ? 0 : Math.max(0, num)
      return { ...t, scores }
    })
    commit({ teams: next })
    setEditCell(null)
    setEditVal('')
  }

  function onScoreKey(e: React.KeyboardEvent, teamId: string, round: number) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      commitScore()
      if (round < rounds - 1) {
        startEdit(teamId, round + 1)
      } else {
        const ids = teams.map(t => t.teamId)
        const next = ids[ids.indexOf(teamId) + 1]
        if (next) startEdit(next, 0)
      }
    }
    if (e.key === 'Escape') { setEditCell(null); setEditVal('') }
  }

  function addTeam() {
    const t = emptyTeam()
    commit({ teams: [...teams, t] })
    setEditingTeamId(t.teamId)
  }

  function removeTeam(teamId: string) {
    if (!confirm('Remove this team and all its scores?')) return
    commit({ teams: teams.filter(t => t.teamId !== teamId) })
  }

  function updateTeam(teamId: string, patch: Partial<PokerTeam>) {
    commit({ teams: teams.map(t => t.teamId === teamId ? { ...t, ...patch } : t) })
  }

  function publishResults() {
    if (!event) {
      alert('Event not found — cannot publish.')
      return
    }

    const ranked = teams
      .map(t => ({ t, total: totalFor(t, rounds) }))
      .sort((a, b) => b.total - a.total)

    const publishedTeams: PublishedTeamResult[] = ranked.map(({ t, total }, i) => ({
      rank: i + 1,
      teamId: t.teamId,
      teamName: t.teamName || 'Unnamed Team',
      members: t.members,
      division: 'Open',
      rawScore: total,
      rankingPoints: rankingPoints(i + 1),
    }))

    const result: PublishedEventResult = {
      instanceId,
      eventName: event.name,
      date: event.date,
      teams: publishedTeams,
    }

    // Mirror SCSL ScoresTab: cache to localStorage, then write Firestore.
    try {
      const existing: PublishedEventResult[] = JSON.parse(localStorage.getItem('sq-results-2026') ?? '[]')
      const updated = [...existing.filter(r => r.instanceId !== instanceId), result]
      localStorage.setItem('sq-results-2026', JSON.stringify(updated))
    } catch { /* quota */ }

    setDoc(doc(db, 'results_2026', instanceId), result)
      .then(() => { setPublished(true); setSaved(true) })
      .catch(err => {
        console.error('Failed to publish poker run:', err)
        alert(`Publish failed: ${err?.message ?? 'unknown error'}`)
      })
  }

  // ── Rendering ──────────────────────────────────────────────────────────────

  const ranked = [...teams]
    .map(t => ({ t, total: totalFor(t, rounds) }))
    .sort((a, b) => b.total - a.total)

  return (
    <div style={{ padding: '8px 0' }}>
      {/* Toolbar */}
      <div className={styles.toolbar} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'Bungee, sans-serif', fontStyle: 'italic', fontSize: 14, color: 'var(--adm-ink)' }}>
            Poker Run scoring · {rounds} round{rounds === 1 ? '' : 's'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button className={styles.adminBtn} onClick={() => setRounds(rounds - 1)} disabled={rounds <= 1}>−</button>
            <span style={{ minWidth: 24, textAlign: 'center', fontSize: 13 }}>R</span>
            <button className={styles.adminBtn} onClick={() => setRounds(rounds + 1)} disabled={rounds >= 10}>+</button>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className={styles.adminBtn} onClick={addTeam}>+ Add Team</button>
          <button
            className={`${styles.adminBtn} ${styles.primary}`}
            onClick={publishResults}
            disabled={teams.length === 0}
            title="Write results to Firestore so the public leaderboard updates"
          >
            {published ? '✓ Published' : 'Publish results'}
          </button>
          {!saved && !published && (
            <span style={{ fontSize: 11, color: 'var(--sq-yellow)' }}>● unsaved · auto-cached</span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {teams.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--adm-mute)', fontSize: 13, border: '1px dashed rgba(255,255,255,.12)', borderRadius: 8 }}>
          No teams yet. Click <strong>+ Add Team</strong> to start.
        </div>
      )}

      {/* Score grid */}
      {teams.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-border)', color: 'var(--adm-mute)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                <th style={{ textAlign: 'left', padding: '8px 6px', width: 32 }}>#</th>
                <th style={{ textAlign: 'left', padding: '8px 6px', minWidth: 180 }}>Team</th>
                <th style={{ textAlign: 'center', padding: '8px 6px', width: 60 }}>H/cap</th>
                {Array.from({ length: rounds }, (_, i) => (
                  <th key={i} style={{ textAlign: 'center', padding: '8px 6px', width: 56 }}>R{i + 1}</th>
                ))}
                <th style={{ textAlign: 'right', padding: '8px 6px', width: 64 }}>Total</th>
                <th style={{ textAlign: 'right', padding: '8px 6px', width: 60 }}>Pts</th>
                <th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ t, total }, idx) => {
                const isEditingMeta = editingTeamId === t.teamId
                const rank = idx + 1
                return (
                  <>
                    <tr key={t.teamId} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                      <td style={{ padding: '10px 6px', fontWeight: 700, color: rank <= 3 ? 'var(--sq-yellow)' : 'var(--adm-mute)' }}>
                        {rank}
                      </td>
                      <td style={{ padding: '10px 6px' }}>
                        <div
                          onClick={() => setEditingTeamId(isEditingMeta ? null : t.teamId)}
                          style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--adm-ink)' }}
                          title="Click to edit team name + roster"
                        >
                          {t.teamName || <span style={{ color: 'var(--sq-red)', fontStyle: 'italic' }}>Unnamed</span>}
                          {isEditingMeta && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--adm-mute)' }}>▼</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--adm-mute)', marginTop: 2 }}>
                          {t.members.length} jumper{t.members.length === 1 ? '' : 's'}
                          {t.videoName && <> · 📷 {t.videoName}</>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 6px' }}>
                        <input
                          type="number"
                          value={t.handicap}
                          onChange={e => updateTeam(t.teamId, { handicap: parseInt(e.target.value, 10) || 0 })}
                          style={{ width: 44, textAlign: 'center', background: 'transparent', border: '1px solid rgba(255,255,255,.1)', color: 'var(--adm-ink)', borderRadius: 4, padding: '3px 4px', fontSize: 13 }}
                        />
                      </td>
                      {Array.from({ length: rounds }, (_, i) => {
                        const isEdit = editCell?.teamId === t.teamId && editCell.round === i
                        // A score of 0 is a legitimate round result. Only show
                        // the dash placeholder when the round genuinely hasn't
                        // been entered (i past the scores array length).
                        const scored = i < t.scores.length
                        const v = scored ? t.scores[i] : 0
                        if (isEdit) {
                          return (
                            <td key={i} style={{ textAlign: 'center', padding: '6px 4px' }}>
                              <input
                                autoFocus
                                type="number"
                                value={editVal}
                                onChange={e => setEditVal(e.target.value)}
                                onBlur={commitScore}
                                onKeyDown={e => onScoreKey(e, t.teamId, i)}
                                style={{ width: 48, textAlign: 'center', background: 'rgba(216,24,24,.08)', border: '1px solid var(--sq-red)', color: 'var(--adm-ink)', borderRadius: 4, padding: '4px', fontSize: 14 }}
                              />
                            </td>
                          )
                        }
                        return (
                          <td
                            key={i}
                            onClick={() => startEdit(t.teamId, i)}
                            style={{ textAlign: 'center', padding: '10px 6px', cursor: 'pointer', color: scored ? 'var(--adm-ink)' : 'var(--adm-mute)' }}
                            title="Click to edit"
                          >
                            {scored ? v : '—'}
                          </td>
                        )
                      })}
                      <td style={{ textAlign: 'right', padding: '10px 6px', fontWeight: 700, fontSize: 15, color: 'var(--adm-ink)' }}>
                        {total}
                      </td>
                      <td style={{ textAlign: 'right', padding: '10px 6px', fontSize: 12, color: '#64b5f6' }}>
                        {rankingPoints(rank)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '10px 4px' }}>
                        <button
                          onClick={() => removeTeam(t.teamId)}
                          title="Remove team"
                          style={{ background: 'transparent', border: 'none', color: 'var(--adm-mute)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                    {isEditingMeta && (
                      <tr key={`${t.teamId}-meta`} style={{ background: 'rgba(255,255,255,.02)' }}>
                        <td></td>
                        <td colSpan={rounds + 5} style={{ padding: '14px 6px 18px' }}>
                          <TeamMetaEditor team={t} onChange={patch => updateTeam(t.teamId, patch)} />
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function TeamMetaEditor({
  team,
  onChange,
}: {
  team: PokerTeam
  onChange: (patch: Partial<PokerTeam>) => void
}) {
  // One name per line for the members textarea — simplest UX for fast paste.
  const membersText = team.members.map(m => m.name).join('\n')

  function updateMembers(raw: string) {
    const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    // Preserve ids on names we already had — keeps the same jumper across edits.
    const byName = new Map(team.members.map(m => [m.name, m]))
    const members = lines.map(name => byName.get(name) ?? { id: slugMemberId(name), name })
    onChange({ members })
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, maxWidth: 720 }}>
      <label style={{ fontSize: 11, color: 'var(--adm-mute)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        Team name
        <input
          type="text"
          value={team.teamName}
          onChange={e => onChange({ teamName: e.target.value })}
          placeholder="e.g. Dust Angels"
          style={{ display: 'block', width: '100%', marginTop: 4, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 4, padding: '6px 8px', color: 'var(--adm-ink)', fontSize: 13 }}
        />
      </label>
      <label style={{ fontSize: 11, color: 'var(--adm-mute)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        Video flyer (optional)
        <input
          type="text"
          value={team.videoName ?? ''}
          onChange={e => onChange({ videoName: e.target.value })}
          placeholder="e.g. Justin Larios"
          style={{ display: 'block', width: '100%', marginTop: 4, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 4, padding: '6px 8px', color: 'var(--adm-ink)', fontSize: 13 }}
        />
      </label>
      <label style={{ gridColumn: '1 / -1', fontSize: 11, color: 'var(--adm-mute)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        Members — one per line
        <textarea
          rows={Math.max(4, team.members.length + 1)}
          value={membersText}
          onChange={e => updateMembers(e.target.value)}
          placeholder={'Jessica Detering\nJosh Whiteside\n...'}
          style={{ display: 'block', width: '100%', marginTop: 4, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 4, padding: '8px', color: 'var(--adm-ink)', fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
        />
      </label>
    </div>
  )
}
