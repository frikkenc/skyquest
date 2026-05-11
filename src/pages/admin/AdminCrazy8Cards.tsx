import { useState } from 'react'
import AdminCrazy8Generate from './AdminCrazy8Generate'
import AdminCrazy8Market from './AdminCrazy8Market'
import AdminCrazy8Menu from './AdminCrazy8Menu'
import styles from './AdminCrazy8Cards.module.css'

type InnerTab = 'Generate' | 'Market' | 'Menu'
const INNER_TABS: InnerTab[] = ['Generate', 'Market', 'Menu']

export default function AdminCrazy8Cards() {
  const [tab, setTab] = useState<InnerTab>('Generate')

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

      {tab === 'Generate' && <AdminCrazy8Generate />}
      {tab === 'Market'   && <AdminCrazy8Market />}
      {tab === 'Menu'     && <AdminCrazy8Menu />}
    </div>
  )
}
