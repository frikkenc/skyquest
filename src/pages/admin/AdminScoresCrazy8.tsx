import { useEffect, useMemo, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { EVENT_INSTANCES } from '../../data/mockData'
import { loadTeamingDoc } from '../../hooks/useTeamingDoc'
import { useCrazy8Master, useCrazy8Year } from '../../hooks/useCrazy8'
import type { PublishedEventResult, PublishedTeamResult } from '../../types'
import styles from './AdminEventInstance.module.css'

/**
 * Frikken Crazy 8s scoring tab — the end-of-day judging table.
 *
 * How the game scores (see /events/crazy8s/rules): formations themselves are
 * worth nothing. Teams collect a card per formation (or partial) during the
 * rounds, then a captain brings the pile to the table and trades it for
 * scoring combos off that year's menu. Order doesn't matter, and a combo can
 * be cashed as many times as the team has cards for it.
 *
 * So this tab is a tally, not a grid: pick a team, click the combos they
 * cashed in, and the total adds itself up. Card counting stays on the table —
 * we record what was bought, not what was held.
 *
 * Data flow mirrors AdminScoresPokerRun:
 *   1. Menu comes from Firestore `crazy8config/year_{year}` (Cards ▸ Menu tab).
 *   2. Teams seed from `teaming/{instanceId}`, or are typed in by hand.
 *   3. Entry auto-caches to localStorage `sq-crazy8-{instanceId}`.
 *   4. Publish writes the rolled-up result to `results_2026/{instanceId}`.
 */

// PublishedTeamResult.rankingPoints is required by the type but no longer
// meaningful — the public leaderboard ignores it and scores on rawScore
// directly. Kept at 0 so we stop emitting fictional placement numbers.
const PLACEHOLDER_RANKING_POINTS = 0

interface Crazy8Team {
  teamId: string
  teamName: string
  members: { id: string; name: string }[]
  /** comboId → how many times this team cashed that combo in. */
  cashIns: Record<string, number>
}

interface Crazy8State {
  year: number
  teams: Crazy8Team[]
}

/** A menu combo flattened with the round + letter it's displayed under. */
interface ComboRef {
  id: string
  round: number
  letter: string
  value: number
  formations: string[]
}

function localKey(instanceId: string) {
  return `sq-crazy8-${instanceId}`
}

function loadLocal(instanceId: string): Crazy8State | null {
  try {
    const raw = localStorage.getItem(localKey(instanceId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Crazy8State
    if (!Array.isArray(parsed?.teams)) return null
    return parsed
  } catch { return null }
}

function saveLocal(instanceId: string, state: Crazy8State) {
  try { localStorage.setItem(localKey(instanceId), JSON.stringify(state)) } catch { /* quota */ }
}

function makeTeamId() {
  return `c8-${Math.random().toString(36).slice(2, 10)}`
}

function firstNameOf(name: string) {
  return name.trim().split(/\s+/)[0] ?? name
}

/** Menu year for an event = the year it's held in, not today's year — so
 *  reopening a past meet in January still shows the menu it was scored on. */
function defaultYearFor(instanceId: string): number {
  const date = EVENT_INSTANCES.find(e => e.id === instanceId)?.date
  const y = date ? parseInt(date.slice(0, 4), 10) : NaN
  return Number.isFinite(y) ? y : new Date().getFullYear()
}

export default function AdminScoresCrazy8({ instanceId }: { instanceId: string }) {
  const event = EVENT_INSTANCES.find(e => e.id === instanceId)

  const cached = useMemo(() => loadLocal(instanceId), [instanceId])
  const [year, setYear] = useState<number>(cached?.year ?? defaultYearFor(instanceId))
  const [teams, setTeams] = useState<Crazy8Team[]>(cached?.teams ?? [])
  const [selectedId, setSelectedId] = useState<string | null>(cached?.teams?.[0]?.teamId ?? null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [saved, setSaved] = useState(true)   // we just loaded, so nothing is pending
  const [published, setPublished] = useState(false)
  const [pulling, setPulling] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const { master } = useCrazy8Master()
  const { yearDoc, loading: menuLoading } = useCrazy8Year(year)

  const formationName = useMemo(() => {
    const m: Record<string, string> = {}
    master.formations.forEach(f => { m[f.slug] = f.name })
    return m
  }, [master])

  // Flatten the menu once — combo lookup drives both totals and the entry pad.
  const combosByRound = useMemo(() => (
    [...yearDoc.menu.rounds]
      .sort((a, b) => a.round - b.round)
      .map(r => ({
        round: r.round,
        combos: r.combos
          // A combo with no formations can't be cashed in — it's a half-built
          // menu row, so keep it out of the judging table entirely.
          .filter(c => c.formations.length > 0)
          .map((c, i): ComboRef => ({
            id: c.id,
            round: r.round,
            letter: String.fromCharCode(65 + i),
            value: c.value,
            formations: c.formations,
          })),
      }))
      .filter(r => r.combos.length > 0)
  ), [yearDoc])

  const comboById = useMemo(() => {
    const m = new Map<string, ComboRef>()
    combosByRound.forEach(r => r.combos.forEach(c => m.set(c.id, c)))
    return m
  }, [combosByRound])

  const menuIsEmpty = comboById.size === 0

  function commit(next: Crazy8Team[], nextYear = year) {
    setTeams(next)
    saveLocal(instanceId, { year: nextYear, teams: next })
    setSaved(false)
    setPublished(false)
  }

  function changeYear(y: number) {
    setYear(y)
    saveLocal(instanceId, { year: y, teams })
  }

  function totalFor(t: Crazy8Team) {
    let sum = 0
    for (const [comboId, count] of Object.entries(t.cashIns)) {
      const combo = comboById.get(comboId)
      // Cash-ins for combos since deleted from the menu score nothing; they're
      // surfaced separately so the number never silently changes underfoot.
      if (combo) sum += combo.value * count
    }
    return sum
  }

  function orphanCount(t: Crazy8Team) {
    return Object.entries(t.cashIns)
      .filter(([id, n]) => n > 0 && !comboById.has(id))
      .reduce((s, [, n]) => s + n, 0)
  }

  function setCashIn(teamId: string, comboId: string, count: number) {
    const n = Math.max(0, Math.floor(count) || 0)
    commit(teams.map(t => {
      if (t.teamId !== teamId) return t
      const cashIns = { ...t.cashIns }
      if (n === 0) delete cashIns[comboId]
      else cashIns[comboId] = n
      return { ...t, cashIns }
    }))
  }

  function bumpCashIn(teamId: string, comboId: string, delta: number) {
    const t = teams.find(x => x.teamId === teamId)
    if (!t) return
    setCashIn(teamId, comboId, (t.cashIns[comboId] ?? 0) + delta)
  }

  function addTeam() {
    const t: Crazy8Team = { teamId: makeTeamId(), teamName: '', members: [], cashIns: {} }
    commit([...teams, t])
    setSelectedId(t.teamId)
    setRenamingId(t.teamId)
  }

  function removeTeam(teamId: string) {
    if (!confirm('Remove this team and everything it cashed in?')) return
    const next = teams.filter(t => t.teamId !== teamId)
    commit(next)
    if (selectedId === teamId) setSelectedId(next[0]?.teamId ?? null)
  }

  function renameTeam(teamId: string, teamName: string) {
    commit(teams.map(t => t.teamId === teamId ? { ...t, teamName } : t))
  }

  function clearTeam(teamId: string) {
    if (!confirm('Clear this team’s cash-ins? The team stays.')) return
    commit(teams.map(t => t.teamId === teamId ? { ...t, cashIns: {} } : t))
  }

  /** Pull the 8-way teams built on the Teaming tab. Existing cash-ins survive —
   *  teams are matched on the teaming group id, so re-pulling after a roster
   *  change updates names without touching scores. */
  async function pullFromTeaming() {
    setPulling(true)
    setMessage(null)
    try {
      const tdoc = await loadTeamingDoc(instanceId)
      if (!tdoc || tdoc.groups.length === 0) {
        setMessage({ type: 'err', text: 'No teams saved on the Teaming tab yet.' })
        return
      }
      const existing = new Map(teams.map(t => [t.teamId, t]))
      const pulled: Crazy8Team[] = tdoc.groups
        .filter(g => g.memberIds.length > 0)
        .map(g => {
          const members = g.memberIds
            // The video person doesn't score — see the same filter in
            // AdminScores.teamsFromTeaming. Published members feed the season
            // individual standings, so filming a team must not earn its points.
            .filter(id => id !== g.videoMemberId)
            // Legal name for published results — see AdminScores.teamsFromTeaming.
            .map(id => ({ id, name: tdoc.memberLegalNames?.[id] || tdoc.memberNames[id] }))
            .filter((m): m is { id: string; name: string } => Boolean(m.name))
          const autoName = members.map(m => firstNameOf(m.name)).join('-')
          const prev = existing.get(g.id)
          return {
            teamId: g.id,
            // A name typed here wins over the auto name, same as Teaming does.
            teamName: g.customName || prev?.teamName || autoName,
            members,
            cashIns: prev?.cashIns ?? {},
          }
        })
      // Hand-added teams aren't in the teaming doc — keep them on the end.
      const pulledIds = new Set(pulled.map(t => t.teamId))
      const manual = teams.filter(t => !pulledIds.has(t.teamId) && !tdoc.groups.some(g => g.id === t.teamId))
      const next = [...pulled, ...manual]
      commit(next)
      if (!selectedId || !next.some(t => t.teamId === selectedId)) setSelectedId(next[0]?.teamId ?? null)
      setMessage({ type: 'ok', text: `Loaded ${pulled.length} team${pulled.length === 1 ? '' : 's'} from Teaming.` })
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err)
      setMessage({ type: 'err', text: `Couldn’t load teams: ${detail}` })
    } finally {
      setPulling(false)
    }
  }

  function publishResults() {
    if (!event) {
      setMessage({ type: 'err', text: 'Event not found — cannot publish.' })
      return
    }
    const ranked = [...teams]
      .map(t => ({ t, total: totalFor(t) }))
      .sort((a, b) => b.total - a.total)

    const publishedTeams: PublishedTeamResult[] = ranked.map(({ t, total }, i) => ({
      rank: i + 1,
      teamId: t.teamId,
      teamName: t.teamName || 'Unnamed Team',
      members: t.members,
      // Crazy 8s runs undivided (hasDivisions: false), but the public
      // leaderboard only renders AAA/AA/A tabs — tagging these 'Open' would
      // hide them. Same call AdminScoresPokerRun makes.
      division: 'AAA',
      rawScore: total,
      rankingPoints: PLACEHOLDER_RANKING_POINTS,
    }))

    const result: PublishedEventResult = {
      instanceId,
      eventName: event.name,
      date: event.date,
      teams: publishedTeams,
    }

    try {
      const existing: PublishedEventResult[] = JSON.parse(localStorage.getItem('sq-results-2026') ?? '[]')
      localStorage.setItem('sq-results-2026', JSON.stringify([...existing.filter(r => r.instanceId !== instanceId), result]))
    } catch { /* quota */ }

    // Publishing results = the meet is over, so flip the event status too —
    // same pairing the other scoring tabs use.
    Promise.all([
      setDoc(doc(db, 'results_2026', instanceId), result),
      setDoc(doc(db, 'eventConfig', instanceId), { status: 'complete' }, { merge: true }),
    ])
      .then(() => { setPublished(true); setSaved(true); setMessage({ type: 'ok', text: 'Results published to the leaderboard.' }) })
      .catch((err: unknown) => {
        const detail = err instanceof Error ? err.message : String(err)
        setMessage({ type: 'err', text: `Publish failed: ${detail}` })
      })
  }

  // Keep the selection valid if teams change out from under it.
  useEffect(() => {
    if (selectedId && !teams.some(t => t.teamId === selectedId)) setSelectedId(teams[0]?.teamId ?? null)
  }, [teams, selectedId])

  const ranked = [...teams]
    .map(t => ({ t, total: totalFor(t) }))
    .sort((a, b) => b.total - a.total)
  const selected = teams.find(t => t.teamId === selectedId) ?? null
  const yearOptions = [year - 1, year, year + 1].filter((y, i, a) => a.indexOf(y) === i)

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className={styles.toolbar} style={{ flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'Bungee, sans-serif', fontStyle: 'italic', fontSize: 14, color: 'var(--adm-ink)' }}>
            Crazy 8s cash-in
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--adm-mute)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Menu
            <select
              value={year}
              onChange={e => changeYear(parseInt(e.target.value, 10))}
              style={{ background: 'var(--adm-bg)', color: 'var(--adm-ink)', border: '1px solid var(--adm-border)', borderRadius: 4, padding: '2px 6px', fontSize: 12 }}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <span style={{ fontSize: 11, color: 'var(--adm-mute)' }}>
            {menuLoading ? 'loading menu…' : `${comboById.size} combo${comboById.size === 1 ? '' : 's'} · ${teams.length} team${teams.length === 1 ? '' : 's'}`}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {!saved && !published && <span style={{ fontSize: 11, color: 'var(--sq-yellow)' }}>● unsaved · auto-cached</span>}
          <button className={styles.adminBtn} onClick={pullFromTeaming} disabled={pulling} style={{ fontSize: 11 }}>
            {pulling ? 'Loading…' : '⟳ Teams from Teaming'}
          </button>
          <button className={styles.adminBtn} onClick={addTeam} style={{ fontSize: 11 }}>+ Add team</button>
          <button
            className={`${styles.adminBtn} ${styles.primary}`}
            onClick={publishResults}
            disabled={teams.length === 0}
            style={{ background: published ? 'var(--sq-signal)' : undefined, borderColor: published ? 'transparent' : undefined }}
            title="Write results to Firestore so the public leaderboard updates"
          >
            {published ? '✓ Published' : '🏆 Publish results'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          background: message.type === 'ok' ? 'rgba(0,120,48,.15)' : 'rgba(216,24,24,.15)',
          border: `1px solid ${message.type === 'ok' ? 'rgba(0,120,48,.5)' : 'rgba(216,24,24,.5)'}`,
          color: message.type === 'ok' ? '#7BC97A' : '#FF7676',
          padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 12,
        }}>{message.text}</div>
      )}

      {!menuLoading && menuIsEmpty && (
        <div style={{ background: 'rgba(255,171,64,.08)', border: '1px solid rgba(255,171,64,.3)', color: '#ffab40', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
          The {year} menu has no combos yet. Build it under <strong>Cards ▸ Menu</strong> first — the combos there are what teams cash their cards in for.
        </div>
      )}

      <p style={{ fontSize: 11, color: 'var(--adm-mute)', margin: '0 0 14px' }}>
        Pick a team, then click each combo its captain cashed in. Click again to add another of the same combo —
        a team can cash a combo as many times as it has cards for it. Totals and standings update live.
      </p>

      {teams.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--adm-mute)', fontSize: 13, border: '1px dashed rgba(255,255,255,.12)', borderRadius: 8 }}>
          No teams yet. Pull them with <strong>⟳ Teams from Teaming</strong>, or click <strong>+ Add team</strong>.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 320px) 1fr', gap: 16, alignItems: 'start' }}>

          {/* ── Standings / team picker ── */}
          <div style={{ border: '1px solid var(--adm-border)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--adm-border)', fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--adm-mute)' }}>
              Standings
            </div>
            {ranked.map(({ t, total }, i) => {
              const isSel = t.teamId === selectedId
              const entered = Object.values(t.cashIns).reduce((s, n) => s + n, 0)
              return (
                <div
                  key={t.teamId}
                  onClick={() => { setSelectedId(t.teamId); setRenamingId(null) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,.04)',
                    background: isSel ? 'rgba(216,24,24,.10)' : undefined,
                    borderLeft: `3px solid ${isSel ? 'var(--sq-red)' : 'transparent'}`,
                  }}
                >
                  <span style={{ minWidth: 18, fontWeight: 700, fontSize: 13, color: i < 3 ? 'var(--sq-yellow)' : 'var(--adm-mute)' }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--adm-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.teamName || <span style={{ color: 'var(--sq-red)', fontStyle: 'italic', fontWeight: 400 }}>Unnamed</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--adm-mute)' }}>
                      {entered === 0 ? 'nothing cashed in' : `${entered} combo${entered === 1 ? '' : 's'} cashed`}
                      {t.members.length > 0 && ` · ${t.members.length} jumpers`}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'Bungee, sans-serif', fontStyle: 'italic', fontSize: 16, color: total > 0 ? 'var(--adm-ink)' : 'rgba(255,255,255,.2)' }}>
                    {total}
                  </span>
                </div>
              )
            })}
          </div>

          {/* ── Entry pad for the selected team ── */}
          {selected && (
            <div style={{ border: '1px solid var(--adm-border)', borderRadius: 8, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                {renamingId === selected.teamId ? (
                  <input
                    autoFocus
                    value={selected.teamName}
                    onChange={e => renameTeam(selected.teamId, e.target.value)}
                    onBlur={() => setRenamingId(null)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setRenamingId(null) }}
                    placeholder="Team name"
                    style={{ background: 'rgba(255,255,255,.06)', border: '1px solid var(--sq-red)', borderRadius: 4, padding: '4px 8px', color: 'var(--adm-ink)', fontSize: 16 }}
                  />
                ) : (
                  <span
                    onClick={() => setRenamingId(selected.teamId)}
                    title="Click to rename"
                    style={{ fontFamily: 'Bungee, sans-serif', fontStyle: 'italic', fontSize: 17, color: 'var(--adm-ink)', cursor: 'pointer' }}
                  >
                    {selected.teamName || 'Unnamed team'}
                  </span>
                )}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--adm-mute)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Total</span>
                  <span style={{ fontFamily: 'Bungee, sans-serif', fontStyle: 'italic', fontSize: 26, color: 'var(--sq-yellow)', lineHeight: 1 }}>
                    {totalFor(selected)}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--adm-mute)', marginBottom: 14 }}>
                {selected.members.length > 0 ? selected.members.map(m => m.name).join(', ') : 'No roster attached'}
                {' · '}
                <button onClick={() => clearTeam(selected.teamId)} style={{ background: 'none', border: 'none', color: 'var(--adm-mute)', cursor: 'pointer', padding: 0, fontSize: 11, textDecoration: 'underline' }}>clear cash-ins</button>
                {' · '}
                <button onClick={() => removeTeam(selected.teamId)} style={{ background: 'none', border: 'none', color: 'var(--sq-red)', cursor: 'pointer', padding: 0, fontSize: 11, textDecoration: 'underline' }}>remove team</button>
              </div>

              {orphanCount(selected) > 0 && (
                <div style={{ background: 'rgba(255,171,64,.08)', border: '1px solid rgba(255,171,64,.3)', color: '#ffab40', padding: '8px 12px', borderRadius: 6, fontSize: 11, marginBottom: 12 }}>
                  {orphanCount(selected)} cash-in{orphanCount(selected) === 1 ? '' : 's'} reference combos that are no longer on the {year} menu — they score 0.
                  Check the menu year above, or re-enter them.
                </div>
              )}

              {combosByRound.map(({ round, combos }) => {
                const roundSubtotal = combos.reduce((s, c) => s + c.value * (selected.cashIns[c.id] ?? 0), 0)
                return (
                  <div key={round} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, borderBottom: '1px solid var(--adm-border)', paddingBottom: 5, marginBottom: 8 }}>
                      <span style={{ fontFamily: 'Bungee, sans-serif', fontStyle: 'italic', fontSize: 13, color: 'var(--adm-ink)' }}>Round {round}</span>
                      <span style={{ fontSize: 11, color: roundSubtotal > 0 ? 'var(--sq-yellow)' : 'var(--adm-mute)', marginLeft: 'auto' }}>
                        {roundSubtotal > 0 ? `+${roundSubtotal}` : '—'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gap: 6 }}>
                      {combos.map(c => {
                        const count = selected.cashIns[c.id] ?? 0
                        return (
                          <div
                            key={c.id}
                            onClick={() => bumpCashIn(selected.teamId, c.id, 1)}
                            title="Click to cash this combo in"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', cursor: 'pointer',
                              borderRadius: 6,
                              border: `1px solid ${count > 0 ? 'rgba(255,171,64,.45)' : 'var(--adm-border)'}`,
                              background: count > 0 ? 'rgba(255,171,64,.06)' : 'transparent',
                            }}
                          >
                            <span style={{
                              width: 22, height: 22, flexShrink: 0, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700,
                              background: count > 0 ? 'var(--sq-yellow)' : 'rgba(255,255,255,.06)',
                              color: count > 0 ? '#1a1a1a' : 'var(--adm-mute)',
                            }}>{c.letter}</span>
                            <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--adm-ink)' }}>
                              {c.formations.map(s => formationName[s] ?? s).join(' + ')}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--adm-mute)', minWidth: 34, textAlign: 'right' }}>
                              {c.value} pt
                            </span>
                            <div
                              onClick={e => e.stopPropagation()}
                              style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
                            >
                              <button
                                onClick={() => bumpCashIn(selected.teamId, c.id, -1)}
                                disabled={count === 0}
                                title="Remove one"
                                style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--adm-border)', background: 'transparent', color: count === 0 ? 'rgba(255,255,255,.15)' : 'var(--adm-ink)', cursor: count === 0 ? 'default' : 'pointer', fontSize: 13, lineHeight: 1, padding: 0 }}
                              >−</button>
                              <input
                                type="number"
                                min={0}
                                value={count}
                                onChange={e => setCashIn(selected.teamId, c.id, parseInt(e.target.value, 10))}
                                onFocus={e => e.target.select()}
                                style={{ width: 42, textAlign: 'center', background: 'rgba(255,255,255,.04)', border: '1px solid var(--adm-border)', borderRadius: 4, padding: '2px 4px', color: count > 0 ? 'var(--adm-ink)' : 'var(--adm-mute)', fontSize: 13, fontWeight: count > 0 ? 700 : 400 }}
                              />
                              <button
                                onClick={() => bumpCashIn(selected.teamId, c.id, 1)}
                                title="Add one"
                                style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--adm-border)', background: 'transparent', color: 'var(--adm-ink)', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0 }}
                              >+</button>
                            </div>
                            <span style={{ minWidth: 44, textAlign: 'right', fontSize: 13, fontWeight: 700, color: count > 0 ? 'var(--sq-yellow)' : 'rgba(255,255,255,.15)' }}>
                              {count > 0 ? `= ${c.value * count}` : '—'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* ── Receipt: what this team actually bought ── */}
              {(() => {
                const lines = [...comboById.values()]
                  .filter(c => (selected.cashIns[c.id] ?? 0) > 0)
                  .sort((a, b) => b.value * (selected.cashIns[b.id] ?? 0) - a.value * (selected.cashIns[a.id] ?? 0))
                if (lines.length === 0) return null
                return (
                  <div style={{ borderTop: '1px solid var(--adm-border)', paddingTop: 12, marginTop: 4 }}>
                    <div style={{ fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--adm-mute)', marginBottom: 8 }}>
                      Cashed in
                    </div>
                    {lines.map(c => {
                      const count = selected.cashIns[c.id] ?? 0
                      return (
                        <div key={c.id} style={{ display: 'flex', gap: 10, fontSize: 12, padding: '3px 0', color: 'var(--adm-ink)' }}>
                          <span style={{ color: 'var(--adm-mute)', minWidth: 46 }}>R{c.round}-{c.letter}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>{c.formations.map(s => formationName[s] ?? s).join(' + ')}</span>
                          <span style={{ color: 'var(--adm-mute)' }}>{c.value} × {count}</span>
                          <span style={{ minWidth: 44, textAlign: 'right', fontWeight: 700 }}>{c.value * count}</span>
                        </div>
                      )
                    })}
                    <div style={{ display: 'flex', gap: 10, fontSize: 13, padding: '8px 0 0', marginTop: 6, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                      <span style={{ flex: 1, fontWeight: 700, color: 'var(--adm-ink)' }}>Total</span>
                      <span style={{ minWidth: 44, textAlign: 'right', fontFamily: 'Bungee, sans-serif', fontStyle: 'italic', color: 'var(--sq-yellow)' }}>
                        {totalFor(selected)}
                      </span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
