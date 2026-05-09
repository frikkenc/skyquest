import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = {
  Overview: [
    { label: '📊 Dashboard', to: '/admin', end: true },
    { label: '📅 Seasons', to: '/admin/seasons' },
    { label: '🏆 Leaderboard', to: '/admin/leaderboard' },
  ],
  'Event Setup': [
    { label: '📧 Email Templates', to: '/admin/emails' },
    { label: '📤 Send Queue', to: '/admin/send-queue' },
  ],
  'Event Types · 2026': [
    { label: '🔵 SCSL', to: '/admin/events/scsl', badge: 2, badgeColor: 'blue' },
    { label: '♠ Poker Run', to: '/admin/events/poker-run', badge: 4, badgeColor: 'yellow' },
    { label: '⚔ Dueling DZs', to: '/admin/events/dueling-dzs' },
    { label: '🎲 Frikken Crazy 8\'s', to: '/admin/events/crazy8s' },
    { label: '👻 Ghost Nationals', to: '/admin/events/ghost-nationals' },
  ],
  'Specials': [
    { label: '🏅 Awards Show ↗', to: '/admin/awards' },
    { label: '📐 Dive Builder ↗', to: 'https://dive.fury.coach', external: true },
  ],
  People: [
    { label: '👥 Jumpers', to: '/admin/jumpers' },
    { label: '📥 Results Import', to: '/admin/results-import' },
  ],
  Config: [
    { label: '🔑 Fury Identity', to: '/admin/config/identity' },
  ],
}

interface SideItem {
  label: string
  to: string
  end?: boolean
  badge?: number
  badgeColor?: string
  external?: boolean
}

export default function AdminLayout() {
  const [approvalBadge] = useState(4)
  const [refundBadge] = useState(2)
  const [unmatchedBadge] = useState(2)

  return (
    <div className={styles.shell}>
      {/* Top bar */}
      <header className={styles.topbar}>
        <div className={styles.tbBrand}>
          <span className={styles.tbLogo}>Sky<span>Quest</span></span>
          <span className={styles.tbAdminBadge}>Admin</span>
        </div>
        <div className={styles.tbCenter}>
          <select className={styles.tbSeason}>
            <option>SoCal SkyQuest 2026 (active)</option>
            <option>SoCal SkyQuest 2025 (archived)</option>
          </select>
          <div className={styles.tbSearch}>
            <input type="text" placeholder="Find jumper or team…" />
            <button>Search</button>
          </div>
        </div>
        <div className={styles.tbRight}>
          <div className={styles.badgeCluster}>
            <div className={styles.tbBadge} title="Pending approvals">
              🕐<span className={styles.badgeDot}>{approvalBadge}</span>
            </div>
            <div className={styles.tbBadge} title="Pending refunds">
              💸<span className={styles.badgeDot}>{refundBadge}</span>
            </div>
            <div className={styles.tbBadge} title="Unmatched jumpers">
              ⚠<span className={`${styles.badgeDot} ${styles.badgeDotYellow}`}>{unmatchedBadge}</span>
            </div>
          </div>
          <div className={styles.tbUser}>
            <div className={styles.tbAvatar}>CF</div>
            <div className={styles.tbUsername}>Christy F.</div>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {Object.entries(NAV_ITEMS).map(([section, items]) => (
            <div key={section}>
              <div className={styles.sbSection}>{section}</div>
              {(items as SideItem[]).map(item =>
                item.external ? (
                  <a key={item.to} href={item.to} target="_blank" rel="noreferrer" className={styles.sbItem}>
                    {item.label}
                  </a>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `${styles.sbItem} ${isActive ? styles.sbItemOn : ''}`}
                  >
                    {item.label}
                    {item.badge != null && (
                      <span className={`${styles.sbBadge} ${
                        item.badgeColor === 'yellow' ? styles.sbBadgeYellow :
                        item.badgeColor === 'blue' ? styles.sbBadgeBlue : ''
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                )
              )}
            </div>
          ))}
        </aside>

        {/* Page content */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
