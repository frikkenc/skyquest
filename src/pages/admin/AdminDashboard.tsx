import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { EVENT_TYPES } from '../../data/mockData'
import type { SeasonKPIs, PendingRefund } from '../../types'

const SEASON_KPIS: SeasonKPIs = { totalRevenue: 0, registrations: 0, uniqueJumpers: 0, eventsRun: 0, eventsTotal: 0, pendingBalance: 0 }
const PENDING_REFUNDS: PendingRefund[] = []
import { useLiveEventList } from '../../hooks/useLiveEventList'
import { useFuryEventStats } from '../../hooks/useFuryData'
import { EditEventModal } from '../../components/EditEventModal'
import type { EventInstance } from '../../types'
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
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [editing, setEditing] = useState<EventInstance | null>(null)

  async function syncAll() {
    setSyncing(true)
    await queryClient.invalidateQueries({ queryKey: ['fury'] })
    setLastSync(new Date())
    setSyncing(false)
  }

  const { events: allEvents } = useLiveEventList()
  const openEvents = allEvents.filter(e => e.status === 'open' || e.status === 'upcoming')
  const nextEvent = openEvents[0]
  const nextEventType = nextEvent ? EVENT_TYPES.find(t => t.slug === nextEvent.typeSlug) : null

  const totalLFT = allEvents.reduce((sum, e) => sum + (e.lookingForTeamCount ?? 0), 0)
  const totalNotFull = allEvents.reduce((sum, e) => sum + (e.teamsNotFullCount ?? 0), 0)
  const totalPendingBalance = allEvents.reduce((sum, e) => sum + (e.pendingBalance ?? 0), 0)

  const refunds = PENDING_REFUNDS.filter(r => !dismissed.includes(r.id))

  return (
    <>
      {/* Sync row */}
      <div className={styles.syncRow}>
        <span className={styles.syncDot} />
        <span>
          Fury registrations ·{' '}
          {syncing
            ? <strong>Syncing…</strong>
            : lastSync
              ? <>Last sync <strong>{lastSync.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</strong></>
              : <span style={{ opacity: .6 }}>not yet synced</span>
          }
        </span>
        <button className={styles.syncBtn} onClick={syncAll} disabled={syncing}>
          {syncing ? '⟲ Syncing…' : '⟲ Sync All'}
        </button>
        <span className={styles.apiLabel}>fury_admin_event_registrations</span>
      </div>

      {/* Season stat strip */}
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

      {/* Active/upcoming events */}
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
                {(() => {
                  const hasFury = nextEvent.furyEventId?.startsWith('evt-')
                  const isOpen = nextEvent.status === 'open'
                  return (
                    <span
                      className={isOpen ? 'pill pill-open' : 'pill pill-soon'}
                      style={{ marginLeft: 8 }}
                    >
                      {hasFury
                        ? (isOpen ? '⚡ Reg Open' : '⚡ Fury Linked')
                        : (isOpen ? 'Reg Open' : 'Reg Not Open Yet')}
                    </span>
                  )
                })()}
              </div>
            </div>

            <LiveEventKpis event={nextEvent} variant="hero" />

            <div className={styles.neActions}>
              <button
                className={`${styles.adminBtn} ${styles.primary}`}
                onClick={() => navigate(`/admin/events/${nextEvent.typeSlug}/${nextEvent.id}`)}
              >
                Manage Event ▸
              </button>
              <button className={styles.adminBtn} onClick={() => setEditing(nextEvent)}>
                Edit
              </button>
              <button className={styles.adminBtn} onClick={syncAll} disabled={syncing}>
                {syncing ? '⟲ Syncing…' : '⟲ Sync'}
              </button>
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
                <LiveEventKpis event={evt} variant="row" />
                {(() => {
                  const hasFury = evt.furyEventId?.startsWith('evt-')
                  const isOpen = evt.status === 'open'
                  return (
                    <span className={isOpen ? 'pill pill-open' : 'pill pill-soon'}>
                      {hasFury
                        ? (isOpen ? '⚡ Reg Open' : '⚡ Fury Linked')
                        : (isOpen ? 'Open' : 'Upcoming')}
                    </span>
                  )
                })()}
                <button
                  className={styles.adminBtn}
                  onClick={e => { e.stopPropagation(); setEditing(evt) }}
                >
                  Edit
                </button>
              </div>
            )
          })}
          {openEvents.length === 0 && (
            <div className={styles.queueEmpty}>No upcoming events</div>
          )}
        </div>
      </div>

      {/* LFT alert */}
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
            {allEvents.filter(e => (e.lookingForTeamCount ?? 0) > 0).map(evt => {
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

      {editing && <EditEventModal event={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

// ── Live per-event KPI block ──────────────────────────────────────────────────

function LiveEventKpis({ event, variant }: { event: EventInstance; variant: 'hero' | 'row' }) {
  const furyId = event.furyEventId?.startsWith('evt-') ? event.furyEventId : undefined
  const { data: stats } = useFuryEventStats(furyId)

  const reg     = stats?.registrationCount ?? event.registrationCount
  const approved = stats?.approvedCount    ?? event.approvedCount
  const revenue  = stats?.revenue          ?? (event.revenue ?? 0)
  const pending  = stats?.pendingBalance   ?? (event.pendingBalance ?? 0)
  const lft      = event.lookingForTeamCount ?? 0
  const notFull  = event.teamsNotFullCount   ?? 0

  if (variant === 'hero') {
    return (
      <div className={styles.neKpis}>
        <div className={styles.neKpi}>
          <div className={styles.neKpiN}>{reg}</div>
          <div className={styles.neKpiL}>Registered</div>
          <div className={styles.neKpiSub}>{approved} approved</div>
        </div>
        <div className={styles.neKpi}>
          <div className={styles.neKpiN}>{formatCurrency(revenue)}</div>
          <div className={styles.neKpiL}>Revenue</div>
        </div>
        {pending > 0 && (
          <div className={styles.neKpi}>
            <div className={`${styles.neKpiN} ${styles.neKpiYellow}`}>{formatCurrency(pending)}</div>
            <div className={styles.neKpiL}>Pending $</div>
          </div>
        )}
        {lft > 0 && (
          <div className={styles.neKpi}>
            <div className={`${styles.neKpiN} ${styles.neKpiWarn}`}>{lft}</div>
            <div className={styles.neKpiL}>LFT</div>
            <div className={`${styles.neKpiSub} ${styles.neKpiSubWarn}`}>need teaming</div>
          </div>
        )}
        {notFull > 0 && (
          <div className={styles.neKpi}>
            <div className={`${styles.neKpiN} ${styles.neKpiWarn}`}>{notFull}</div>
            <div className={styles.neKpiL}>Not Full</div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={styles.urKpis}>
      <div className={styles.urKpi}>
        <div className={styles.urKpiN}>{reg}</div>
        <div className={styles.urKpiL}>Reg'd</div>
      </div>
      <div className={styles.urKpi}>
        <div className={styles.urKpiN}>{formatCurrency(revenue)}</div>
        <div className={styles.urKpiL}>Revenue</div>
      </div>
      {pending > 0 && (
        <div className={styles.urKpi}>
          <div className={`${styles.urKpiN} ${styles.urKpiYellow}`}>{formatCurrency(pending)}</div>
          <div className={styles.urKpiL}>Pending $</div>
        </div>
      )}
      {lft > 0 && (
        <div className={styles.urKpi}>
          <div className={`${styles.urKpiN} ${styles.urKpiWarn}`}>{lft}</div>
          <div className={styles.urKpiL}>LFT</div>
        </div>
      )}
    </div>
  )
}
