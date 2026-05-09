import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { EVENT_INSTANCES, EVENT_TYPES, REGISTRATIONS, SCSL_RESULTS, PENDING_REFUNDS } from '../../data/mockData'
import StatusPill from '../../components/StatusPill'
import EventBadge from '../../components/EventBadge'
import type { Division } from '../../types'
import styles from './AdminEventInstance.module.css'

type Tab = 'Registrations' | 'Scores' | 'Waitlist' | 'Payments' | 'Emails'
const TABS: Tab[] = ['Registrations', 'Scores', 'Waitlist', 'Payments', 'Emails']

const ROUNDS = 8
const DIVISIONS: Division[] = ['AAA', 'AA', 'A', 'Rookie']

// Editable score grid state
const initScores = SCSL_RESULTS.map(r => ({ ...r, roundScores: [...r.roundScores] }))

export default function AdminEventInstance() {
  const { typeSlug, instanceId } = useParams<{ typeSlug: string; instanceId: string }>()
  const [tab, setTab] = useState<Tab>('Registrations')
  const [division, setDivision] = useState<Division>('AA')
  const [scores, setScores] = useState(initScores)
  const [saved, setSaved] = useState(false)
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set())

  const event = EVENT_INSTANCES.find(e => e.id === instanceId)
  const eventType = EVENT_TYPES.find(t => t.slug === typeSlug)
  const registrations = REGISTRATIONS.filter(r => r.eventId === instanceId)

  if (!event || !eventType) {
    return <div style={{ padding: 48, color: 'var(--adm-mute)' }}>Event not found.</div>
  }

  function formatDate(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function updateScore(teamIdx: number, roundIdx: number, val: string) {
    const n = parseInt(val)
    if (isNaN(n) || n < 0) return
    setScores(prev => {
      const next = prev.map(r => ({ ...r, roundScores: [...r.roundScores] }))
      next[teamIdx].roundScores[roundIdx] = n
      next[teamIdx].total = next[teamIdx].roundScores.reduce((a, b) => a + b, 0)
      // re-rank
      const sorted = [...next].sort((a, b) => b.total - a.total)
      sorted.forEach((r, i) => { r.rank = i + 1 })
      return next
    })
    setSaved(false)
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

      {/* Hero */}
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
            { n: event.waitlistCount ?? 0, l: 'Waitlist' },
          ].map(k => (
            <div key={k.l} className={styles.heroKpi}>
              <div className={styles.heroKpiN}>{k.n}</div>
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

      {/* Tabs */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabOn : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
            {t === 'Registrations' && registrations.filter(r => r.status === 'pending').length > 0 && (
              <span className={styles.tabBadge}>{registrations.filter(r => r.status === 'pending').length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── REGISTRATIONS TAB ── */}
      {tab === 'Registrations' && (
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
                  <th style={thStyle}>Team</th>
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
                    <td style={{ ...tdStyle, fontWeight: 700 }}>{reg.teamName}</td>
                    <td style={tdStyle}>{reg.division}</td>
                    <td style={{ ...tdStyle, color: 'var(--adm-mute)', fontSize: 12 }}>
                      {reg.members.map(m => m.name).join(', ')}
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

      {/* ── SCORES TAB ── */}
      {tab === 'Scores' && (
        <div>
          <div className={styles.toolbar}>
            <div className={styles.divPills}>
              {DIVISIONS.map(d => (
                <button
                  key={d}
                  className={`${styles.divPill} ${division === d ? styles.divPillOn : ''}`}
                  onClick={() => setDivision(d)}
                >
                  {d}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {!saved && <span style={{ fontSize: 12, color: 'var(--sq-yellow)', alignSelf: 'center' }}>● Unsaved changes</span>}
              <button className={styles.adminBtn} onClick={() => setSaved(false)}>Reset</button>
              <button className={`${styles.adminBtn} ${styles.primary}`} onClick={() => setSaved(true)}>
                {saved ? '✓ Saved' : 'Save Scores'}
              </button>
            </div>
          </div>

          <div className={styles.scoreGridWrap}>
            <table className={styles.scoreGrid}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', width: 36 }}>#</th>
                  <th style={{ textAlign: 'left', minWidth: 160 }}>Team</th>
                  {Array.from({ length: ROUNDS }, (_, i) => (
                    <th key={i} style={{ textAlign: 'center', width: 52 }}>R{i + 1}</th>
                  ))}
                  <th style={{ textAlign: 'center', width: 64 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {scores.filter(r => r.division === division).length === 0 ? (
                  <tr><td colSpan={ROUNDS + 3} style={{ padding: 24, textAlign: 'center', color: 'var(--adm-mute)' }}>No teams in {division} yet.</td></tr>
                ) : (
                  scores
                    .filter(r => r.division === division)
                    .sort((a, b) => a.rank - b.rank)
                    .map((result, teamIdx) => (
                      <tr key={result.teamId}>
                        <td className={`${styles.rankCell} ${result.rank === 1 ? styles.r1 : result.rank === 2 ? styles.r2 : result.rank === 3 ? styles.r3 : ''}`}>
                          {result.rank}
                        </td>
                        <td style={{ paddingLeft: 14, fontWeight: 600, fontSize: 13, color: 'var(--adm-ink)' }}>
                          <div>{result.teamName}</div>
                          <div style={{ fontSize: 11, color: 'var(--adm-mute)', marginTop: 1 }}>
                            {result.members.map(m => m.name).join(', ')}
                          </div>
                        </td>
                        {result.roundScores.map((score, roundIdx) => (
                          <td key={roundIdx} style={{ padding: '6px 4px', textAlign: 'center' }}>
                            <input
                              type="number"
                              min={0}
                              max={99}
                              value={score}
                              onChange={e => updateScore(scores.indexOf(result), roundIdx, e.target.value)}
                              className={styles.scoreInput}
                            />
                          </td>
                        ))}
                        <td className={styles.totalCell}>{result.total}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: 'var(--adm-mute)', marginTop: 10 }}>
            Totals and rankings recalculate live. Click Save Scores to publish results.
          </p>
        </div>
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
              { name: 'scsl_reg_confirmation', subject: "You're in! SCSL @ Elsinore — Mar 15", sent: 14, date: 'Mar 1' },
              { name: 'scsl_dive_pool', subject: 'SCSL Elsinore Spring dive pool is live', sent: 14, date: 'Mar 10' },
              { name: 'scsl_results_posted', subject: 'SCSL Elsinore Spring results — your team scored', sent: 14, date: 'Mar 16' },
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
