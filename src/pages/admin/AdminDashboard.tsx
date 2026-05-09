import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SEASON_KPIS,
  PENDING_REFUNDS,
  EVENT_INSTANCES,
  EVENT_TYPES,
} from '../../data/mockData'
import styles from './AdminDashboard.module.css'

function formatCurrency(n: number) {
  return '$' + n.toLocaleString()
}

function daysUntil(iso: string) {
  const diff = new Date(iso + 'T12:00:00').getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86400000))
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState<string[]>([])

  const openEvents = EVENT_INSTANCES.filter(e => e.status === 'open' || e.status === 'upcoming')
  const nextEvent = openEvents[0]
  const nextEventType = nextEvent ? EVENT_TYPES.find(t => t.slug === nextEvent.typeSlug) : null

  const totalLFT = EVENT_INSTANCES.reduce((sum, e) => sum + (e.lookingForTeamCount ?? 0), 0)
  const totalNotFull = EVENT_INSTANCES.reduce((sum, e) => sum + (e.teamsNotFullCount ?? 0), 0)
  const totalPendingBalance = EVENT_INSTANCES.reduce((sum, e) => sum + (e.pendingBalance ?? 0), 0)

  const refunds = PENDING_REFUNDS.filter(r => !dismissed.includes(r.id))

  return (
    <>
      {/* Sync row */}
      <div className={styles.syncRow}>
        <span className={styles.syncDot} />
        <span>Live sync active · Last refresh <strong>47 seconds ago</strong></span>
        <button className={styles.syncBtn}>⟲ Refresh All</button>
        <span className={styles.apiLabel}>fury_admin_session · fury_admin_badge_counts</span>
      </div>

      {/* Season stat strip — small, not the hero */}
      <div className={styles.statStrip}>
        <div className={styles.statItem}>
          <span className={styles.statN}>{SEASON_KPIS.eventsRun}</span>
          <span className={styles.statDivider}>/</span>
          <span className={styles.statTotal}>{SEASON_KPIS.eventsTotal}</span>
          <span className={styles.statL}>Events Run</span>
        </div>
        <div className={styles.statDivLine} />
        <div className={styles.statItem}>
          <span className={styles.statN}>{SEASON_KPIS.uniqueJumpers}</span>
          <span className={styles.statL}>Unique Jumpers</span>
        </div>
        <div className={styles.statDivLine} />
        <div className={styles.statItem}>
          <span className={`${styles.statN} ${totalLFT > 0 ? styles.statWarn : ''}`}>{totalLFT}</span>
          <span className={styles.statL}>Looking for Team</span>
        </div>
        <div className={styles.statDivLine} />
        <div className={styles.statItem}>
          <span className={`${styles.statN} ${totalNotFull > 0 ? styles.statWarn : ''}`}>{totalNotFull}</span>
          <span className={styles.statL}>Teams Not Full</span>
        </div>
        <div className={styles.statDivLine} />
        <div className={styles.statItem}>
          <span className={`${styles.statN} ${totalPendingBalance > 0 ? styles.statYellow : ''}`}>
            {formatCurrency(totalPendingBalance)}
          </span>
          <span className={styles.statL}>Pending Balances</span>
        </div>
        {refunds.length > 0 && (
          <>
            <div className={styles.statDivLine} />
            <div className={styles.statItem}>
              <span className={`${styles.statN} ${styles.statYellow}`}>{refunds.length}</span>
              <span className={styles.statL}>Pending Refunds</span>
              <a
                href="https://fury.coach/admin/refunds"
                target="_blank"
                rel="noreferrer"
                className={styles.furyLink}
              >
                Handle in Fury ↗
              </a>
            </div>
          </>
        )}
      </div>

      {/* Active/upcoming events — the main content */}
      <div>
        <div className={styles.sectionHd}>
          <span className={styles.sectionLabel}>Open & Upcoming Events</span>
          <span className={styles.apiTag}>fury_admin_list_events · fury_admin_offering_stats</span>
        </div>

        {/* Next event hero */}
        {nextEvent && nextEventType && (
          <div className={styles.nextEvent} style={{ borderLeftColor: nextEventType.color }}>
            <div className={styles.neInfo}>
              <div className={styles.neCountdown} style={{ color: nextEventType.color }}>
                {new Date(nextEvent.date + 'T12:00:00').toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                }).toUpperCase()} · {daysUntil(nextEvent.date)} DAYS AWAY
              </div>
              <div className={styles.neTitle}>{nextEvent.name}</div>
              <div className={styles.neMeta}>
                {nextEvent.dropzone}
                <span className={nextEvent.status === 'open' ? 'pill pill-open' : 'pill pill-soon'} style={{ marginLeft: 8 }}>
                  {nextEvent.status === 'open' ? 'Reg Open' : 'Reg Not Open Yet'}
                </span>
              </div>
            </div>

            <div className={styles.neKpis}>
              <div className={styles.neKpi}>
                <div className={styles.neKpiN}>{nextEvent.registrationCount}</div>
                <div className={styles.neKpiL}>Registered</div>
                <div className={styles.neKpiSub}>{nextEvent.approvedCount} paid</div>
              </div>
              <div className={styles.neKpi}>
                <div className={styles.neKpiN}>{formatCurrency(nextEvent.revenue ?? 0)}</div>
                <div className={styles.neKpiL}>Revenue</div>
              </div>
              {(nextEvent.pendingBalance ?? 0) > 0 && (
                <div className={styles.neKpi}>
                  <div className={`${styles.neKpiN} ${styles.neKpiYellow}`}>{formatCurrency(nextEvent.pendingBalance ?? 0)}</div>
                  <div className={styles.neKpiL}>Pending $</div>
                </div>
              )}
              {(nextEvent.lookingForTeamCount ?? 0) > 0 && (
                <div className={styles.neKpi}>
                  <div className={`${styles.neKpiN} ${styles.neKpiWarn}`}>{nextEvent.lookingForTeamCount}</div>
                  <div className={styles.neKpiL}>LFT</div>
                  <div className={`${styles.neKpiSub} ${styles.neKpiSubWarn}`}>need teaming</div>
                </div>
              )}
              {(nextEvent.teamsNotFullCount ?? 0) > 0 && (
                <div className={styles.neKpi}>
                  <div className={`${styles.neKpiN} ${styles.neKpiWarn}`}>{nextEvent.teamsNotFullCount}</div>
                  <div className={styles.neKpiL}>Not Full</div>
                  <div className={`${styles.neKpiSub} ${styles.neKpiSubWarn}`}>no plan</div>
                </div>
              )}
              {(nextEvent.waitlistCount ?? 0) > 0 && (
                <div className={styles.neKpi}>
                  <div className={styles.neKpiN}>{nextEvent.waitlistCount}</div>
                  <div className={styles.neKpiL}>Waitlist</div>
                </div>
              )}
            </div>

            <div className={styles.neActions}>
              <button
                className={`${styles.adminBtn} ${styles.primary}`}
                onClick={() => navigate(`/admin/events/${nextEvent.typeSlug}/${nextEvent.id}`)}
              >
                Manage Event ▸
              </button>
              <button className={styles.adminBtn}>⟲ Sync</button>
            </div>
          </div>
        )}

        {/* Rest of upcoming events */}
        <div className={styles.queue} style={{ marginTop: 12 }}>
          {openEvents.slice(1).map(evt => {
            const type = EVENT_TYPES.find(t => t.slug === evt.typeSlug)
            return (
              <div
                key={evt.id}
                className={styles.upcomingRow}
                onClick={() => navigate(`/admin/events/${evt.typeSlug}/${evt.id}`)}
              >
                <div className={styles.eventDot} style={{ background: type?.color ?? '#888' }} />
                <div className={styles.urEvent}>
                  <div className={styles.urName}>{evt.name}</div>
                  <div className={styles.urMeta}>
                    {new Date(evt.date + 'T12:00:00').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })} · {evt.dropzone} · {daysUntil(evt.date)} days away
                  </div>
                </div>
                <div className={styles.urKpis}>
                  <div className={styles.urKpi}>
                    <div className={styles.urKpiN}>{evt.registrationCount}</div>
                    <div className={styles.urKpiL}>Reg'd</div>
                  </div>
                  <div className={styles.urKpi}>
                    <div className={styles.urKpiN}>{formatCurrency(evt.revenue ?? 0)}</div>
                    <div className={styles.urKpiL}>Revenue</div>
                  </div>
                  {(evt.pendingBalance ?? 0) > 0 && (
                    <div className={styles.urKpi}>
                      <div className={`${styles.urKpiN} ${styles.urKpiYellow}`}>{formatCurrency(evt.pendingBalance ?? 0)}</div>
                      <div className={styles.urKpiL}>Pending $</div>
                    </div>
                  )}
                  {(evt.lookingForTeamCount ?? 0) > 0 && (
                    <div className={styles.urKpi}>
                      <div className={`${styles.urKpiN} ${styles.urKpiWarn}`}>{evt.lookingForTeamCount}</div>
                      <div className={styles.urKpiL}>LFT</div>
                    </div>
                  )}
                  {(evt.teamsNotFullCount ?? 0) > 0 && (
                    <div className={styles.urKpi}>
                      <div className={`${styles.urKpiN} ${styles.urKpiWarn}`}>{evt.teamsNotFullCount}</div>
                      <div className={styles.urKpiL}>Not Full</div>
                    </div>
                  )}
                </div>
                <span className={evt.status === 'open' ? 'pill pill-open' : 'pill pill-soon'}>
                  {evt.status === 'open' ? 'Open' : 'Upcoming'}
                </span>
              </div>
            )
          })}
          {openEvents.length === 0 && (
            <div className={styles.queueEmpty}>No upcoming events</div>
          )}
        </div>
      </div>

      {/* LFT alert — only show if there are people looking for teams */}
      {totalLFT > 0 && (
        <div>
          <div className={styles.sectionHd}>
            <span className={styles.sectionLabel}>
              Looking for Team
              <span className={`${styles.countPill} ${styles.countPillYellow}`}>{totalLFT}</span>
            </span>
            <span className={styles.apiTag}>fury_admin_event_registrations</span>
          </div>
          <div className={styles.queue}>
            {EVENT_INSTANCES.filter(e => (e.lookingForTeamCount ?? 0) > 0).map(evt => {
              const type = EVENT_TYPES.find(t => t.slug === evt.typeSlug)
              return (
                <div key={evt.id} className={styles.aqRow}>
                  <span
                    className={styles.aqEventBadge}
                    style={{ background: `${type?.color}22`, color: type?.color }}
                  >
                    {type?.shortName}
                  </span>
                  <div className={styles.aqTeam}>
                    <div className={styles.aqTeamName}>{evt.name}</div>
                    <div className={styles.aqMembers}>
                      {evt.lookingForTeamCount} looking for team · {evt.teamsNotFullCount} teams not full / no plan
                    </div>
                  </div>
                  <div className={styles.aqActions}>
                    <button
                      className={`${styles.aqBtn} ${styles.approve}`}
                      onClick={() => navigate(`/admin/events/${evt.typeSlug}/${evt.id}`)}
                    >
                      Open Teaming ▸
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ height: 20 }} />
    </>
  )
}
