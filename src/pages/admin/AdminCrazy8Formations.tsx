import { useEffect, useMemo, useState } from 'react'
import { auth } from '../../firebase'
import { useCrazy8Master, useCrazy8Year } from '../../hooks/useCrazy8'
import {
  loadFormationSvg, renderFormationPickSheet, openMultiPageSvgPrintWindow,
} from '../../utils/crazy8Cards'
import type { FormationDef } from '../../types/crazy8'
import styles from './AdminCrazy8Cards.module.css'

const CURRENT_YEAR = new Date().getFullYear()

export default function AdminCrazy8Formations() {
  const { master, upsertFormation, removeFormation, setRetired } = useCrazy8Master()
  const [year, setYear] = useState<number>(CURRENT_YEAR)
  const { yearDoc, loading, saving, saveActiveFormations } = useCrazy8Year(year)

  const [active, setActive] = useState<Set<string>>(new Set())
  const [dirty, setDirty] = useState(false)
  const [printBusy, setPrintBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err', text: string } | null>(null)

  // Add-formation modal
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [newSvg, setNewSvg] = useState('')
  const [addBusy, setAddBusy] = useState(false)

  // Seed the active set from this year's saved selection, or default to all
  // non-retired formations when nothing has been chosen yet. Stops overriding
  // once the admin starts editing (dirty), so unsaved toggles survive a re-render.
  useEffect(() => {
    if (dirty) return
    const base = yearDoc.activeFormations
      ?? master.formations.filter(f => !f.retired).map(f => f.slug)
    setActive(new Set(base))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearDoc, master.formations])

  const hasSavedSelection = Array.isArray(yearDoc.activeFormations)

  const activeCount = useMemo(
    () => master.formations.filter(f => active.has(f.slug) && !f.retired).length,
    [master.formations, active],
  )

  function toggle(slug: string) {
    setActive(prev => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug); else next.add(slug)
      return next
    })
    setDirty(true)
  }

  function selectAll() {
    setActive(new Set(master.formations.filter(f => !f.retired).map(f => f.slug)))
    setDirty(true)
  }
  function selectNone() {
    setActive(new Set())
    setDirty(true)
  }

  async function handleSave() {
    if (!auth.currentUser) {
      setMessage({ type: 'err', text: 'Not signed in — log in at /admin/login first.' })
      return
    }
    try {
      // Persist only real, non-retired slugs, in master order.
      const slugs = master.formations.filter(f => active.has(f.slug) && !f.retired).map(f => f.slug)
      await saveActiveFormations(slugs)
      setDirty(false)
      setMessage({ type: 'ok', text: `Saved ${slugs.length} valid formations for ${year}.` })
    } catch (err: any) {
      setMessage({ type: 'err', text: `Save failed: ${err?.message ?? err}` })
    }
  }

  async function commitName(f: FormationDef, raw: string) {
    const name = raw.trim().toUpperCase()
    if (!name || name === f.name) return
    try {
      await upsertFormation({ ...f, name })
    } catch (err: any) {
      setMessage({ type: 'err', text: `Rename failed: ${err?.message ?? err}` })
    }
  }

  async function handleRetire(f: FormationDef) {
    try {
      await setRetired(f.slug, !f.retired)
      if (!f.retired) {
        // just retired → drop from the active draft too
        setActive(prev => { const n = new Set(prev); n.delete(f.slug); return n })
      }
    } catch (err: any) {
      setMessage({ type: 'err', text: `Update failed: ${err?.message ?? err}` })
    }
  }

  async function handleDelete(f: FormationDef) {
    if (!window.confirm(`Delete "${f.name}" from the master list? This affects every year. To pull it from just this year, uncheck it instead.`)) return
    try {
      await removeFormation(f.slug)
      setActive(prev => { const n = new Set(prev); n.delete(f.slug); return n })
    } catch (err: any) {
      setMessage({ type: 'err', text: `Delete failed: ${err?.message ?? err}` })
    }
  }

  async function handleAddSave() {
    if (!newName.trim()) return
    const slug = (newSlug || slugify(newName)).trim()
    if (!slug) return
    setAddBusy(true)
    try {
      await upsertFormation({ slug, name: newName.trim().toUpperCase(), svgContent: newSvg || undefined })
      setActive(prev => new Set(prev).add(slug))
      setDirty(true)
      setShowAdd(false); setNewName(''); setNewSlug(''); setNewSvg('')
    } catch (err: any) {
      setMessage({ type: 'err', text: `Add failed: ${err?.message ?? err}` })
    } finally {
      setAddBusy(false)
    }
  }

  function handleNewSvgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setNewSvg(String(reader.result))
    reader.readAsText(file)
  }

  async function handlePrintPickSheet() {
    const chosen = master.formations.filter(f => active.has(f.slug) && !f.retired)
    if (chosen.length === 0) {
      setMessage({ type: 'err', text: 'Select at least one formation to print.' })
      return
    }
    setPrintBusy(true)
    try {
      const items = await Promise.all(
        chosen.map(async f => ({ name: f.name, svg: await loadFormationSvg(f.slug, f.svgContent) })),
      )
      const pages = renderFormationPickSheet(items, { title: `Frikken Crazy 8s ${year} — Formations` })
      openMultiPageSvgPrintWindow(pages, `Crazy 8 Formations ${year}`)
    } catch (err: any) {
      setMessage({ type: 'err', text: `Print failed: ${err?.message ?? err}` })
    } finally {
      setPrintBusy(false)
    }
  }

  if (loading) return <div style={{ color: 'var(--adm-mute)', padding: 12 }}>Loading formations…</div>

  const yearOptions = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

  return (
    <div>
      <div className={styles.toolbar}>
        <strong style={{ fontFamily: 'Bungee', fontStyle: 'italic', fontSize: 18, color: 'var(--adm-ink)' }}>
          Valid Formations
        </strong>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))}>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ color: 'var(--adm-mute)', fontSize: 12 }}>
          {activeCount} in play {hasSavedSelection ? '' : '(defaulting to all — not yet saved)'}
        </span>
        <span className={`${styles.savePill} ${saving ? styles.savingPill : ''}`}>
          {saving ? 'Saving…' : dirty ? 'Unsaved' : 'Saved'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className={styles.btn} onClick={handlePrintPickSheet} disabled={printBusy}>
            {printBusy ? 'Building…' : '🖨 Print pick sheet'}
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSave} disabled={!dirty || saving}>
            Save selection
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          background: message.type === 'ok' ? 'rgba(0,120,48,0.15)' : 'rgba(216,24,24,0.15)',
          border: `1px solid ${message.type === 'ok' ? 'rgba(0,120,48,0.5)' : 'rgba(216,24,24,0.5)'}`,
          color: message.type === 'ok' ? '#7BC97A' : '#FF7676',
          padding: '8px 12px', borderRadius: 6, fontSize: 12, marginBottom: 12,
        }}>{message.text}</div>
      )}

      <div className={styles.btnRow} style={{ marginTop: 0, marginBottom: 12 }}>
        <button className={styles.btn} onClick={selectAll}>Select all</button>
        <button className={styles.btn} onClick={selectNone}>Select none</button>
        <button className={styles.btn} onClick={() => setShowAdd(s => !s)} style={{ marginLeft: 'auto' }}>
          + New formation
        </button>
      </div>

      {showAdd && (
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12, marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={miniLabel}>Name</label>
            <input
              type="text" placeholder="e.g. PINWHEEL" value={newName}
              onChange={e => { setNewName(e.target.value); if (!newSlug) setNewSlug(slugify(e.target.value)) }}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={miniLabel}>Slug</label>
            <input type="text" placeholder="auto from name" value={newSlug} onChange={e => setNewSlug(slugify(e.target.value))} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={miniLabel}>SVG art (optional)</label>
            <input type="file" accept=".svg,image/svg+xml" onChange={handleNewSvgUpload} style={{ fontSize: 11 }} />
          </div>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleAddSave} disabled={!newName.trim() || addBusy}>
            {addBusy ? 'Saving…' : 'Add'}
          </button>
          <button className={styles.btn} onClick={() => { setShowAdd(false); setNewName(''); setNewSlug(''); setNewSvg('') }}>
            Cancel
          </button>
        </div>
      )}

      <div className={styles.fmGrid}>
        {master.formations.map(f => {
          const on = active.has(f.slug) && !f.retired
          const src = f.svgContent
            ? `data:image/svg+xml;utf8,${encodeURIComponent(f.svgContent)}`
            : `/crazy8/formations/${f.slug}.svg`
          return (
            <div key={f.slug} className={`${styles.fmRow} ${on ? '' : styles.fmOff} ${f.retired ? styles.fmRetired : ''}`}>
              <input
                type="checkbox" className={styles.fmCheck}
                checked={on} disabled={f.retired}
                onChange={() => toggle(f.slug)}
                title={f.retired ? 'Retired — un-retire to use' : 'Valid this year'}
              />
              <img src={src} alt="" className={styles.fmMini} onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden' }} />
              <input
                key={`${f.slug}:${f.name}`} className={styles.fmName}
                defaultValue={f.name} onBlur={e => commitName(f, e.target.value)}
                title="Rename (affects all years)"
              />
              <button className={styles.fmIconBtn} onClick={() => handleRetire(f)} title={f.retired ? 'Un-retire' : 'Retire (hide from menus everywhere)'}>
                {f.retired ? '↩' : '⦸'}
              </button>
              <button className={styles.fmIconBtn} onClick={() => handleDelete(f)} title="Delete from master list">✕</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const miniLabel: React.CSSProperties = {
  fontSize: 10, color: 'var(--adm-mute)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700,
}
const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid var(--adm-border, rgba(255,255,255,0.12))',
  borderRadius: 4, padding: '6px 8px', color: 'var(--adm-ink)', fontSize: 12, fontFamily: 'inherit',
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
