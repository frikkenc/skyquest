import { useState } from 'react'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import { LEADERBOARD_AAA, LEADERBOARD_AA } from '../data/mockData'
import type { LeaderboardEntry, Division } from '../types'
import styles from './Leaderboard.module.css'

const DIVISIONS: Division[] = ['AAA', 'AA', 'A']
const DATA: Partial<Record<Division, LeaderboardEntry[]>> = {
  AAA: LEADERBOARD_AAA,
  AA: LEADERBOARD_AA,
  A: [],
}

const TOTAL_EVENTS = 6

export default function Leaderboard() {
  const [division, setDivision] = useState<Division>('AAA')
  const entries = DATA[division] ?? []

  return (
    <>
      <Nav />
      <div className="wrap" style={{ paddingTop: 48 }}>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
          <h1 className="display" style={{ fontSize: 46 }}>2026 Leaderboard</h1>
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

        {/* Division tabs */}
        <div className={styles.toolbar}>
          <div className={styles.divTabs}>
            {DIVISIONS.map(div => (
              <button
                key={div}
                className={`${styles.tab} ${division === div ? styles.tabActive : ''}`}
                onClick={() => setDivision(div)}
              >
                {div}
              </button>
            ))}
          </div>
          <select className={styles.seasonSelect}>
            <option>2026 Season</option>
            <option>2025 Season (archived)</option>
          </select>
        </div>

        {entries.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--sq-gray)', padding: 48 }}>
            No results yet for {division} — check back after the first event!
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
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
                          <span
                            key={i}
                            className={`${styles.dot} ${i < entry.eventsAttended.length ? styles.dotOn : ''}`}
                          />
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
        )}

        <div className={styles.legend}>
          <span><span className={`${styles.dot} ${styles.dotOn}`} /> Attended</span>
          <span style={{ fontSize: 12, color: 'var(--sq-gray)' }}>Points table: 1st=150, 2nd=120, 3rd=100, 4th=80, 5th=65…</span>
        </div>
      </div>
      <Footer />
    </>
  )
}
