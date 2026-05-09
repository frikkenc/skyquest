import { useState, useRef } from 'react'
import { SCSL_RESULTS } from '../../data/mockData'
import type { Division, TeamResult } from '../../types'
import styles from './AdminEventInstance.module.css'

const MAX_ROUNDS = 20
const DEFAULT_ROUNDS = 10
const SCORE_DIVS: Division[] = ['AAA', 'AA', 'A', 'Rookie']

type RoundStatus = 'ok' | 'weather' | 'choice'

interface REntry { pts: number; busts: number }
interface ScoredTeam {
  teamId: string
  teamName: string
  members: { id: string; name: string }[]
  division: Division
  rounds: REntry[]   // length MAX_ROUNDS; pts = net points, busts = deducted
}

function parseScore(val: string): REntry {
  const t = val.trim()
  if (!t || t === '—') return { pts: 0, busts: 0 }
  const s = t.split('/')
  return {
    pts: Math.max(0, parseInt(s[0]) || 0),
    busts: Math.max(0, parseInt(s[1] ?? '0') || 0),
  }
}

function fmtScore(e: REntry): string {
  if (!e.pts && !e.busts) return '—'
  return e.busts > 0 ? `${e.pts}(${e.busts})` : `${e.pts}`
}

function initTeams(results: TeamResult[]): ScoredTeam[] {
  return results.map(r => ({
    teamId: r.teamId,
    teamName: r.teamName,
    members: r.members,
    division: r.division,
    rounds: Array.from({ length: MAX_ROUNDS }, (_, i) => ({
      pts: r.roundScores[i] ?? 0,
      busts: r.roundBusts?.[i] ?? 0,
    })),
  }))
}

export default function ScoresTab({ eventTypeSlug }: { eventTypeSlug: string }) {
  const [roundCount, setRoundCount] = useState(DEFAULT_ROUNDS)
  const [statuses, setStatuses] = useState<RoundStatus[]>(Array(MAX_ROUNDS).fill('ok'))
  const [hasJumpoff, setHasJumpoff] = useState(false)
  const [teams, setTeams] = useState(() => initTeams(SCSL_RESULTS))
  const [editCell, setEditCell] = useState<{ tid: string; ri: number } | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saved, setSaved] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [photoMode, setPhotoMode] = useState(false)
  const [photoUploaded, setPhotoUploaded] = useState(false)
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Helpers ─────────────────────────────────────────────────────────────────

  function effectiveTotal(t: ScoredTeam) {
    let sum = 0
    for (let i = 0; i < roundCount; i++) {
      if (statuses[i] !== 'weather') sum += t.rounds[i]?.pts ?? 0
    }
    if (hasJumpoff) sum += t.rounds[roundCount]?.pts ?? 0
    return sum
  }

  function cycleStatus(i: number) {
    setStatuses(prev => {
      const next = [...prev]
      next[i] = next[i] === 'ok' ? 'weather' : next[i] === 'weather' ? 'choice' : 'ok'
      return next
    })
    setSaved(false)
  }

  function commit() {
    if (!editCell) return
    const entry = parseScore(editVal)
    setTeams(prev => prev.map(t =>
      t.teamId !== editCell.tid ? t
        : { ...t, rounds: t.rounds.map((r, i) => i === editCell.ri ? entry : r) }
    ))
    setSaved(false)
    setEditCell(null)
    setEditVal('')
  }

  function startEdit(tid: string, ri: number) {
    if (editCell?.tid !== tid || editCell?.ri !== ri) commit()
    const t = teams.find(x => x.teamId === tid)!
    const e = t.rounds[ri]
    setEditCell({ tid, ri })
    setEditVal(!e.pts && !e.busts ? '' : e.busts ? `${e.pts}/${e.busts}` : `${e.pts}`)
  }

  function onKey(e: React.KeyboardEvent, tid: string, ri: number) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      commit()
      const maxRi = hasJumpoff ? roundCount : roundCount - 1
      if (ri < maxRi) { startEdit(tid, ri + 1); return }
      const allIds = teams.map(t => t.teamId)
      const next = allIds[allIds.indexOf(tid) + 1]
      if (next) startEdit(next, 0)
    }
    if (e.key === 'Escape') { setEditCell(null); setEditVal('') }
  }

  function getSortedDiv(div: Division) {
    return teams
      .filter(t => t.division === div)
      .map(t => ({ ...t, total: effectiveTotal(t) }))
      .sort((a, b) => b.total - a.total)
  }

  function getRank(total: number, sorted: { total: number }[]) {
    return sorted.filter(t => t.total > total).length + 1
  }

  // Finds the last round (going backward) where two teams differ. Returns round index or null if identical.
  function findTbRound(a: ScoredTeam, b: ScoredTeam): number | null {
    for (let r = roundCount - 1; r >= 0; r--) {
      if (statuses[r] === 'weather') continue
      if ((a.rounds[r]?.pts ?? 0) !== (b.rounds[r]?.pts ?? 0)) return r
    }
    return null
  }

  // ── Early exit ───────────────────────────────────────────────────────────────

  if (eventTypeSlug === 'poker-run') {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--adm-mute)' }}>
        <div style={{ fontSize: 18, fontFamily: 'Bungee', marginBottom: 8 }}>Poker Run</div>
        <p>Poker Run scores are hand-result based. Score entry coming in a future update.</p>
      </div>
    )
  }

  const statusIcon = (s: RoundStatus) => s === 'weather' ? ' ☁' : s === 'choice' ? ' ?' : ''
  const statusMuted = (s: RoundStatus) => s !== 'ok'

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar} style={{ flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Round count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--adm-mute)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Rounds</span>
            <button className={styles.adminBtn} style={{ padding: '3px 9px', fontSize: 13, lineHeight: 1 }}
              onClick={() => setRoundCount(c => Math.max(1, c - 1))}>−</button>
            <span style={{ fontFamily: 'Bungee', fontStyle: 'italic', minWidth: 22, textAlign: 'center', fontSize: 14 }}>{roundCount}</span>
            <button className={styles.adminBtn} style={{ padding: '3px 9px', fontSize: 13, lineHeight: 1 }}
              onClick={() => setRoundCount(c => Math.min(MAX_ROUNDS - 1, c + 1))}>+</button>
          </div>
          <button
            className={`${styles.adminBtn} ${hasJumpoff ? styles.primary : ''}`}
            onClick={() => setHasJumpoff(j => !j)}
            style={{ fontSize: 11 }}
          >
            {hasJumpoff ? '✓ Jump-off' : '+ Jump-off'}
          </button>
          <button className={styles.adminBtn} onClick={() => setPhotoMode(m => !m)} style={{ fontSize: 11 }}>
            📷 {photoMode ? 'Hide Photo' : 'Photo Entry'}
          </button>
          <button className={styles.adminBtn} onClick={() => setShowRules(r => !r)} style={{ fontSize: 11 }}>
            ? Tie Rules
          </button>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {!saved && <span style={{ fontSize: 12, color: 'var(--sq-yellow)' }}>● Unsaved</span>}
          <button className={styles.adminBtn} onClick={() => { setTeams(initTeams(SCSL_RESULTS)); setSaved(false) }}>Reset</button>
          <button className={`${styles.adminBtn} ${styles.primary}`} onClick={() => setSaved(true)}>
            {saved ? '✓ Saved' : 'Save Scores'}
          </button>
        </div>
      </div>

      {/* ── Tiebreaker rules ── */}
      {showRules && (
        <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--adm-border)', borderRadius: 8, padding: '12px 16px', marginBottom: 12, fontSize: 12, color: 'var(--adm-mute)', lineHeight: 1.8 }}>
          <div style={{ fontFamily: 'Bungee', fontStyle: 'italic', color: 'var(--adm-ink)', fontSize: 13, marginBottom: 6 }}>Tiebreaker Order</div>
          <ol style={{ paddingLeft: 18 }}>
            <li>One jump-off round (click <em>+ Jump-off</em> to add the column)</li>
            <li>Highest single-round score looking backward round by round (R10 → R1)</li>
            <li>Fastest time to last scored point on previous jumps</li>
            <li>Judge decision</li>
          </ol>
          <div style={{ marginTop: 8, borderTop: '1px solid var(--adm-border)', paddingTop: 8, fontSize: 11 }}>
            <span style={{ color: '#64b5f6' }}>☁ Weather-incomplete</span> rounds are excluded from the total.{' '}
            <span style={{ color: '#ffab40' }}>? Choice-incomplete</span> rounds count — mark as Weather to exclude.
            <br />Click any round header to cycle: OK → Weather ☁ → Choice ? → OK
          </div>
        </div>
      )}

      {/* ── Photo entry ── */}
      {photoMode && (
        <div style={{ background: 'var(--adm-card)', border: '1px solid var(--adm-border)', borderRadius: 8, padding: 20, marginBottom: 16 }}>
          <div style={{ fontFamily: 'Bungee', fontSize: 13, marginBottom: 8, color: 'var(--adm-ink)' }}>📷 Whiteboard Photo Entry</div>
          <p style={{ fontSize: 12, color: 'var(--adm-mute)', marginBottom: 12 }}>
            Take a photo of the judge's whiteboard. AI will read the scores and populate the grid below.
          </p>
          <div
            style={{ border: '2px dashed var(--adm-border)', borderRadius: 8, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', color: 'var(--adm-mute)' }}
            onClick={() => fileRef.current?.click()}
          >
            {photoProcessing
              ? <div style={{ color: 'var(--sq-yellow)' }}>✦ Reading whiteboard scores...</div>
              : photoUploaded
                ? <div style={{ color: 'var(--sq-signal)' }}>✓ Photo processed — scores updated below. Review and save.</div>
                : <><div style={{ fontSize: 24, marginBottom: 8 }}>📸</div><div>Click to upload or take a photo</div><div style={{ fontSize: 11, marginTop: 4 }}>Supports JPG, PNG, HEIC</div></>
            }
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.length) { setPhotoUploaded(true); setPhotoProcessing(true); setTimeout(() => setPhotoProcessing(false), 2000) } }} />
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--adm-mute)', marginBottom: 14 }}>
        Click a score to edit. Type{' '}
        <code style={{ background: 'rgba(255,255,255,.08)', padding: '1px 4px', borderRadius: 3 }}>6</code>{' '}
        for 6 pts or{' '}
        <code style={{ background: 'rgba(255,255,255,.08)', padding: '1px 4px', borderRadius: 3 }}>6/2</code>{' '}
        for 6 pts + 2 busts (displayed as 6(2)). Tab advances cells. Click a round header to flag as weather ☁ or choice ?.
      </p>

      {/* ── Division sections ── */}
      {SCORE_DIVS.map(div => {
        const dt = divTeamsFor(div)
        if (!dt.length) return null

        // Build tie groups: map teamId → array of other teamIds with same total
        const tieMap = new Map<string, string[]>()
        const byTotal = new Map<number, string[]>()
        dt.forEach(t => {
          const ids = byTotal.get(t.total) ?? []
          ids.push(t.teamId)
          byTotal.set(t.total, ids)
        })
        byTotal.forEach(ids => {
          if (ids.length > 1) ids.forEach(id => tieMap.set(id, ids.filter(x => x !== id)))
        })

        return (
          <div key={div} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: '2px solid var(--adm-border)', marginBottom: 1 }}>
              <span style={{ fontFamily: 'Bungee', fontStyle: 'italic', fontSize: 15, color: 'var(--adm-ink)', letterSpacing: '.04em' }}>{div}</span>
              <span style={{ fontSize: 11, color: 'var(--adm-mute)' }}>{dt.length} team{dt.length !== 1 ? 's' : ''}</span>
            </div>

            <div className={styles.scoreGridWrap}>
              <table className={styles.scoreGrid}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', width: 36 }}>#</th>
                    <th style={{ textAlign: 'left', minWidth: 150 }}>Team</th>
                    {Array.from({ length: roundCount }, (_, i) => (
                      <th key={i}
                        style={{ textAlign: 'center', width: 50, fontSize: 10, cursor: 'pointer', userSelect: 'none', color: statusMuted(statuses[i]) ? 'var(--adm-mute)' : undefined }}
                        onClick={() => cycleStatus(i)}
                        title="Click to cycle: OK → Weather ☁ → Choice ?"
                      >
                        R{i + 1}{statusIcon(statuses[i])}
                      </th>
                    ))}
                    {hasJumpoff && (
                      <th style={{ textAlign: 'center', width: 50, fontSize: 10, color: 'var(--sq-yellow)' }}>J/O</th>
                    )}
                    <th style={{ textAlign: 'center', width: 70 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dt.map(team => {
                    const rank = getRank(team.total, dt)
                    const tiedWith = tieMap.get(team.teamId) ?? []
                    const isTied = tiedWith.length > 0
                    const totalBusts = team.rounds.slice(0, roundCount).reduce((s, r) => s + r.busts, 0)

                    // Tiebreaker annotation — only for 2-way ties
                    let tbNote: React.ReactNode = null
                    if (tiedWith.length === 1) {
                      const other = teams.find(t => t.teamId === tiedWith[0])!
                      const tbRound = findTbRound(team, other)
                      tbNote = tbRound !== null
                        ? <span style={{ fontSize: 9, color: 'var(--sq-yellow)', marginLeft: 6 }}>← R{tbRound + 1} breaks tie</span>
                        : <span style={{ fontSize: 9, color: '#ff7043', marginLeft: 6 }}>← identical · jump-off needed</span>
                    } else if (tiedWith.length > 1) {
                      tbNote = <span style={{ fontSize: 9, color: 'var(--sq-yellow)', marginLeft: 6 }}>{tiedWith.length + 1}-way tie</span>
                    }

                    return (
                      <tr key={team.teamId} style={{
                        borderBottom: '1px solid rgba(255,255,255,.04)',
                        borderLeft: isTied ? '2px solid rgba(255,171,64,.45)' : undefined,
                        background: isTied ? 'rgba(255,171,64,.03)' : undefined,
                      }}>
                        <td className={`${styles.rankCell} ${rank === 1 ? styles.r1 : rank === 2 ? styles.r2 : rank === 3 ? styles.r3 : ''}`}>
                          {rank}{isTied && <sup style={{ color: 'var(--sq-yellow)', fontSize: 7, lineHeight: 0 }}>=</sup>}
                        </td>
                        <td style={{ paddingLeft: 12, fontSize: 13, fontWeight: 600, color: 'var(--adm-ink)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                            {team.teamName || <span style={{ color: 'var(--adm-mute)', fontStyle: 'italic', fontWeight: 400 }}>Unnamed</span>}
                            {tbNote}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--adm-mute)', marginTop: 1 }}>
                            {team.members.map(m => m.name).join(', ')}
                          </div>
                        </td>

                        {/* Round score cells */}
                        {Array.from({ length: roundCount }, (_, i) => {
                          const entry = team.rounds[i] ?? { pts: 0, busts: 0 }
                          const isEditing = editCell?.tid === team.teamId && editCell?.ri === i
                          const isWeather = statuses[i] === 'weather'
                          const hasScore = entry.pts > 0 || entry.busts > 0
                          return (
                            <td key={i} style={{ padding: '3px 2px', textAlign: 'center' }}>
                              {isEditing ? (
                                <input
                                  autoFocus
                                  type="text"
                                  value={editVal}
                                  className={styles.scoreInput}
                                  style={{ width: 46 }}
                                  placeholder="6/2"
                                  onChange={e => setEditVal(e.target.value)}
                                  onKeyDown={e => onKey(e, team.teamId, i)}
                                  onBlur={commit}
                                />
                              ) : (
                                <div
                                  onClick={() => !isWeather && startEdit(team.teamId, i)}
                                  style={{
                                    minHeight: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 4, cursor: isWeather ? 'default' : 'pointer', fontSize: 12,
                                    color: isWeather ? 'var(--adm-mute)'
                                      : entry.busts > 0 ? 'var(--sq-yellow)'
                                      : hasScore ? 'var(--adm-ink)' : 'rgba(255,255,255,.15)',
                                    opacity: isWeather ? 0.35 : 1,
                                  }}
                                >
                                  {isWeather && !hasScore ? '☁' : fmtScore(entry)}
                                </div>
                              )}
                            </td>
                          )
                        })}

                        {/* Jump-off cell */}
                        {hasJumpoff && (() => {
                          const e = team.rounds[roundCount] ?? { pts: 0, busts: 0 }
                          const isEditing = editCell?.tid === team.teamId && editCell?.ri === roundCount
                          return (
                            <td style={{ padding: '3px 2px', textAlign: 'center' }}>
                              {isEditing ? (
                                <input autoFocus type="text" value={editVal}
                                  className={styles.scoreInput} style={{ width: 46 }}
                                  onChange={ev => setEditVal(ev.target.value)}
                                  onKeyDown={ev => onKey(ev, team.teamId, roundCount)}
                                  onBlur={commit}
                                />
                              ) : (
                                <div onClick={() => startEdit(team.teamId, roundCount)}
                                  style={{ minHeight: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: e.pts ? 'var(--sq-yellow)' : 'rgba(255,255,255,.15)', fontWeight: e.pts ? 700 : 400 }}>
                                  {fmtScore(e)}
                                </div>
                              )}
                            </td>
                          )
                        })()}

                        {/* Total */}
                        <td className={styles.totalCell}>
                          <span style={{ fontWeight: 700 }}>{team.total}</span>
                          {totalBusts > 0 && (
                            <sup style={{ fontSize: 8, color: 'var(--sq-yellow)', marginLeft: 2 }}>({totalBusts}b)</sup>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )

        function divTeamsFor(d: Division) {
          return teams
            .filter(t => t.division === d)
            .map(t => ({ ...t, total: effectiveTotal(t) }))
            .sort((a, b) => b.total - a.total)
        }
      })}

      <p style={{ fontSize: 11, color: 'var(--adm-mute)', marginTop: 4 }}>
        Totals recalculate live. Click Save Scores to publish results.
      </p>
    </div>
  )
}
