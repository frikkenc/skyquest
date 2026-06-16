import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { EVENT_INSTANCES } from '../data/mockData'
import type {
  LeaderboardEntry, Division, IndividualStanding, GalaAward,
  PublishedEventResult, EventInstance,
} from '../types'
import styles from './Leaderboard.module.css'

// ── Scoring ──────────────────────────────────────────────────────────────────
// A jumper's score is just the team's adjusted total for each event they flew
// (raw round sum + handicap, set as rawScore at Publish time). No placement
// table, no dropped events.

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadPublished(): PublishedEventResult[] {
  try { return JSON.parse(localStorage.getItem('sq-results-2026') ?? '[]') } catch { return [] }
}

function loadAwards(): GalaAward[] {
  try { return JSON.parse(localStorage.getItem('sq-gala-2026') ?? '[]') } catch { return [] }
}

// ── Season-event metadata ────────────────────────────────────────────────────
// Used by the Individual table to render a column-per-event grid so jumpers
// can see how each meet contributed to their total — instead of a wall of
// inline chips.

const SCORING_EVENTS: EventInstance[] = EVENT_INSTANCES
  .filter(e => e.typeSlug !== 'awards' && e.status !== 'season-finale')
  .slice()
  .sort((a, b) => a.date.localeCompare(b.date))

const TOTAL_EVENTS = SCORING_EVENTS.length

const EVENT_TYPE_ABBREV: Record<string, string> = {
  scsl: 'SCSL',
  'poker-run': 'Poker',
  'dueling-dzs': 'DDZ',
  crazy8s: 'C8',
  'ghost-nationals': 'Ghost',
  'fury-classic-8way': 'F8',
}

function eventShortLabel(e: EventInstance): string {
  const d = new Date(e.date + 'T12:00:00')
  const mon = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const type = EVENT_TYPE_ABBREV[e.typeSlug] ?? e.typeSlug
  return `${mon} ${type}`
}

// ── Compute standings from published results ──────────────────────────────────

function computeTeamStandings(results: PublishedEventResult[], division: Division): LeaderboardEntry[] {
  const teamMap = new Map<string, LeaderboardEntry>()

  for (const result of results) {
    for (const team of result.teams) {
      if (team.division !== division) continue
      const key = team.teamId
      const existing = teamMap.get(key) ?? {
        rank: 0, teamId: team.teamId, teamName: team.teamName,
        members: team.members, division: team.division,
        totalPoints: 0, eventsAttended: [] as string[],
        bestFinishRank: undefined, bestFinishEvent: undefined,
      }
      existing.eventsAttended.push(result.instanceId)
      existing.totalPoints += team.rawScore
      if (!existing.bestFinishRank || team.rank < existing.bestFinishRank) {
        existing.bestFinishRank = team.rank
        existing.bestFinishEvent = result.eventName
      }
      teamMap.set(key, existing)
    }
  }

  const standings = Array.from(teamMap.values())
  standings.sort((a, b) => b.totalPoints - a.totalPoints)
  standings.forEach((e, i) => { e.rank = i + 1 })
  return standings
}

/**
 * Normalize a jumper name into a stable key so the same person across events
 * counts once. Handles:
 *   - case ("SantAngelo" vs "Santangelo")
 *   - punctuation/whitespace ("D'Amico" vs "DAmico")
 *   - common short-form first names (Sam/Samuel, Matt/Matthew, Chris/Christopher).
 *
 * Add to NICKNAMES below as new collisions surface — don't try to be clever
 * here. False positives (merging two different people) are worse than false
 * negatives (showing the same person twice).
 */
const NICKNAMES: Record<string, string> = {
  sam: 'samuel',
  matt: 'matthew',
  chris: 'christopher',
  mike: 'michael',
  jess: 'jessica',
  rosie: 'rosemary',
  rose: 'rosemary',
  alex: 'alexander',
  zach: 'zachary',
  josh: 'joshua',
}
function normalizeJumperKey(name: string): string {
  const cleaned = (name || '').toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim()
  if (!cleaned) return ''
  const parts = cleaned.split(' ')
  const first = NICKNAMES[parts[0]] ?? parts[0]
  return [first, ...parts.slice(1)].join(' ')
}

function computeIndividual(results: PublishedEventResult[], totalSeasonEvents: number): IndividualStanding[] {
  const map = new Map<string, Omit<IndividualStanding, 'rank' | 'totalPoints' | 'droppedEventId'>>()

  for (const result of results) {
    for (const team of result.teams) {
      for (const member of team.members) {
        const key = normalizeJumperKey(member.name) || member.id || member.name
        const existing = map.get(key) ?? {
          jumperId: key, name: member.name, division: team.division,
          eventScores: [],
        }
        existing.eventScores.push({
          instanceId: result.instanceId, eventName: result.eventName,
          points: team.rawScore, teamName: team.teamName,
        })
        map.set(key, existing)
      }
    }
  }

  const standings: IndividualStanding[] = []
  map.forEach(p => {
    // Drop-lowest rule: best (N-1) of N when the jumper has flown every
    // scoring event in the season. If they missed any event, they've already
    // implicitly "dropped" the missing one by not counting it, so nothing more
    // is removed — this is what keeps drops invisible mid-season while the
    // bad-day-doesn't-end-your-run forgiveness still applies once everyone's
    // flown the full schedule.
    const flewAll = p.eventScores.length >= totalSeasonEvents && totalSeasonEvents > 0
    let droppedEventId: string | undefined = undefined
    let totalPoints = 0
    if (flewAll) {
      const lowest = p.eventScores.reduce((min, e) => e.points < min.points ? e : min, p.eventScores[0])
      droppedEventId = lowest.instanceId
      totalPoints = p.eventScores.reduce((s, e) => s + e.points, 0) - lowest.points
    } else {
      totalPoints = p.eventScores.reduce((s, e) => s + e.points, 0)
    }
    standings.push({
      rank: 0, jumperId: p.jumperId, name: p.name, division: p.division,
      eventScores: p.eventScores,
      droppedEventId,
      totalPoints,
    })
  })

  standings.sort((a, b) => b.totalPoints - a.totalPoints)
  standings.forEach((e, i) => { e.rank = i + 1 })
  return standings
}

// ── Tab type ──────────────────────────────────────────────────────────────────

type Tab = 'AAA' | 'AA' | 'A' | 'Individual' | 'Awards'
const TABS: Tab[] = ['AAA', 'AA', 'A', 'Individual', 'Awards']

// ── Reusable content ─────────────────────────────────────────────────────────
// Shared between the public /leaderboard page (wrapped with Nav/Footer below)
// and the admin /admin/leaderboard preview (wrapped with the admin chrome).
// No `wrap` div here — wrapper provides padding/spacing.

export function LeaderboardContent() {
  const [tab, setTab] = useState<Tab>('AAA')
  const [published, setPublished] = useState<PublishedEventResult[]>(loadPublished)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDocs(collection(db, 'results_2026'))
      .then(snap => {
        const results = snap.docs.map(d => d.data() as PublishedEventResult)
        if (results.length > 0) {
          setPublished(results)
          localStorage.setItem('sq-results-2026', JSON.stringify(results))
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const hasPublished = published.length > 0
  const awards = loadAwards().filter(a => a.isPublished)

  function teamEntries(div: Division): LeaderboardEntry[] {
    if (hasPublished) return computeTeamStandings(published, div)
    return []
  }

  const individual = computeIndividual(published, TOTAL_EVENTS)

  const divTabs: Tab[] = ['AAA', 'AA', 'A']
  const isTeamTab = divTabs.includes(tab)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h1 className="display" style={{ fontSize: 'clamp(26px, 6vw, 46px)' }}>2026 Leaderboard</h1>
        <span className="pill pill-live">SEASON LIVE</span>
      </div>
      <p style={{ color: 'var(--sq-gray)', marginTop: 8 }}>
        {loading ? 'Loading results…' : hasPublished
          ? `Through ${published.length} of ${TOTAL_EVENTS} scoring events · Live`
          : 'No results yet — check back after the first event!'}
      </p>

      {/* KPI strip */}
      <div className={styles.statRow}>
        <div className="card"><div className={styles.statNum}>186</div><div className={styles.statLbl}>Jumpers</div></div>
        <div className="card"><div className={styles.statNum}>48</div><div className={styles.statLbl}>Teams</div></div>
        <div className="card"><div className={styles.statNum}>{published.length} / {TOTAL_EVENTS}</div><div className={styles.statLbl}>Events Scored</div></div>
        <div className="card"><div className={styles.statNum}>428</div><div className={styles.statLbl}>Top Individual Pts</div></div>
      </div>

      {/* Tab bar */}
      <div className={styles.toolbar}>
        <div className={styles.divTabs}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''} ${!divTabs.includes(t) ? styles.tabSpecial : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <select className={styles.seasonSelect}>
          <option>2026 Season</option>
          <option>2025 Season (archived)</option>
        </select>
      </div>

      {/* ── Team division tab ── */}
      {isTeamTab && (() => {
        const entries = teamEntries(tab as Division)
        if (entries.length === 0) return (
          <div className="card" style={{ textAlign: 'center', color: 'var(--sq-gray)', padding: 48 }}>
            No results yet for {tab} — check back after the first event!
          </div>
        )
        return (
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="lb">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>Events</th>
                  <th>Best Finish</th>
                  <th style={{ textAlign: 'right' }}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr key={entry.teamId}>
                    <td className={`rank ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}>{entry.rank}</td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{entry.teamName}</div>
                      <div style={{ color: 'var(--sq-gray)', fontSize: 12, marginTop: 2 }}>
                        {entry.members.map(m => m.name).join(' · ')}
                      </div>
                    </td>
                    <td>
                      <div className={styles.dots}>
                        {Array.from({ length: TOTAL_EVENTS }, (_, i) => (
                          <span key={i} className={`${styles.dot} ${i < entry.eventsAttended.length ? styles.dotOn : ''}`} />
                        ))}
                      </div>
                    </td>
                    <td>
                      {entry.bestFinishRank && (
                        <span style={{ fontSize: 12, color: 'var(--sq-gray)' }}>
                          <span style={{ color: entry.bestFinishRank === 1 ? 'var(--sq-yellow)' : 'inherit', fontWeight: 700 }}>
                            {entry.bestFinishRank === 1 ? '1st' : entry.bestFinishRank === 2 ? '2nd' : `${entry.bestFinishRank}rd`}
                          </span>
                          {' · '}{entry.bestFinishEvent}
                        </span>
                      )}
                    </td>
                    <td className="pts">{entry.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      })()}

      {/* ── Individual tab — per-event score grid ── */}
      {tab === 'Individual' && (
        individual.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--sq-gray)', padding: 48 }}>
            Individual standings will appear here once event results are published.
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table className="lb">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th style={{ minWidth: 160 }}>Jumper</th>
                    {SCORING_EVENTS.map(ev => (
                      <th
                        key={ev.id}
                        style={{ textAlign: 'center', width: 64, fontSize: 10, letterSpacing: '.04em' }}
                        title={`${ev.name} — ${new Date(ev.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      >
                        {eventShortLabel(ev)}
                      </th>
                    ))}
                    <th style={{ textAlign: 'right', width: 56 }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {individual.map(entry => {
                    const scoreByEvent = new Map(entry.eventScores.map(s => [s.instanceId, s]))
                    return (
                      <tr key={entry.jumperId}>
                        <td className={`rank ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}>{entry.rank}</td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{entry.name}</div>
                        </td>
                        {SCORING_EVENTS.map(ev => {
                          const score = scoreByEvent.get(ev.id)
                          if (!score) {
                            return (
                              <td key={ev.id} style={{ textAlign: 'center', color: 'var(--sq-gray)', fontSize: 13 }}>
                                —
                              </td>
                            )
                          }
                          const dropped = ev.id === entry.droppedEventId
                          return (
                            <td
                              key={ev.id}
                              style={{
                                textAlign: 'center',
                                fontSize: 13,
                                fontWeight: 600,
                                color: dropped ? 'var(--sq-gray)' : 'var(--sq-white, var(--adm-ink))',
                                opacity: dropped ? 0.4 : 1,
                                textDecoration: dropped ? 'line-through' : 'none',
                              }}
                              title={`${score.teamName} +${score.points}${dropped ? ' (dropped)' : ''}`}
                            >
                              {score.points}
                            </td>
                          )
                        })}
                        <td className="pts" style={{ fontWeight: 700 }}>{entry.totalPoints}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className={styles.legend} style={{ marginTop: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--sq-gray)' }}>
                Each cell shows the jumper's team adjusted total (raw round sum + handicap) for that event,
                or — if they didn't fly. Once a jumper has flown all {TOTAL_EVENTS} scoring events,
                their worst event is dropped (shown struck-through).
              </span>
            </div>
          </>
        )
      )}

      {/* ── Awards tab ── */}
      {tab === 'Awards' && (
        awards.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--sq-gray)', padding: 48 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏅</div>
            <div style={{ fontFamily: 'Bungee, sans-serif', fontSize: 18, color: 'var(--sq-white)', marginBottom: 8 }}>
              Gala Awards
            </div>
            Award results will be announced at the year-end gala. See you at the Bombshelter!
          </div>
        ) : (
          <div className={styles.awardGrid}>
            {awards.map(award => (
              <div key={award.id} className={`card ${styles.awardCard}`}>
                <div className={styles.awardCategory}>{award.category}</div>
                <div className={styles.awardWinner}>🏆 {award.winner}</div>
                {award.notes && <div className={styles.awardNotes}>{award.notes}</div>}
              </div>
            ))}
          </div>
        )
      )}

      {isTeamTab && (
        <div className={styles.legend}>
          <span><span className={`${styles.dot} ${styles.dotOn}`} /> Attended</span>
          <span style={{ fontSize: 12, color: 'var(--sq-gray)' }}>
            Score = sum of team adjusted totals across every event flown.
          </span>
        </div>
      )}
    </>
  )
}

// ── Public page ──────────────────────────────────────────────────────────────

export default function Leaderboard() {
  return (
    <>
      <Nav />
      <div className="wrap" style={{ paddingTop: 48 }}>
        <LeaderboardContent />
      </div>
      <Footer />
    </>
  )
}
