import { useState, useRef } from 'react'
import { SCSL_RESULTS, TEAM_ASSIGNMENTS, DUELING_REGISTRATIONS, REGISTRATIONS, SCSL_REGISTRATIONS, EVENT_INSTANCES } from '../../data/mockData'
import type { Division, TeamResult, TeamRegistration, PublishedEventResult, PublishedTeamResult } from '../../types'
import styles from './AdminEventInstance.module.css'

const MAX_ROUNDS = 20
const DEFAULT_ROUNDS = 10
const SCORE_DIVS: Division[] = ['AAA', 'AA', 'A', 'Rookie']

type RoundStatus = 'ok' | 'weather' | 'choice'
type JumpData = Record<string, number[]>  // assignmentId → per-member counts

interface REntry { pts: number; busts: number }
interface ScoredTeam {
  teamId: string
  teamName: string
  members: { id: string; name: string }[]
  division: Division
  rounds: REntry[]
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

function initDuelingTeams(instanceId: string): ScoredTeam[] {
  const allRegs: TeamRegistration[] = [...REGISTRATIONS, ...SCSL_REGISTRATIONS, ...DUELING_REGISTRATIONS]
  const regById = Object.fromEntries(allRegs.map(r => [r.id, r])) as Record<string, TeamRegistration>
  const assignments = TEAM_ASSIGNMENTS.filter(a => a.eventId === instanceId)
  return assignments.map((a, i) => ({
    teamId: a.id,
    teamName: a.teamName || `Team ${i + 1}`,
    members: a.memberIds
      .map(id => regById[id]?.members[0])
      .filter(Boolean) as { id: string; name: string }[],
    division: 'Open' as Division,
    rounds: Array.from({ length: MAX_ROUNDS }, () => ({ pts: 0, busts: 0 })),
  }))
}

function loadJumpData(instanceId: string): JumpData {
  try { return JSON.parse(localStorage.getItem(`sq-jumps-${instanceId}`) ?? '{}') }
  catch { return {} }
}

const RANKING_POINTS = [150, 120, 100, 80, 65, 55, 45, 35, 25, 15]
function rankingPoints(rank: number) { return RANKING_POINTS[rank - 1] ?? 10 }

// JPP = score * 1000 / sum-of-jump-numbers. Higher = better for less-experienced teams.
function calcJpp(total: number, jumps: number[]): number | null {
  const sum = jumps.reduce((s, n) => s + (n || 0), 0)
  if (!sum) return null
  return Math.round((total * 1000) / sum * 10) / 10
}

export default function ScoresTab({ eventTypeSlug, instanceId }: { eventTypeSlug: string; instanceId: string }) {
  const isDueling = eventTypeSlug === 'dueling-dzs'
  const defaultRounds = isDueling ? 8 : DEFAULT_ROUNDS

  const [roundCount, setRoundCount] = useState(defaultRounds)
  const [statuses, setStatuses] = useState<RoundStatus[]>(Array(MAX_ROUNDS).fill('ok'))
  const [hasJumpoff, setHasJumpoff] = useState(false)
  const [teams, setTeams] = useState<ScoredTeam[]>(() =>
    isDueling ? initDuelingTeams(instanceId) : initTeams(SCSL_RESULTS)
  )
  const [editCell, setEditCell] = useState<{ tid: string; ri: number } | null>(null)
  const [editVal, setEditVal] = useState('')
  const [saved, setSaved] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const [photoMode, setPhotoMode] = useState(false)
  const [photoUploaded, setPhotoUploaded] = useState(false)
  const [photoProcessing, setPhotoProcessing] = useState(false)
  const [jumpData, setJumpData] = useState<JumpData>(() => isDueling ? loadJumpData(instanceId) : {})
  const [linkCopied, setLinkCopied] = useState(false)
  const [published, setPublished] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const checkinUrl = `${window.location.origin}/checkin/${instanceId}`

  // ── Helpers ──────────────────────────────────────────────────────────────────

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

  function getRank(val: number, sorted: { total: number; jpp?: number | null }[], useJpp: boolean) {
    if (useJpp) {
      const jpp = (sorted.find(t => t.total === val) as { jpp?: number | null })?.jpp ?? null
      if (jpp === null) return sorted.filter(t => (t as { jpp?: number | null }).jpp !== null).length + 1
      return sorted.filter(t => ((t as { jpp?: number | null }).jpp ?? -Infinity) > jpp).length + 1
    }
    return sorted.filter(t => t.total > val).length + 1
  }

  function findTbRound(a: ScoredTeam, b: ScoredTeam): number | null {
    for (let r = roundCount - 1; r >= 0; r--) {
      if (statuses[r] === 'weather') continue
      if ((a.rounds[r]?.pts ?? 0) !== (b.rounds[r]?.pts ?? 0)) return r
    }
    return null
  }

  function copyCheckinLink() {
    navigator.clipboard.writeText(checkinUrl).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  function refreshJumps() {
    setJumpData(loadJumpData(instanceId))
  }

  function publishResults() {
    const event = EVENT_INSTANCES.find(e => e.id === instanceId)
    const publishedTeams: PublishedTeamResult[] = []

    if (isDueling) {
      const dt = teams
        .map(t => {
          const jumps = jumpData[t.teamId] ?? []
          const total = effectiveTotal(t)
          return { ...t, total, jpp: calcJpp(total, jumps) }
        })
        .sort((a, b) => {
          if (a.jpp != null && b.jpp != null) return b.jpp - a.jpp
          if (a.jpp != null) return -1
          if (b.jpp != null) return 1
          return b.total - a.total
        })
      dt.forEach((t, i) => publishedTeams.push({
        rank: i + 1, teamId: t.teamId, teamName: t.teamName,
        members: t.members, division: 'Open',
        rawScore: t.total, jpp: t.jpp,
        rankingPoints: rankingPoints(i + 1),
      }))
    } else {
      for (const div of SCORE_DIVS) {
        const dt = teams
          .filter(t => t.division === div)
          .map(t => ({ ...t, total: effectiveTotal(t) }))
          .sort((a, b) => b.total - a.total)
        dt.forEach((t, i) => publishedTeams.push({
          rank: i + 1, teamId: t.teamId, teamName: t.teamName,
          members: t.members, division: div,
          rawScore: t.total,
          rankingPoints: rankingPoints(i + 1),
        }))
      }
    }

    const result: PublishedEventResult = {
      instanceId,
      eventName: event?.name ?? instanceId,
      date: event?.date ?? '',
      teams: publishedTeams,
    }

    const existing: PublishedEventResult[] = JSON.parse(localStorage.getItem('sq-results-2026') ?? '[]')
    const updated = [...existing.filter(r => r.instanceId !== instanceId), result]
    localStorage.setItem('sq-results-2026', JSON.stringify(updated))
    setPublished(true)
    setSaved(true)
  }

  // ── Early exits ──────────────────────────────────────────────────────────────

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

  // ── Shared score table renderer ──────────────────────────────────────────────

  function renderScoreTable(
    dt: (ScoredTeam & { total: number; jpp?: number | null })[],
    useJpp = false
  ) {
    const tieMap = new Map<string, string[]>()
    const byKey = new Map<string, string[]>()
    dt.forEach(t => {
      const key = useJpp && t.jpp != null ? String(t.jpp) : String(t.total)
      const ids = byKey.get(key) ?? []
      ids.push(t.teamId)
      byKey.set(key, ids)
    })
    byKey.forEach(ids => {
      if (ids.length > 1) ids.forEach(id => tieMap.set(id, ids.filter(x => x !== id)))
    })

    return (
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
              {hasJumpoff && <th style={{ textAlign: 'center', width: 50, fontSize: 10, color: 'var(--sq-yellow)' }}>J/O</th>}
              <th style={{ textAlign: 'center', width: 60 }}>Raw</th>
              {useJpp && <th style={{ textAlign: 'center', width: 70, color: '#64b5f6' }}>JPP</th>}
            </tr>
          </thead>
          <tbody>
            {dt.map(team => {
              const rank = getRank(team.total, dt, useJpp)
              const tiedWith = tieMap.get(team.teamId) ?? []
              const isTied = tiedWith.length > 0
              const totalBusts = team.rounds.slice(0, roundCount).reduce((s, r) => s + r.busts, 0)

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

                  {Array.from({ length: roundCount }, (_, i) => {
                    const entry = team.rounds[i] ?? { pts: 0, busts: 0 }
                    const isEditing = editCell?.tid === team.teamId && editCell?.ri === i
                    const isWeather = statuses[i] === 'weather'
                    const hasScore = entry.pts > 0 || entry.busts > 0
                    return (
                      <td key={i} style={{ padding: '3px 2px', textAlign: 'center' }}>
                        {isEditing ? (
                          <input autoFocus type="text" value={editVal}
                            className={styles.scoreInput} style={{ width: 46 }} placeholder="6/2"
                            onChange={e => setEditVal(e.target.value)}
                            onKeyDown={e => onKey(e, team.teamId, i)}
                            onBlur={commit}
                          />
                        ) : (
                          <div onClick={() => !isWeather && startEdit(team.teamId, i)}
                            style={{
                              minHeight: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: 4, cursor: isWeather ? 'default' : 'pointer', fontSize: 12,
                              color: isWeather ? 'var(--adm-mute)' : entry.busts > 0 ? 'var(--sq-yellow)' : hasScore ? 'var(--adm-ink)' : 'rgba(255,255,255,.15)',
                              opacity: isWeather ? 0.35 : 1,
                            }}>
                            {isWeather && !hasScore ? '☁' : fmtScore(entry)}
                          </div>
                        )}
                      </td>
                    )
                  })}

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

                  {/* Raw total */}
                  <td className={styles.totalCell}>
                    <span style={{ fontWeight: 700 }}>{team.total}</span>
                    {totalBusts > 0 && <sup style={{ fontSize: 8, color: 'var(--sq-yellow)', marginLeft: 2 }}>({totalBusts}b)</sup>}
                  </td>

                  {/* JPP — only for dueling */}
                  {useJpp && (
                    <td style={{ textAlign: 'center', padding: '3px 6px' }}>
                      {team.jpp != null
                        ? <span style={{ fontWeight: 700, fontSize: 13, color: '#64b5f6' }}>{team.jpp.toFixed(1)}</span>
                        : <span style={{ color: 'rgba(255,255,255,.2)', fontSize: 11 }}>—</span>
                      }
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  const resetTeams = () => { setTeams(isDueling ? initDuelingTeams(instanceId) : initTeams(SCSL_RESULTS)); setSaved(false) }

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar} style={{ flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--adm-mute)', letterSpacing: '.05em', textTransform: 'uppercase' }}>Rounds</span>
            <button className={styles.adminBtn} style={{ padding: '3px 9px', fontSize: 13, lineHeight: 1 }}
              onClick={() => setRoundCount(c => Math.max(1, c - 1))}>−</button>
            <span style={{ fontFamily: 'Bungee', fontStyle: 'italic', minWidth: 22, textAlign: 'center', fontSize: 14 }}>{roundCount}</span>
            <button className={styles.adminBtn} style={{ padding: '3px 9px', fontSize: 13, lineHeight: 1 }}
              onClick={() => setRoundCount(c => Math.min(MAX_ROUNDS - 1, c + 1))}>+</button>
          </div>
          <button className={`${styles.adminBtn} ${hasJumpoff ? styles.primary : ''}`}
            onClick={() => setHasJumpoff(j => !j)} style={{ fontSize: 11 }}>
            {hasJumpoff ? '✓ Jump-off' : '+ Jump-off'}
          </button>
          <button className={styles.adminBtn} onClick={() => setPhotoMode(m => !m)} style={{ fontSize: 11 }}>
            📷 {photoMode ? 'Hide Photo' : 'Photo Entry'}
          </button>
          <button className={styles.adminBtn} onClick={() => setShowRules(r => !r)} style={{ fontSize: 11 }}>
            ? Tie Rules
          </button>
          {isDueling && (
            <button className={styles.adminBtn} onClick={copyCheckinLink} style={{ fontSize: 11 }}>
              {linkCopied ? '✓ Copied' : '📱 Check-in link'}
            </button>
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {!saved && <span style={{ fontSize: 12, color: 'var(--sq-yellow)' }}>● Unsaved</span>}
          <button className={styles.adminBtn} onClick={resetTeams}>Reset</button>
          <button className={`${styles.adminBtn} ${styles.primary}`} onClick={() => setSaved(true)}>
            {saved ? '✓ Saved' : 'Save Scores'}
          </button>
          <button
            className={`${styles.adminBtn} ${styles.primary}`}
            onClick={publishResults}
            style={{ background: published ? 'var(--sq-signal)' : '#2e7d32', borderColor: 'transparent' }}
            title="Write results to the public leaderboard"
          >
            {published ? '✓ Published' : '🏆 Publish Results'}
          </button>
        </div>
      </div>

      {/* ── Check-in status panel (Dueling only) ── */}
      {isDueling && (
        <div style={{ background: 'rgba(100,181,246,.06)', border: '1px solid rgba(100,181,246,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#64b5f6', fontWeight: 700, letterSpacing: '.04em' }}>JUMP # CHECK-IN</span>
          <span style={{ fontSize: 12, color: 'var(--adm-mute)' }}>
            {Object.keys(jumpData).length}/{teams.length} teams submitted
          </span>
          <button className={styles.adminBtn} onClick={refreshJumps} style={{ fontSize: 11, marginLeft: 'auto' }}>↻ Refresh</button>
          <span style={{ fontSize: 11, color: 'var(--adm-mute)', userSelect: 'all' }}>{checkinUrl}</span>
        </div>
      )}

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
          <div style={{ border: '2px dashed var(--adm-border)', borderRadius: 8, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', color: 'var(--adm-mute)' }}
            onClick={() => fileRef.current?.click()}>
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
        {isDueling && <> JPP = raw score × 1000 ÷ team's total jump numbers (higher = better).</>}
      </p>

      {/* ── Dueling DZs — single Open table ── */}
      {isDueling && (() => {
        const dt = teams
          .map(t => {
            const jumps = jumpData[t.teamId] ?? []
            const total = effectiveTotal(t)
            return { ...t, total, jpp: calcJpp(total, jumps) }
          })
          .sort((a, b) => {
            if (a.jpp != null && b.jpp != null) return b.jpp - a.jpp
            if (a.jpp != null) return -1
            if (b.jpp != null) return 1
            return b.total - a.total
          })
        return (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: '2px solid var(--adm-border)', marginBottom: 1 }}>
              <span style={{ fontFamily: 'Bungee', fontStyle: 'italic', fontSize: 15, color: 'var(--adm-ink)', letterSpacing: '.04em' }}>Open</span>
              <span style={{ fontSize: 11, color: 'var(--adm-mute)' }}>{dt.length} team{dt.length !== 1 ? 's' : ''}</span>
              {Object.keys(jumpData).length > 0 && (
                <span style={{ fontSize: 11, color: '#64b5f6', marginLeft: 4 }}>· ranked by JPP</span>
              )}
            </div>
            {renderScoreTable(dt, true)}
          </div>
        )
      })()}

      {/* ── SCSL / other events — per-division tables ── */}
      {!isDueling && SCORE_DIVS.map(div => {
        const dt = teams
          .filter(t => t.division === div)
          .map(t => ({ ...t, total: effectiveTotal(t) }))
          .sort((a, b) => b.total - a.total)
        if (!dt.length) return null

        return (
          <div key={div} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: '2px solid var(--adm-border)', marginBottom: 1 }}>
              <span style={{ fontFamily: 'Bungee', fontStyle: 'italic', fontSize: 15, color: 'var(--adm-ink)', letterSpacing: '.04em' }}>{div}</span>
              <span style={{ fontSize: 11, color: 'var(--adm-mute)' }}>{dt.length} team{dt.length !== 1 ? 's' : ''}</span>
            </div>
            {renderScoreTable(dt, false)}
          </div>
        )
      })}

      <p style={{ fontSize: 11, color: 'var(--adm-mute)', marginTop: 4 }}>
        Totals recalculate live. Click Save Scores to publish results.
      </p>
    </div>
  )
}
