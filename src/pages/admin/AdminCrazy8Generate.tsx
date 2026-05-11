import { useEffect, useMemo, useState } from 'react'
import {
  renderCardSvg, renderSheetSvg, renderBackSheetSvg, fetchAsDataUri, fetchText,
  openSvgPrintWindow, downloadSvg,
} from '../../utils/crazy8Cards'
import { useCrazy8Master } from '../../hooks/useCrazy8'
import type { FormationDef } from '../../types/crazy8'
import styles from './AdminCrazy8Cards.module.css'

const POINT_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: '1/4', label: '¼ point',  color: '#29B6F6' },
  { value: '1/2', label: '½ point',  color: '#007830' },
  { value: '1',   label: '1 point',  color: '#F28C28' },
  { value: '3',   label: '3 points', color: '#D81818' },
]

interface QueueItem {
  id: string
  formationSlug: string
  formationName: string
  points: string
  playerName: string
}

export default function AdminCrazy8Generate() {
  const { master, upsertFormation } = useCrazy8Master()
  const FORMATIONS: FormationDef[] = master.formations

  const [formationSlug, setFormationSlug] = useState<string>('')
  const [formationName, setFormationName] = useState<string>('')
  const [points, setPoints] = useState('1')
  const [playerName, setPlayerName] = useState('')
  const [players, setPlayers] = useState<string[]>([])
  const [sponsorDataUri, setSponsorDataUri] = useState<string | null>(null)
  const [previewSvg, setPreviewSvg] = useState<string>('')
  const [queue, setQueue] = useState<QueueItem[]>([])

  const [fc8Badge, setFc8Badge] = useState<string>('')
  const [skyMark, setSkyMark] = useState<string>('')
  const [formationCache, setFormationCache] = useState<Record<string, string>>({})

  // New-formation modal state
  const [showAddFormation, setShowAddFormation] = useState(false)
  const [newFormName, setNewFormName] = useState('')
  const [newFormSlug, setNewFormSlug] = useState('')
  const [newFormSvg, setNewFormSvg] = useState<string>('')
  const [newFormBusy, setNewFormBusy] = useState(false)

  // Default the selected formation once master loads
  useEffect(() => {
    if (!formationSlug && FORMATIONS.length > 0) {
      setFormationSlug(FORMATIONS[0].slug)
      setFormationName(FORMATIONS[0].name)
    }
  }, [FORMATIONS, formationSlug])

  // Load brand assets once
  useEffect(() => {
    Promise.all([
      fetchAsDataUri('/crazy8/assets/fc8_badge.png'),
      fetchAsDataUri('/crazy8/assets/skyquest_mark.png'),
    ]).then(([fc8, sky]) => {
      setFc8Badge(fc8)
      setSkyMark(sky)
    }).catch(err => console.error('Failed to load brand assets', err))
  }, [])

  async function loadFormation(slug: string): Promise<string> {
    if (formationCache[slug]) return formationCache[slug]
    // Prefer inline svgContent from master (user-uploaded formations)
    const def = FORMATIONS.find(f => f.slug === slug)
    let svg: string
    if (def?.svgContent) {
      svg = def.svgContent
    } else {
      try {
        svg = await fetchText(`/crazy8/formations/${slug}.svg`)
      } catch {
        // Last-resort fallback: empty placeholder
        svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text x="50" y="50" text-anchor="middle" fill="#888" font-size="10">no art</text></svg>'
      }
    }
    setFormationCache(c => ({ ...c, [slug]: svg }))
    return svg
  }

  // Live preview
  useEffect(() => {
    if (!fc8Badge || !skyMark || !formationSlug) return
    let cancelled = false
    loadFormation(formationSlug).then(formationSvg => {
      if (cancelled) return
      const svg = renderCardSvg({
        formationSvg,
        formationName,
        points,
        playerName: playerName || null,
        cornerLogoDataUri: sponsorDataUri,
        fc8BadgeDataUri: fc8Badge,
        skyQuestMarkDataUri: skyMark,
      })
      setPreviewSvg(svg)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formationSlug, formationName, points, playerName, sponsorDataUri, fc8Badge, skyMark])

  function selectFormation(slug: string) {
    const f = FORMATIONS.find(x => x.slug === slug)
    if (!f) return
    setFormationSlug(slug)
    setFormationName(f.name)
  }

  function handleSponsorUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSponsorDataUri(String(reader.result))
    reader.readAsDataURL(file)
  }

  // ── Player CSV ──
  function handlePlayerCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result)
      const names = parsePlayerCsv(text)
      setPlayers(names)
    }
    reader.readAsText(file)
  }

  // ── New formation ──
  async function handleSaveNewFormation() {
    if (!newFormName.trim()) return
    const slug = (newFormSlug || slugify(newFormName)).trim()
    if (!slug) return
    setNewFormBusy(true)
    try {
      await upsertFormation({
        slug,
        name: newFormName.trim().toUpperCase(),
        svgContent: newFormSvg || undefined,
      })
      setShowAddFormation(false)
      setNewFormName(''); setNewFormSlug(''); setNewFormSvg('')
      // Select the new one
      setFormationSlug(slug)
      setFormationName(newFormName.trim().toUpperCase())
    } finally {
      setNewFormBusy(false)
    }
  }

  function handleNewFormSvgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setNewFormSvg(String(reader.result))
    reader.readAsText(file)
  }

  // ── Queue actions ──
  async function handleAddToQueue() {
    setQueue(q => [...q, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      formationSlug, formationName, points, playerName,
    }])
  }

  function addQueueForAllPlayers() {
    if (players.length === 0) return
    const stamp = Date.now()
    setQueue(q => [
      ...q,
      ...players.map((p, i) => ({
        id: `${stamp}-${i}-${Math.random().toString(36).slice(2, 5)}`,
        formationSlug, formationName, points,
        playerName: p,
      })),
    ])
  }

  function removeFromQueue(id: string) {
    setQueue(q => q.filter(item => item.id !== id))
  }

  async function downloadCurrent() {
    if (!previewSvg) return
    const safe = `${formationName.toLowerCase().replace(/\s+/g, '-')}_${points.replace('/', '-')}pt`
    downloadSvg(previewSvg, `${safe}.svg`)
  }

  function printCurrent() {
    if (!previewSvg) return
    openSvgPrintWindow(previewSvg, `${formationName} — ${points}pt`, false)
  }

  async function buildSheetAndPrint() {
    if (queue.length === 0 || !fc8Badge || !skyMark) return
    const cards: string[] = []
    for (const item of queue) {
      const formationSvg = await loadFormation(item.formationSlug)
      cards.push(renderCardSvg({
        formationSvg,
        formationName: item.formationName,
        points: item.points,
        playerName: item.playerName || null,
        cornerLogoDataUri: sponsorDataUri,
        fc8BadgeDataUri: fc8Badge,
        skyQuestMarkDataUri: skyMark,
      }))
    }
    openSvgPrintWindow(renderSheetSvg(cards), `Crazy 8 Cards — ${queue.length} cards`, true)
  }

  function printBackSheet() {
    if (!fc8Badge) return
    openSvgPrintWindow(renderBackSheetSvg(fc8Badge), 'Crazy 8 Card Backs — 9-up', true)
  }
  function downloadBackSheet() {
    if (!fc8Badge) return
    downloadSvg(renderBackSheetSvg(fc8Badge), 'crazy8_backs_sheet.svg')
  }

  async function buildSheetAndDownload() {
    if (queue.length === 0 || !fc8Badge || !skyMark) return
    const cards: string[] = []
    for (const item of queue) {
      const formationSvg = await loadFormation(item.formationSlug)
      cards.push(renderCardSvg({
        formationSvg,
        formationName: item.formationName,
        points: item.points,
        playerName: item.playerName || null,
        cornerLogoDataUri: sponsorDataUri,
        fc8BadgeDataUri: fc8Badge,
        skyQuestMarkDataUri: skyMark,
      }))
    }
    downloadSvg(renderSheetSvg(cards), `crazy8_sheet_${queue.length}cards.svg`)
  }

  const previewDataUri = useMemo(() => {
    if (!previewSvg) return ''
    return `data:image/svg+xml;utf8,${encodeURIComponent(previewSvg)}`
  }, [previewSvg])

  return (
    <>
      <div className={styles.container}>
        <div className={styles.col}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 className={styles.colTitle} style={{ margin: 0 }}>Formation</h3>
            <button
              className={styles.btn}
              style={{ fontSize: 10, padding: '4px 8px' }}
              onClick={() => setShowAddFormation(s => !s)}
            >
              + New
            </button>
          </div>

          {showAddFormation && (
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 10, marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                type="text"
                placeholder="Formation name (e.g. PINWHEEL)"
                value={newFormName}
                onChange={e => {
                  setNewFormName(e.target.value)
                  if (!newFormSlug) setNewFormSlug(slugify(e.target.value))
                }}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Slug (auto from name)"
                value={newFormSlug}
                onChange={e => setNewFormSlug(slugify(e.target.value))}
                style={inputStyle}
              />
              <label style={{ fontSize: 10, color: 'var(--adm-mute)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                SVG file (optional)
              </label>
              <input type="file" accept=".svg,image/svg+xml" onChange={handleNewFormSvgUpload} style={{ fontSize: 11 }} />
              {newFormSvg && <div style={{ fontSize: 10, color: '#7BC97A' }}>SVG loaded ({newFormSvg.length.toLocaleString()} chars)</div>}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  style={{ fontSize: 11, padding: '6px 10px', flex: 1 }}
                  onClick={handleSaveNewFormation}
                  disabled={!newFormName.trim() || newFormBusy}
                >
                  {newFormBusy ? 'Saving…' : 'Save'}
                </button>
                <button
                  className={styles.btn}
                  style={{ fontSize: 11, padding: '6px 10px' }}
                  onClick={() => { setShowAddFormation(false); setNewFormName(''); setNewFormSlug(''); setNewFormSvg('') }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className={styles.formationList}>
            {FORMATIONS.map(f => (
              <button
                key={f.slug}
                className={`${styles.formationBtn} ${formationSlug === f.slug ? styles.on : ''}`}
                onClick={() => selectFormation(f.slug)}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.col}>
          <h3 className={styles.colTitle}>Preview</h3>
          <div className={styles.preview}>
            {previewDataUri
              ? <img src={previewDataUri} alt="Card preview" style={{ maxWidth: '100%', maxHeight: 700 }} />
              : <span style={{ color: 'var(--adm-mute)' }}>Loading…</span>
            }
          </div>
        </div>

        <div className={styles.col}>
          <h3 className={styles.colTitle}>Card Settings</h3>

          <div className={styles.formGroup}>
            <label htmlFor="name">Formation name</label>
            <input id="name" type="text" value={formationName} onChange={e => setFormationName(e.target.value)} />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="points">Points</label>
            <select id="points" value={points} onChange={e => setPoints(e.target.value)}>
              {POINT_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="player">Player name {players.length > 0 && <span style={{ opacity: 0.6 }}>({players.length} loaded)</span>}</label>
            <input
              id="player"
              list="player-list"
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder={players.length > 0 ? 'Pick from list or type…' : 'e.g., Beverly Yang'}
            />
            <datalist id="player-list">
              {players.map(p => <option key={p} value={p} />)}
            </datalist>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center' }}>
              <label
                style={{
                  fontSize: 11, color: 'var(--adm-mute)', cursor: 'pointer',
                  border: '1px solid var(--adm-border, rgba(255,255,255,0.12))',
                  padding: '4px 8px', borderRadius: 4,
                }}
              >
                Load roster CSV
                <input type="file" accept=".csv,text/csv" onChange={handlePlayerCsvUpload} style={{ display: 'none' }} />
              </label>
              {players.length > 0 && (
                <button
                  className={styles.btn}
                  style={{ fontSize: 10, padding: '4px 8px' }}
                  onClick={() => { setPlayers([]); setPlayerName('') }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sponsor">Sponsor logo (optional)</label>
            <input id="sponsor" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={handleSponsorUpload} />
            {sponsorDataUri && (
              <button className={styles.btn} style={{ marginTop: 4, fontSize: 11 }} onClick={() => setSponsorDataUri(null)}>
                Clear sponsor
              </button>
            )}
          </div>

          <div className={styles.btnRow}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={printCurrent} disabled={!previewSvg}>Print this card</button>
            <button className={styles.btn} onClick={downloadCurrent} disabled={!previewSvg}>Download SVG</button>
            <button className={styles.btn} onClick={handleAddToQueue} disabled={!previewSvg}>+ Add to sheet</button>
            {players.length > 0 && (
              <button className={styles.btn} onClick={addQueueForAllPlayers} disabled={!previewSvg}>
                + Card for each player ({players.length})
              </button>
            )}
          </div>

          <div className={styles.divider} />

          <h3 className={styles.colTitle}>Sheet queue ({queue.length})</h3>
          {queue.length === 0
            ? <div className={styles.empty}>No cards queued. Add cards above to build a print sheet.</div>
            : (
              <div className={styles.queueList}>
                {queue.map(item => {
                  const colorObj = POINT_OPTIONS.find(p => p.value === item.points)
                  return (
                    <div key={item.id} className={styles.queueRow}>
                      <div>
                        <span className={styles.colorChip} style={{ background: colorObj?.color ?? '#888' }} />
                        <span className="name">{item.formationName}</span>
                        <span className="meta"> · {item.points}{item.playerName ? ` · ${item.playerName}` : ''}</span>
                      </div>
                      <button onClick={() => removeFromQueue(item.id)} title="Remove">×</button>
                    </div>
                  )
                })}
              </div>
            )
          }

          <div className={styles.btnRow}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={buildSheetAndPrint} disabled={queue.length === 0}>
              Print sheet (3×3)
            </button>
            <button className={styles.btn} onClick={buildSheetAndDownload} disabled={queue.length === 0}>
              Download sheet SVG
            </button>
            {queue.length > 0 && (
              <button className={styles.btn} onClick={() => setQueue([])} style={{ marginLeft: 'auto' }}>
                Clear all
              </button>
            )}
          </div>

          <div className={styles.divider} />
          <h3 className={styles.colTitle}>Card backs</h3>
          <p style={{ color: 'var(--adm-mute)', fontSize: 11, lineHeight: 1.5, margin: '0 0 8px' }}>
            9-up FC8 backs sized to align exactly with the front sheet for duplex printing.
          </p>
          <div className={styles.btnRow}>
            <button className={styles.btn} onClick={printBackSheet} disabled={!fc8Badge}>Print back sheet</button>
            <button className={styles.btn} onClick={downloadBackSheet} disabled={!fc8Badge}>Download back SVG</button>
          </div>
        </div>
      </div>
    </>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--adm-border, rgba(255,255,255,0.12))',
  borderRadius: 4,
  padding: '6px 8px',
  color: 'var(--adm-ink)',
  fontSize: 12,
  fontFamily: 'inherit',
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function parsePlayerCsv(text: string): string[] {
  // Accept either header rows (First,Last,Full) or just a list of names.
  const lines = text.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return []

  // Detect header
  const header = lines[0].toLowerCase()
  const hasHeader = /full|name|first|last/.test(header)
  const rows = hasHeader ? lines.slice(1) : lines

  const names: string[] = []
  for (const row of rows) {
    if (!row) continue
    const cols = row.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
    let pick = ''
    // Prefer a "Full" column (3rd or whichever is longest)
    if (cols.length >= 3 && cols[2]) pick = cols[2]
    else if (cols.length >= 2 && cols[0] && cols[1]) pick = `${cols[0]} ${cols[1]}`
    else pick = cols[0]
    if (pick && pick !== '>') names.push(pick)
  }
  return names
}
