import { useState } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { LEADERBOARD_AAA, LEADERBOARD_AA } from '../data/mockData'
import type {
  LeaderboardEntry, Division, IndividualStanding, GalaAward,
  PublishedEventResult,
} from '../types'
import styles from './Leaderboard.module.css'

// ── Points table ─────────────────────────────────────────────────────────────

const RANKING_POINTS = [150, 120, 100, 80, 65, 55, 45, 35, 25, 15]
function rankPts(rank: number) { return RANKING_POINTS[rank - 1] ?? 10 }

// ── localStorage helpers ──────────────────────────────────────────────────────

function loadPublished(): PublishedEventResult[] {
  try { return JSON.parse(localStorage.getItem('sq-results-2026') ?? '[]') } catch { return [] }
}

function loadAwards(): GalaAward[] {
  try { return JSON.parse(localStorage.getItem('sq-gala-2026') ?? '[]') } catch { return [] }
}

// ── Compute standings from published results ──────────────────────────────────

function computeTeamStandings(results: PublishedEventResult[], division: Division): LeaderboardEntry[] {
  const teamMap = new Map<string, LeaderboardEntry & { _pts: number[] }>()

  for (const result of results) {
    for (const team of result.teams) {
      if (team.division !== division) continue
      const key = team.teamId
      const existing = teamMap.get(key) ?? {
        rank: 0, teamId: team.teamId, teamName: team.teamName,
        members: team.members, division: team.division,
        totalPoints: 0, eventsAttended: [],
        bestFinishRank: undefined, bestFinishEvent: undefined,
        _pts: [],
      }
      existing.eventsAttended.push(result.instanceId)
      existing._pts.push(team.rankingPoints)
      if (!existing.bestFinishRank || team.rank < existing.bestFinishRank) {
        existing.bestFinishRank = team.rank
        existing.bestFinishEvent = result.eventName
      }
      teamMap.set(key, existing)
    }
  }

  const standings: LeaderboardEntry[] = []
  teamMap.forEach(entry => {
    const sorted = [...entry._pts].sort((a, b) => a - b)
    const counted = sorted.length >= 2 ? sorted.slice(1) : sorted
    standings.push({ ...entry, totalPoints: counted.reduce((s, p) => s + p, 0) })
  })

  standings.sort((a, b) => b.totalPoints - a.totalPoints)
  standings.forEach((e, i) => { e.rank = i + 1 })
  return standings
}

function computeIndividual(results: PublishedEventResult[]): IndividualStanding[] {
  const map = new Map<string, Omit<IndividualStanding, 'rank' | 'totalPoints' | 'droppedEventId'> & { _pts: number[] }>()

  for (const result of results) {
    for (const team of result.teams) {
      for (const member of team.members) {
        const key = member.id || member.name
        const existing = map.get(key) ?? {
          jumperId: key, name: member.name, division: team.division,
          eventScores: [], _pts: [],
        }
        existing.eventScores.push({
          instanceId: result.instanceId, eventName: result.eventName,
          points: team.rankingPoints, teamName: team.teamName,
        })
        existing._pts.push(team.rankingPoints)
        map.set(key, existing)
      }
    }
  }

  const standings: IndividualStanding[] = []
  map.forEach(p => {
    const sorted = [...p.eventScores].sort((a, b) => a.points - b.points)
    const droppedEventId = sorted.length >= 2 ? sorted[0].instanceId : undefined
    const counted = sorted.length >= 2 ? sorted.slice(1) : sorted
    standings.push({
      rank: 0, jumperId: p.jumperId, name: p.name, division: p.division,
      eventScores: p.eventScores, droppedEventId,
      totalPoints: counted.reduce((s, e) => s + e.points, 0),
    })
  })

  standings.sort((a, b) => b.totalPoints - a.totalPoints)
  standings.forEach((e, i) => { e.rank = i + 1 })
  return standings
}

// ── Tab type ──────────────────────────────────────────────────────────────────

type Tab = 'AAA' | 'AA' | 'A' | 'Individual' | 'Awards'
const TABS: Tab[] = ['AAA', 'AA', 'A', 'Individual', 'Awards']
const TOTAL_EVENTS = 6

// ── Component ─────────────────────────────────────────────────────────────────

export default function Leaderboard() {
  const [tab, setTab] = useState<Tab>('AAA')

  const published = loadPublished()
  const hasPublished = published.length > 0
  const awards = loadAwards().filter(a => a.isPublished)

  // Team data: prefer published results, fall back to mock
  function teamEntries(div: Division): LeaderboardEntry[] {
    if (hasPublished) return computeTeamStandings(published, div)
    if (div === 'AAA') return LEADERBOARD_AAA
    if (div === 'AA') return LEADERBOARD_AA
    return []
  }

  const individual = computeIndividual(published)

  const divTabs: Tab[] = ['AAA', 'AA', 'A']
  const isTeamTab = divTabs.includes(tab)

  return (
    <>
      <Nav />
      <div className="wrap" style={{ paddingTop: 48 }}>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
          <h1 className="display" style={{ fontSize: 'clamp(26px, 6vw, 46px)' }}>2026 Leaderboard</h1>
          <span className="pill pill-live">SEASON LIVE</span>
        </div>
        <p style={{ color: 'var(--sq-gray)', marginTop: 8 }}>
          Through 2 of 6 scoring events · Updated May 8, 2026
        </p>

        {/* KPI strip */}
        <div className={styles.statRow}>
          <div className="card"><div className={styles.statNum}>186</div><div className={styles.statLbl}>Jumpers</div></div>
          <div className="card"><div className={styles.statNum}>48</div><div className={styles.statLbl}>Teams</div></div>
          <div className="card"><div className={styles.statNum}>2 / 6</div><div className={styles.statLbl}>Events Scored</div></div>
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

        {/* ── Individual tab ── */}
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
                      <th>#</th>
                      <th>Jumper</th>
                      <th>Div</th>
                      <th>Events</th>
                      <th style={{ textAlign: 'right' }}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individual.map(entry => (
                      <tr key={entry.jumperId}>
                        <td className={`rank ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}>{entry.rank}</td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{entry.name}</div>
                          <div style={{ color: 'var(--sq-gray)', fontSize: 12, marginTop: 2 }}>
                            {entry.eventScores.map(e => (
                              <span key={e.instanceId} style={{ opacity: e.instanceId === entry.droppedEventId ? 0.4 : 1, textDecoration: e.instanceId === entry.droppedEventId ? 'line-through' : 'none', marginRight: 6 }}>
                                {e.teamName} +{e.points}
                              </span>
                            ))}
                            {entry.droppedEventId && (
                              <span style={{ color: 'var(--sq-gray)', fontSize: 11 }}>(lowest dropped)</span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--sq-gray)' }}>{entry.division}</td>
                        <td>
                          <div className={styles.dots}>
                            {Array.from({ length: TOTAL_EVENTS }, (_, i) => (
                              <span key={i} className={`${styles.dot} ${i < entry.eventScores.length ? styles.dotOn : ''}`} />
                            ))}
                          </div>
                        </td>
                        <td className="pts">{entry.totalPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.legend} style={{ marginTop: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--sq-gray)' }}>
                  Score = team placement points per event · lowest event score dropped when ≥ 2 attended
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
              Points: 1st={rankPts(1)}, 2nd={rankPts(2)}, 3rd={rankPts(3)}, 4th={rankPts(4)}, 5th={rankPts(5)}… · lowest event dropped
            </span>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
