import { useState } from 'react'
import {
  SEASON_KPIS,
  APPROVAL_QUEUE,
  PENDING_REFUNDS,
  EVENT_INSTANCES,
  EVENT_TYPES,
} from '../../data/mockData'
import type { ApprovalQueueItem, PendingRefund } from '../../types'
import styles from './AdminDashboard.module.css'

function formatCurrency(n: number) {
  return '$' + n.toLocaleString()
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 60) return `${diff}m ago`
  return `${Math.floor(diff / 60)}h ago`
}

export default function AdminDashboard() {
  const [queue, setQueue] = useState<ApprovalQueueItem[]>(APPROVAL_QUEUE)
  const [refunds, setRefunds] = useState<PendingRefund[]>(PENDING_REFUNDS)
  const [approvalCount, setApprovalCount] = useState(APPROVAL_QUEUE.length)
  const [refundCount, setRefundCount] = useState(PENDING_REFUNDS.length)

  const nextEvent = EVENT_INSTANCES.find(e => e.status === 'open' || e.status === 'upcoming')
  const nextEventType = nextEvent ? EVENT_TYPES.find(t => t.slug === nextEvent.typeSlug) : null
  const upcomingEvents = EVENT_INSTANCES.filter(e => e.status !== 'complete').slice(0, 5)

  function handleApprove(id: string) {
    setQueue(q => q.filter(item => item.id !== id))
    setApprovalCount(c => c - 1)
  }

  function handleRefund(id: string) {
    setRefunds(r => r.filter(item => item.id !== id))
    setRefundCount(c => c - 1)
  }

  const eventTypeColor: Record<string, string> = {
    'scsl':        'rgba(21,101,192,.2)',
    'poker-run':   'rgba(242,140,40,.15)',
    'dueling-dzs': 'rgba(200,16,46,.15)',
    'crazy8s':     'rgba(245,166,35,.15)',
  }
  const eventTypeTextColor: Record<string, string> = {
    'scsl':        '#64b5f6',
    'poker-run':   '#F28C28',
    'dueling-dzs': '#ef9a9a',
    'crazy8s':     '#fdd835',
  }

  return (
    <>
      {/* Sync row */}
      <div className={styles.syncRow}>
        <span className={styles.syncDot} />
        <span>Live sync active · Last refresh <strong>47 seconds ago</strong></span>
        <button className={styles.syncBtn}>⟲ Refresh All</button>
        <span className={styles.apiLabel}>fury_admin_session · fury_admin_badge_counts</span>
      </div>

      {/* KPI Strip */}
      <div>
        <div className={styles.sectionHd}>
          <span className={styles.sectionLabel}>Season at a Glance — 2026</span>
          <span className={styles.apiTag}>fury_admin_money_summary + fury_admin_people_summary</span>
        </div>
        <div className={styles.kpiStrip}>
          <div className={`${styles.kpiCard} ${styles.kpiHi}`}>
            <div className={styles.kpiN}>{formatCurrency(SEASON_KPIS.totalRevenue)}</div>
            <div className={styles.kpiL}>Total Revenue</div>
            <div className={styles.kpiDelta}>↑ $1,320 this week</div>
            <div className={styles.kpiSync}>synced 47s ago</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiN}>{SEASON_KPIS.registrations}</div>
            <div className={styles.kpiL}>Registrations</div>
            <div className={styles.kpiDelta}>↑ 22 since last event</div>
            <div className={styles.kpiSync}>synced 47s ago</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiN}>{SEASON_KPIS.uniqueJumpers}</div>
            <div className={styles.kpiL}>Unique Jumpers</div>
            <div className={styles.kpiSync}>synced 47s ago</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiN}>{SEASON_KPIS.eventsRun}</div>
            <div className={styles.kpiL}>Events Run</div>
            <div className={styles.kpiDeltaMuted}>{SEASON_KPIS.eventsTotal - SEASON_KPIS.eventsRun} remaining</div>
            <div className={styles.kpiSync}>synced 47s ago</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={`${styles.kpiN} ${styles.kpiNYellow}`}>{formatCurrency(SEASON_KPIS.pendingBalance)}</div>
            <div className={styles.kpiL}>Pending Balances</div>
            <div className={`${styles.kpiDelta} ${styles.kpiDeltaNeg}`}>2 unpaid teams</div>
            <div className={styles.kpiSync}>synced 47s ago</div>
          </div>
        </div>
      </div>

      {/* Approval Queue */}
      <div>
        <div className={styles.sectionHd}>
          <span className={styles.sectionLabel}>
            Approval Queue{' '}
            {approvalCount > 0 && <span className={styles.countPill}>{approvalCount}</span>}
          </span>
          <span className={styles.apiTag}>fury_admin_approval_queue</span>
        </div>
        <div className={styles.queue}>
          {queue.length === 0 ? (
            <div className={styles.queueEmpty}>✓ No pending approvals</div>
          ) : queue.map(item => (
            <div key={item.id} className={styles.aqRow}>
              <span
                className={styles.aqEventBadge}
                style={{
                  background: eventTypeColor[item.eventTypeSlug] ?? 'rgba(255,255,255,.1)',
                  color: eventTypeTextColor[item.eventTypeSlug] ?? '#ccc',
                }}
              >
                {item.eventName}
              </span>
              <div className={styles.aqTeam}>
                <div className={styles.aqTeamName}>{item.teamName}</div>
                <div className={styles.aqMembers}>{item.members.join(' · ')}</div>
              </div>
              <div className={styles.aqDivision}>{item.division} · 4-way</div>
              <div className={styles.aqTimestamp}>{timeAgo(item.submittedAt)}</div>
              <div className={styles.aqActions}>
                <button className={`${styles.aqBtn} ${styles.approve}`} onClick={() => handleApprove(item.id)}>✓ Approve</button>
                <button className={`${styles.aqBtn} ${styles.waitlist}`} onClick={() => handleApprove(item.id)}>Waitlist</button>
                <button className={`${styles.aqBtn} ${styles.deny}`} onClick={() => handleApprove(item.id)}>✕ Deny</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2-col: Next Event + Pending Refunds */}
      <div className={styles.twoCol}>
        {/* Next Event */}
        <div>
          <div className={styles.sectionHd}>
            <span className={styles.sectionLabel}>Next Event</span>
            <span className={styles.apiTag}>fury_admin_list_events · fury_admin_offering_stats</span>
          </div>
          {nextEvent && (
            <div className={styles.nextEvent}>
              <div className={styles.neInfo}>
                <div className={styles.neCountdown}>
                  {new Date(nextEvent.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} · {daysUntil(nextEvent.date)} DAYS AWAY
                </div>
                <div className={styles.neTitle}>{nextEvent.name.split(' @')[0].split(' —')[0]}</div>
                <div className={styles.neMeta}>
                  {nextEvent.dropzone}
                  <span className="pill pill-open" style={{ marginLeft: 8 }}>Reg Open</span>
                </div>
              </div>
              <div className={styles.neKpis}>
                {[
                  { n: nextEvent.registrationCount, l: 'Registered', sub: `${nextEvent.approvedCount} paid` },
                  { n: nextEvent.registrationCount - nextEvent.approvedCount, l: 'Pending', sub: 'needs action', warn: true },
                  { n: formatCurrency(nextEvent.revenue ?? 0), l: 'Revenue', sub: '+$240 today' },
                  { n: nextEvent.waitlistCount ?? 0, l: 'Waitlist', sub: '' },
                ].map(kpi => (
                  <div key={kpi.l} className={styles.neKpi}>
                    <div className={styles.neKpiN}>{kpi.n}</div>
                    <div className={styles.neKpiL}>{kpi.l}</div>
                    {kpi.sub && <div className={`${styles.neKpiSub} ${kpi.warn ? styles.neKpiSubWarn : ''}`}>{kpi.sub}</div>}
                  </div>
                ))}
              </div>
              <div className={styles.neActions}>
                <button className={`${styles.adminBtn} ${styles.primary}`}>Manage Event ▸</button>
                <button className={styles.adminBtn}>Email Registrants</button>
                <button className={styles.adminBtn}>⟲ Sync</button>
              </div>
            </div>
          )}
        </div>

        {/* Pending Refunds */}
        <div>
          <div className={styles.sectionHd}>
            <span className={styles.sectionLabel}>
              Pending Refunds{' '}
              {refundCount > 0 && <span className={`${styles.countPill} ${styles.countPillYellow}`}>{refundCount}</span>}
            </span>
            <span className={styles.apiTag}>fury_event_pending_refunds</span>
          </div>
          <div className={styles.queue}>
            {refunds.length === 0 ? (
              <div className={styles.queueEmpty}>✓ No pending refunds</div>
            ) : refunds.map(r => (
              <div key={r.id} className={styles.refundRow}>
                <div className={styles.rrTeam}>
                  <div className={styles.rrName}>{r.teamName}</div>
                  <div className={styles.rrMeta}>{r.eventName} · {r.reason}</div>
                </div>
                <div className={styles.rrAmount}>{formatCurrency(r.amount)}</div>
                <div className={styles.aqActions}>
                  <button className={`${styles.aqBtn} ${styles.approve}`} onClick={() => handleRefund(r.id)}>Process</button>
                  <button className={`${styles.aqBtn} ${styles.deny}`} onClick={() => handleRefund(r.id)}>Void</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coming Up */}
      <div>
        <div className={styles.sectionHd}>
          <span className={styles.sectionLabel}>Coming Up</span>
          <span className={styles.apiTag}>fury_admin_list_events · fury_admin_offering_stats</span>
        </div>
        <div className={styles.queue}>
          {upcomingEvents.map(evt => {
            const type = EVENT_TYPES.find(t => t.slug === evt.typeSlug)
            return (
              <div key={evt.id} className={styles.upcomingRow}>
                {type?.logo && <img src={type.logo} alt={type.name} className={styles.upcomingLogo} />}
                <div className={styles.urEvent}>
                  <div className={styles.urName}>{evt.name}</div>
                  <div className={styles.urMeta}>
                    {new Date(evt.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · {evt.dropzone}
                  </div>
                </div>
                <div className={styles.urKpis}>
                  <div className={styles.urKpi}><div className={styles.urKpiN}>{evt.registrationCount}</div><div className={styles.urKpiL}>Reg'd</div></div>
                  <div className={styles.urKpi}><div className={styles.urKpiN}>{evt.approvedCount}</div><div className={styles.urKpiL}>Paid</div></div>
                  <div className={styles.urKpi}><div className={styles.urKpiN}>{formatCurrency(evt.revenue ?? 0)}</div><div className={styles.urKpiL}>Revenue</div></div>
                </div>
                <span className={evt.status === 'open' ? 'pill pill-open' : 'pill pill-soon'}>
                  {evt.status === 'open' ? 'Reg Open' : 'Reg Not Open'}
                </span>
                <div className={styles.aqActions}>
                  <button className={styles.adminBtn}>⟲</button>
                  <button className={`${styles.adminBtn} ${styles.primary}`}>Open ▸</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Unmatched Jumpers */}
      <div>
        <div className={styles.sectionHd}>
          <span className={styles.sectionLabel}>
            Unmatched Jumpers <span className={`${styles.countPill} ${styles.countPillYellow}`}>2</span>
          </span>
          <span className={styles.apiTag}>fury_admin_people_summary</span>
        </div>
        <div className={styles.queue}>
          {[
            { id: 'u1', badge: 'Poker Run', badgeSlug: 'poker-run', name: 'Alex T.', note: 'No Fury Identity match found · USPA # not on file' },
            { id: 'u2', badge: 'Poker Run', badgeSlug: 'poker-run', name: 'B. Williams', note: '3 possible matches in Fury Identity — review required' },
          ].map(u => (
            <div key={u.id} className={styles.aqRow}>
              <span className={styles.aqEventBadge} style={{ background: eventTypeColor[u.badgeSlug], color: eventTypeTextColor[u.badgeSlug] }}>
                {u.badge}
              </span>
              <div className={styles.aqTeam}>
                <div className={styles.aqTeamName}>{u.name}</div>
                <div className={styles.aqMembers}>Registered name: "{u.name}" · {u.note}</div>
              </div>
              <div className={styles.aqActions}>
                <button className={`${styles.aqBtn} ${styles.approve}`}>Match to Profile</button>
                <button className={`${styles.aqBtn} ${styles.waitlist}`}>Create New</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 20 }} />
    </>
  )
}

function daysUntil(iso: string) {
  const diff = new Date(iso + 'T12:00:00').getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}
