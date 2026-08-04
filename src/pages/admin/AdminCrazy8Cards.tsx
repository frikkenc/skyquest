import { useState } from 'react'
import AdminCrazy8Generate from './AdminCrazy8Generate'
import AdminCrazy8Market from './AdminCrazy8Market'
import AdminCrazy8Menu from './AdminCrazy8Menu'
import AdminCrazy8Formations from './AdminCrazy8Formations'
import styles from './AdminCrazy8Cards.module.css'

type InnerTab = 'Formations' | 'Generate' | 'Market' | 'Menu'
const INNER_TABS: InnerTab[] = ['Formations', 'Generate', 'Market', 'Menu']

export default function AdminCrazy8Cards() {
  const [tab, setTab] = useState<InnerTab>('Formations')

  return (
    <div>
      <div className={styles.innerTabs}>
        {INNER_TABS.map(t => (
          <button
            key={t}
            className={`${styles.innerTab} ${tab === t ? styles.innerTabOn : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Formations' && <AdminCrazy8Formations />}
      {tab === 'Generate'   && <AdminCrazy8Generate />}
      {tab === 'Market'     && <AdminCrazy8Market />}
      {tab === 'Menu'       && <AdminCrazy8Menu />}
    </div>
  )
}
