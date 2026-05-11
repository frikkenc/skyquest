import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { useCrazy8Master, seed2026 } from '../../hooks/useCrazy8'
import type { Crazy8YearDoc, MarketEntry } from '../../types/crazy8'
import styles from './AdminCrazy8Cards.module.css'

const CURRENT_YEAR = new Date().getFullYear()
const DEFAULT_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR]

export default function AdminCrazy8Market() {
  const { master } = useCrazy8Master()
  const [years] = useState<number[]>(DEFAULT_YEARS)
  const [data, setData] = useState<Record<number, { [slug: string]: MarketEntry }>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [seedBusy, setSeedBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err', text: string } | null>(null)

  async function loadAll() {
    setLoading(true)
    const next: Record<number, { [slug: string]: MarketEntry }> = {}
    for (const y of years) {
      try {
        const snap = await getDoc(doc(db, 'crazy8config', `year_${y}`))
        next[y] = snap.exists() ? ((snap.data() as Crazy8YearDoc).market ?? {}) : {}
      } catch {
        next[y] = {}
      }
    }
    setData(next)
    setLoading(false)
  }

  useEffect(() => { loadAll() }, [years])

  function updateCell(year: number, slug: string, field: keyof MarketEntry, value: number) {
    setData(prev => {
      const yearMap = { ...(prev[year] ?? {}) }
      const cur = yearMap[slug] ?? { earned: 0, promo: 0 }
      yearMap[slug] = { ...cur, [field]: value }
      return { ...prev, [year]: yearMap }
    })
  }

  async function saveAll() {
    if (!auth.currentUser) {
      setMessage({ type: 'err', text: 'Not signed in — log in at /admin/login first.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      for (const y of years) {
        const snap = await getDoc(doc(db, 'crazy8config', `year_${y}`)).catch(() => null)
        const existing = snap?.exists() ? (snap.data() as Crazy8YearDoc) : null
        await setDoc(doc(db, 'crazy8config', `year_${y}`), {
          year: y,
          menu: existing?.menu ?? { year: y, rounds: [] },
          market: data[y] ?? {},
        }, { merge: false })
      }
      setMessage({ type: 'ok', text: 'Saved.' })
    } catch (err: any) {
      setMessage({ type: 'err', text: `Save failed: ${err?.message ?? err}` })
    } finally {
      setSaving(false)
    }
  }

  async function handleSeed() {
    if (!auth.currentUser) {
      setMessage({ type: 'err', text: 'Not signed in — log in at /admin/login first.' })
      return
    }
    setSeedBusy(true)
    setMessage(null)
    try {
      await seed2026()
      await loadAll()
      setMessage({ type: 'ok', text: 'Loaded starter from Sheet (2024 + 2025 + 2026 menu).' })
    } catch (err: any) {
      setMessage({ type: 'err', text: `Load failed: ${err?.message ?? err}` })
    } finally {
      setSeedBusy(false)
    }
  }

  const cumulative = useMemo(() => {
    const totals: { [slug: string]: number } = {}
    for (const slug of master.formations.map(f => f.slug)) {
      let sum = 0
      for (const y of years) {
        const e = data[y]?.[slug]
        if (e) sum += (e.earned || 0) + (e.promo || 0)
      }
      totals[slug] = sum
    }
    return totals
  }, [data, years, master.formations])

  if (loading) return <div style={{ color: 'var(--adm-mute)', padding: 12 }}>Loading market…</div>

  return (
    <div>
      <div className={styles.toolbar}>
        <strong style={{ fontFamily: 'Bungee', fontStyle: 'italic', fontSize: 18, color: 'var(--adm-ink)' }}>
          Formation Market
        </strong>
        <span style={{ color: 'var(--adm-mute)', fontSize: 12 }}>
          Earned vs. promo per year. Total = what's in circulation.
        </span>
        <span className={`${styles.savePill} ${saving ? styles.savingPill : ''}`}>
          {saving ? 'Saving…' : 'Saved'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className={styles.btn} onClick={handleSeed} disabled={seedBusy}>
            {seedBusy ? 'Loading…' : 'Load starter from Sheet'}
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={saveAll} disabled={saving}>
            Save all
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          background: message.type === 'ok' ? 'rgba(0,120,48,0.15)' : 'rgba(216,24,24,0.15)',
          border: `1px solid ${message.type === 'ok' ? 'rgba(0,120,48,0.5)' : 'rgba(216,24,24,0.5)'}`,
          color: message.type === 'ok' ? '#7BC97A' : '#FF7676',
          padding: '8px 12px',
          borderRadius: 6,
          fontSize: 12,
          marginBottom: 12,
        }}>
          {message.text}
        </div>
      )}

      <table className={styles.marketTable}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ textAlign: 'left' }}>Formation</th>
            <th rowSpan={2}>Total<br/>in system</th>
            {years.map(y => (
              <th key={y} colSpan={2} className={styles.yearGroupHd}>{y}</th>
            ))}
          </tr>
          <tr>
            {years.flatMap(y => [
              <th key={`${y}-e`}>Earned</th>,
              <th key={`${y}-p`}>Promo</th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {master.formations.map(f => {
            const total = cumulative[f.slug] ?? 0
            return (
              <tr key={f.slug}>
                <td style={{ textAlign: 'left', fontWeight: 600, color: 'var(--adm-ink)' }}>{f.name}</td>
                <td className={styles.totalCell as any}>{total.toFixed(1).replace(/\.0$/, '')}</td>
                {years.flatMap(y => {
                  const entry = data[y]?.[f.slug] ?? { earned: 0, promo: 0 }
                  return [
                    <td key={`${y}-e`}>
                      <input
                        type="number"
                        step="0.5"
                        value={entry.earned || ''}
                        onChange={e => updateCell(y, f.slug, 'earned', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </td>,
                    <td key={`${y}-p`}>
                      <input
                        type="number"
                        step="0.5"
                        value={entry.promo || ''}
                        onChange={e => updateCell(y, f.slug, 'promo', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </td>,
                  ]
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
