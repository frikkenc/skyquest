import { useEffect, useMemo, useState } from 'react'
import {
  renderCardSvg, renderSheetSvg, renderBackSheetSvg, fetchAsDataUri, fetchText,
  openSvgPrintWindow, downloadSvg,
} from '../../utils/crazy8Cards'
import styles from './AdminCrazy8Cards.module.css'

// Frikken Crazy 8 deck. Slug = filename without extension (under /crazy8/formations/).
// Display name = label printed on the card.
const FORMATIONS: { slug: string; name: string }[] = [
  { slug: 'sattelite',        name: 'SATTELITE' },
  { slug: 'helix',            name: 'HELIX' },
  { slug: 'flipflake',        name: 'FLIPFLAKE' },
  { slug: 'crank',            name: 'CRANK' },
  { slug: 'friendly',         name: 'FRIENDLY' },
  { slug: 'vulture',          name: 'VULTURE' },
  { slug: 'star',             name: 'STAR' },
  { slug: 'inout',            name: 'IN OUT' },
  { slug: 'rainbow',          name: 'DOUBLE RAINBOW' },
  { slug: 'opposed-diamonds', name: 'OPPOSED DIAMOND' },
  { slug: 'phalanx',          name: 'PHALANX' },
  { slug: 'open',             name: 'OPEN' },
  { slug: 'nacho',            name: 'NACHO' },
  { slug: 'yeesh',            name: 'YEESH' },
  { slug: 'comp',             name: 'COMPRESSED' },
  { slug: 'starzip',          name: 'STARZIP' },
  { slug: 'jj',               name: 'JJ' },
  { slug: 'siiiiiidebody',    name: 'SIDEBODY' },
]

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
  const [formationSlug, setFormationSlug] = useState(FORMATIONS[0].slug)
  const [formationName, setFormationName] = useState(FORMATIONS[0].name)
  const [points, setPoints] = useState('1')
  const [playerName, setPlayerName] = useState('')
  const [sponsorDataUri, setSponsorDataUri] = useState<string | null>(null)
  const [previewSvg, setPreviewSvg] = useState<string>('')
  const [queue, setQueue] = useState<QueueItem[]>([])

  // Loaded once per session
  const [fc8Badge, setFc8Badge] = useState<string>('')
  const [skyMark, setSkyMark] = useState<string>('')
  const [formationCache, setFormationCache] = useState<Record<string, string>>({})

  // Load brand assets on mount
  useEffect(() => {
    Promise.all([
      fetchAsDataUri('/crazy8/assets/fc8_badge.png'),
      fetchAsDataUri('/crazy8/assets/skyquest_mark.png'),
    ]).then(([fc8, sky]) => {
      setFc8Badge(fc8)
      setSkyMark(sky)
    }).catch(err => console.error('Failed to load brand assets', err))
  }, [])

  // Lazy-load formation SVGs
  async function loadFormation(slug: string): Promise<string> {
    if (formationCache[slug]) return formationCache[slug]
    const svg = await fetchText(`/crazy8/formations/${slug}.svg`)
    setFormationCache(c => ({ ...c, [slug]: svg }))
    return svg
  }

  // Render preview whenever inputs change
  useEffect(() => {
    if (!fc8Badge || !skyMark) return
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

  async function handleAddToQueue() {
    setQueue(q => [...q, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      formationSlug,
      formationName,
      points,
      playerName,
    }])
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
    openSvgPrintWindow(previewSvg, `${formationName} — ${points}pt`)
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
    const sheet = renderSheetSvg(cards)
    openSvgPrintWindow(sheet, `Crazy 8 Cards — ${queue.length} cards`, true)
  }

  function printBackSheet() {
    if (!fc8Badge) return
    const back = renderBackSheetSvg(fc8Badge)
    openSvgPrintWindow(back, 'Crazy 8 Card Backs — 9-up', true)
  }

  function downloadBackSheet() {
    if (!fc8Badge) return
    const back = renderBackSheetSvg(fc8Badge)
    downloadSvg(back, 'crazy8_backs_sheet.svg')
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
    const sheet = renderSheetSvg(cards)
    downloadSvg(sheet, `crazy8_sheet_${queue.length}cards.svg`)
  }

  const previewDataUri = useMemo(() => {
    if (!previewSvg) return ''
    return `data:image/svg+xml;utf8,${encodeURIComponent(previewSvg)}`
  }, [previewSvg])

  return (
    <>
      <div className={styles.container}>
        <div className={styles.col}>
          <h3 className={styles.colTitle}>Formation</h3>
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
            <input
              id="name"
              type="text"
              value={formationName}
              onChange={e => setFormationName(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="points">Points</label>
            <select id="points" value={points} onChange={e => setPoints(e.target.value)}>
              {POINT_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="player">Player name (optional)</label>
            <input
              id="player"
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="e.g., Beverly Yang"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="sponsor">Sponsor logo (optional, replaces SkyQuest mark)</label>
            <input
              id="sponsor"
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleSponsorUpload}
            />
            {sponsorDataUri && (
              <button
                className={styles.btn}
                style={{ marginTop: 4, fontSize: 11 }}
                onClick={() => setSponsorDataUri(null)}
              >
                Clear sponsor
              </button>
            )}
          </div>

          <div className={styles.btnRow}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={printCurrent} disabled={!previewSvg}>
              Print this card
            </button>
            <button className={styles.btn} onClick={downloadCurrent} disabled={!previewSvg}>
              Download SVG
            </button>
            <button className={styles.btn} onClick={handleAddToQueue} disabled={!previewSvg}>
              + Add to sheet
            </button>
          </div>

          <div className={styles.divider} />

          <h3 className={styles.colTitle}>Sheet queue ({queue.length}/9)</h3>
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
            <button className={styles.btn} onClick={printBackSheet} disabled={!fc8Badge}>
              Print back sheet
            </button>
            <button className={styles.btn} onClick={downloadBackSheet} disabled={!fc8Badge}>
              Download back SVG
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
