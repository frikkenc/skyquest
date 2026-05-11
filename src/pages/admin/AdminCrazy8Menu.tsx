import { useEffect, useMemo, useState } from 'react'
import { auth } from '../../firebase'
import { useCrazy8Master, useCrazy8Year, useCrazy8MarketTotals } from '../../hooks/useCrazy8'
import type { MenuCombo, MenuRound } from '../../types/crazy8'
import styles from './AdminCrazy8Cards.module.css'

const CURRENT_YEAR = new Date().getFullYear()

export default function AdminCrazy8Menu() {
  const { master } = useCrazy8Master()
  const totalYears = useMemo(() => [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR], [])
  const { totals } = useCrazy8MarketTotals(totalYears)
  const [year, setYear] = useState<number>(CURRENT_YEAR)
  const { yearDoc, loading, saving, saveMenu } = useCrazy8Year(year)
  const [draft, setDraft] = useState<MenuRound[]>([])
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err', text: string } | null>(null)

  useEffect(() => {
    setDraft(yearDoc.menu.rounds.length ? yearDoc.menu.rounds : seedRounds())
    setDirty(false)
  }, [yearDoc])

  const formationsBySlug = useMemo(() => {
    const m: Record<string, string> = {}
    master.formations.forEach(f => { m[f.slug] = f.name })
    return m
  }, [master])

  function update(next: MenuRound[]) {
    setDraft(next)
    setDirty(true)
  }

  function addFormation(roundIdx: number, comboIdx: number, slug: string) {
    if (!slug) return
    const combo = draft[roundIdx].combos[comboIdx]
    if (combo.formations.length >= 3) return  // 2 or 3 per combo max
    update(draft.map((r, ri) =>
      ri !== roundIdx ? r : {
        ...r,
        combos: r.combos.map((c, ci) =>
          ci !== comboIdx ? c : { ...c, formations: [...c.formations, slug] }
        ),
      }
    ))
  }

  function removeFormation(roundIdx: number, comboIdx: number, formationIdx: number) {
    update(draft.map((r, ri) =>
      ri !== roundIdx ? r : {
        ...r,
        combos: r.combos.map((c, ci) =>
          ci !== comboIdx ? c : { ...c, formations: c.formations.filter((_, i) => i !== formationIdx) }
        ),
      }
    ))
  }

  function updateValue(roundIdx: number, comboIdx: number, value: number) {
    update(draft.map((r, ri) =>
      ri !== roundIdx ? r : {
        ...r,
        combos: r.combos.map((c, ci) => ci !== comboIdx ? c : { ...c, value }),
      }
    ))
  }

  function addCombo(roundIdx: number) {
    const round = draft[roundIdx]
    const newCombo: MenuCombo = {
      id: `r${round.round}-${Date.now().toString(36)}`,
      formations: [],
      value: 0,
    }
    update(draft.map((r, ri) =>
      ri !== roundIdx ? r : { ...r, combos: [...r.combos, newCombo] }
    ))
  }

  function removeCombo(roundIdx: number, comboIdx: number) {
    update(draft.map((r, ri) =>
      ri !== roundIdx ? r : { ...r, combos: r.combos.filter((_, i) => i !== comboIdx) }
    ))
  }

  async function handleSave() {
    if (!auth.currentUser) {
      setMessage({ type: 'err', text: 'Not signed in — log in at /admin/login first.' })
      return
    }
    try {
      await saveMenu(draft)
      setDirty(false)
      setMessage({ type: 'ok', text: 'Menu saved.' })
    } catch (err: any) {
      setMessage({ type: 'err', text: `Save failed: ${err?.message ?? err}` })
    }
  }

  if (loading) return <div style={{ color: 'var(--adm-mute)', padding: 12 }}>Loading menu…</div>

  const yearOptions = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

  return (
    <div>
      <div className={styles.toolbar}>
        <strong style={{ fontFamily: 'Bungee', fontStyle: 'italic', fontSize: 18, color: 'var(--adm-ink)' }}>
          Annual Menu
        </strong>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ color: 'var(--adm-mute)', fontSize: 12 }}>
          4 rounds, any number of combos per round. Each combo can have 2 or 3 formations.
        </span>
        <span className={`${styles.savePill} ${saving ? styles.savingPill : ''}`}>
          {saving ? 'Saving…' : dirty ? 'Unsaved' : 'Saved'}
        </span>
        <div style={{ marginLeft: 'auto' }}>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={!dirty || saving}>
            Save menu
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
        }}>{message.text}</div>
      )}

      {draft.map((round, ri) => (
        <div key={round.round} className={styles.menuRound}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 className={styles.roundTitle} style={{ margin: 0 }}>Round {round.round}</h3>
            <button className={styles.btn} onClick={() => addCombo(ri)} style={{ fontSize: 11 }}>
              + Add combo
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {round.combos.map((combo, ci) => (
              <div key={combo.id} className={styles.combo}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0 }}>Combo {String.fromCharCode(65 + ci)}</h4>
                  <button
                    onClick={() => removeCombo(ri, ci)}
                    title="Remove combo"
                    style={{ background: 'transparent', border: 'none', color: 'var(--adm-mute)', cursor: 'pointer', fontSize: 16 }}
                  >×</button>
                </div>
                <div className={styles.formationChips}>
                  {combo.formations.length === 0
                    ? <span style={{ color: 'var(--adm-mute)', fontSize: 11, fontStyle: 'italic' }}>Add 2 or 3 formations</span>
                    : combo.formations.map((slug, fi) => (
                      <span key={`${slug}-${fi}`} className={styles.formationChip}>
                        {formationsBySlug[slug] ?? slug}
                        <span style={{ opacity: 0.85, fontWeight: 400, marginLeft: 2, fontSize: 11 }}>
                          ({formatTotal(totals[slug] ?? 0)})
                        </span>
                        <button onClick={() => removeFormation(ri, ci, fi)} title="Remove">×</button>
                      </span>
                    ))
                  }
                </div>
                <div className={styles.comboBottom}>
                  <select
                    value=""
                    onChange={e => { addFormation(ri, ci, e.target.value); e.target.value = '' }}
                    disabled={combo.formations.length >= 3}
                  >
                    <option value="">
                      {combo.formations.length >= 3 ? 'Max 3 formations' : '+ Add formation…'}
                    </option>
                    {master.formations.filter(f => !f.retired).map(f => (
                      <option key={f.slug} value={f.slug}>{f.name} ({formatTotal(totals[f.slug] ?? 0)})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    className={styles.valueInput}
                    value={combo.value}
                    onChange={e => updateValue(ri, ci, parseInt(e.target.value) || 0)}
                    title="Dive value"
                  />
                </div>
                {combo.formations.length > 0 && combo.formations.length < 2 && (
                  <div style={{ color: 'var(--sq-red)', fontSize: 10, marginTop: 6 }}>
                    Need 2 or 3 formations per combo
                  </div>
                )}
              </div>
            ))}
            {round.combos.length === 0 && (
              <div style={{ color: 'var(--adm-mute)', fontSize: 12, fontStyle: 'italic', padding: 12 }}>
                No combos yet. Click "+ Add combo" above.
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatTotal(n: number): string {
  // Trim trailing .0 for cleanly integer totals
  const s = n.toFixed(1)
  return s.endsWith('.0') ? s.slice(0, -2) : s
}

function seedRounds(): MenuRound[] {
  return [1, 2, 3, 4].map(round => ({
    round,
    combos: [
      { id: `r${round}-a`, formations: [], value: 0 },
      { id: `r${round}-b`, formations: [], value: 0 },
    ],
  }))
}
