import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { EVENT_TYPES, EVENT_INSTANCES, EVENT_TYPE_SETTINGS } from '../../data/mockData'
import StatusPill from '../../components/StatusPill'
import AdminCrazy8Cards from './AdminCrazy8Cards'
import styles from './AdminEventType.module.css'

type SubTab = 'Overview' | 'Instances' | 'Divisions' | 'Cards'


export default function AdminEventType() {
  const { typeSlug } = useParams<{ typeSlug: string }>()
  const [tab, setTab] = useState<SubTab>('Overview')

  const eventType = EVENT_TYPES.find(t => t.slug === typeSlug)
  const instances = EVENT_INSTANCES.filter(e => e.typeSlug === typeSlug)
  const typeSettings = EVENT_TYPE_SETTINGS.find(s => s.typeSlug === typeSlug)
  const hasDivisions = typeSettings?.hasDivisions ?? false

  const SUBTABS: SubTab[] = [
    'Overview', 'Instances',
    ...(hasDivisions ? ['Divisions' as SubTab] : []),
    ...(typeSlug === 'crazy8s' ? ['Cards' as SubTab] : []),
  ]

  if (!eventType) {
    return <div style={{ padding: 48, color: 'var(--adm-mute)' }}>Event type not found.</div>
  }

  const totalRevenue = instances.reduce((s, e) => s + (e.revenue ?? 0), 0)
  const totalRegs = instances.reduce((s, e) => s + e.registrationCount, 0)

  function formatDate(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <>
      {/* Event type header */}
      <div className={styles.header}>
        {eventType.logo && <img src={eventType.logo} alt={eventType.name} className={styles.headerLogo} />}
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>{eventType.name}</h1>
          <p className={styles.headerDesc}>{eventType.description}</p>
          <div className={styles.headerBadges}>
            <span className={styles.badgeSize}>4-way</span>
            <span className={styles.badgeRounds}>8 rounds</span>
            <span className={styles.badgeDivs}>AAA · AA · A · Rookie</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className={styles.adminBtn}>+ New Instance</button>
          <button className={`${styles.adminBtn} ${styles.primary}`}>Email All Registrants</button>
        </div>
      </div>

      {/* Subtabs */}
      <div className={styles.subtabs}>
        {SUBTABS.map(t => (
          <button
            key={t}
            className={`${styles.subtab} ${tab === t ? styles.subtabOn : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* KPI strip (always visible) */}
      <div className={styles.kpiStrip}>
        {[
          { num: instances.length, lbl: 'Instances' },
          { num: totalRegs, lbl: 'Total Reg\'d' },
          { num: `$${totalRevenue.toLocaleString()}`, lbl: 'Revenue' },
          { num: instances.filter(e => e.status === 'complete').length, lbl: 'Completed' },
          { num: instances.filter(e => e.status === 'open').length, lbl: 'Open Now' },
        ].map(k => (
          <div key={k.lbl} className={styles.kpi}>
            <div className={styles.kpiNum}>{k.num}</div>
            <div className={styles.kpiLbl}>{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Overview' && (
        <div>
          <div className={styles.sectionHd}>
            <span className={styles.sectionLabel}>2026 Instances</span>
          </div>
          <div className={styles.instanceList}>
            {instances.map(evt => (
              <div key={evt.id} className={styles.instanceRow}>
                <div className={styles.instanceMeta}>
                  <h4>{evt.name}</h4>
                  <div className={styles.instanceSub}>
                    {formatDate(evt.date)} · {evt.dropzone} · <StatusPill status={evt.status} />
                  </div>
                </div>
                <div className={styles.colStack}>
                  <div className={styles.colNum}>{evt.registrationCount}</div>
                  <div className={styles.colLbl}>Reg'd</div>
                </div>
                <div className={styles.colStack}>
                  <div className={styles.colNum}>{evt.approvedCount}</div>
                  <div className={styles.colLbl}>Paid</div>
                </div>
                <div className={styles.colStack}>
                  <div className={styles.colNum}>${(evt.revenue ?? 0).toLocaleString()}</div>
                  <div className={styles.colLbl}>Revenue</div>
                </div>
                <Link
                  to={`/admin/events/${typeSlug}/${evt.id}`}
                  className={`${styles.adminBtn} ${styles.primary}`}
                >
                  Manage ▸
                </Link>
              </div>
            ))}
            {instances.length === 0 && (
              <div className={styles.empty}>No instances yet. Click "New Instance" to add one.</div>
            )}
          </div>
        </div>
      )}

      {tab === 'Instances' && (
        <div className={styles.instanceList}>
          {instances.map(evt => (
            <div key={evt.id} className={styles.instanceRow}>
              <div className={styles.instanceMeta}>
                <h4>{evt.name}</h4>
                <div className={styles.instanceSub}>
                  {formatDate(evt.date)} · {evt.dropzone}
                </div>
              </div>
              <StatusPill status={evt.status} />
              <Link to={`/admin/events/${typeSlug}/${evt.id}`} className={`${styles.adminBtn} ${styles.primary}`}>Open ▸</Link>
            </div>
          ))}
        </div>
      )}

      {tab === 'Divisions' && (
        <div className="card" style={{ padding: 24 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Division', 'Team Size', 'Entry', 'Min Teams', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--adm-mute)', fontFamily: 'Bungee', fontSize: 11, borderBottom: '1px solid var(--adm-border)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { div: 'AAA', size: 4, entry: '$120', min: 3, status: 'Active' },
                { div: 'AA', size: 4, entry: '$120', min: 3, status: 'Active' },
                { div: 'A', size: 4, entry: '$100', min: 2, status: 'Active' },
                { div: 'Rookie', size: 4, entry: '$80', min: 2, status: 'Active' },
              ].map(row => (
                <tr key={row.div} style={{ borderBottom: '1px solid rgba(255,255,255,.04)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'Bungee', color: 'var(--sq-red)' }}>{row.div}</td>
                  <td style={{ padding: '10px 12px' }}>{row.size}-way</td>
                  <td style={{ padding: '10px 12px' }}>{row.entry}</td>
                  <td style={{ padding: '10px 12px' }}>{row.min}</td>
                  <td style={{ padding: '10px 12px' }}><span className="pill pill-open">{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'Cards' && typeSlug === 'crazy8s' && (
        <AdminCrazy8Cards />
      )}
    </>
  )
}
