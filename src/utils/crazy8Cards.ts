// Frikken Crazy 8s — card SVG renderer (browser).
//
// Cards: 250x350 internal viewBox (1:1.4 ratio).
// Print sheet: US Letter 612x792 pt, cards placed at 180x252 pt to match the
// original InDesign template exactly (3x3 = 540x756 covered + 36/18 pt margins,
// butted with no gutter so backs align when duplex-printed).

export type PointValue = '1/4' | '1/2' | '1' | '2' | '3' | string

export interface CardInputs {
  formationSvg: string         // raw SVG markup (already fetched)
  formationName: string        // display name, will be uppercased
  points: PointValue
  playerName?: string | null   // optional ribbon
  cornerLogoDataUri?: string | null    // optional sponsor — base64 data URI; falls back to SkyQuest mark
  fc8BadgeDataUri: string      // FC8 badge as data URI
  skyQuestMarkDataUri: string  // SkyQuest mark as data URI (used when no sponsor)
  pointColorOverride?: string | null
}

// Print-sheet geometry (in points — matches original 612x792 letter)
export const SHEET_W = 612
export const SHEET_H = 792
export const CARD_W = 180
export const CARD_H = 252
export const COLS = 3
export const ROWS = 3
export const MARGIN_X = 36   // (612 - 3*180) / 2
export const MARGIN_Y = 18   // (792 - 3*252) / 2
export const CUT_LEN = 9     // length of each cut tick in pts
export const CUT_OFFSET = 3  // gap between card edge and start of tick

const POINT_COLORS: Record<string, string> = {
  '1/4':  '#29B6F6',
  '0.25': '#29B6F6',
  '1/2':  '#007830',
  '0.5':  '#007830',
  '1':    '#F28C28',
  '2':    '#1565C0',
  '3':    '#D81818',
  '4':    '#1A3A6E',
}
const DEFAULT_POINT_COLOR = '#F28C28'

const POINT_DISPLAY: Record<string, string> = {
  '1/4': '¼', '0.25': '¼',
  '1/2': '½', '0.5': '½',
}

const FONT_FAMILY = "CCUpUpAndAway, Impact, Bungee, 'Arial Black', sans-serif"

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inlineFormationSvg(raw: string): string {
  const vbMatch = raw.match(/viewBox="([^"]+)"/)
  const widthMatch = raw.match(/\bwidth="([\d.]+)(?:px)?"/)
  const heightMatch = raw.match(/\bheight="([\d.]+)(?:px)?"/)
  let viewBoxAttr = ''
  if (vbMatch) viewBoxAttr = ` viewBox="${vbMatch[1]}"`
  else if (widthMatch && heightMatch) viewBoxAttr = ` viewBox="0 0 ${widthMatch[1]} ${heightMatch[1]}"`

  let inner = raw
    .replace(/<\?xml[^?]+\?>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<svg\b[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')

  return `<svg x="25" y="100" width="200" height="150"${viewBoxAttr} preserveAspectRatio="xMidYMid meet">${inner}</svg>`
}

function playerRibbon(playerName: string | null | undefined): string {
  if (!playerName || !playerName.trim()) return ''
  const name = playerName.trim()
  const n = name.length
  let fs = 12
  if (n > 22) fs = 8.5
  else if (n > 16) fs = 10
  return (
    `<rect x="18" y="262" width="214" height="22" rx="3" fill="#000000"/>` +
    `<text x="125" y="277" text-anchor="middle" font-family="${FONT_FAMILY}" ` +
    `font-size="${fs}" fill="#FFFFFF" letter-spacing="2.5" font-weight="900">` +
    `${escapeXml(name.toUpperCase())}</text>`
  )
}

function nameBlock(name: string): string {
  const n = name.length
  const hasSpace = name.indexOf(' ') >= 0
  if (hasSpace && n > 10) {
    const i = name.indexOf(' ')
    const line1 = name.slice(0, i)
    const line2 = name.slice(i + 1)
    const maxLen = Math.max(line1.length, line2.length)
    let fs = 12
    if (maxLen <= 7) fs = 17
    else if (maxLen <= 9) fs = 14.5
    return (
      `<text x="29" y="310" font-family="${FONT_FAMILY}" font-size="${fs.toFixed(1)}" ` +
      `fill="#FFFFFF" font-weight="900" letter-spacing="0.5">${escapeXml(line1)}</text>` +
      `<text x="29" y="328" font-family="${FONT_FAMILY}" font-size="${fs.toFixed(1)}" ` +
      `fill="#FFFFFF" font-weight="900" letter-spacing="0.5">${escapeXml(line2)}</text>`
    )
  }
  let fs = 14
  if (n <= 8) fs = 28
  else if (n <= 11) fs = 24
  else if (n <= 14) fs = 18
  return (
    `<text x="29" y="324" font-family="${FONT_FAMILY}" font-size="${fs.toFixed(1)}" ` +
    `fill="#FFFFFF" font-weight="900" letter-spacing="0.5">${escapeXml(name)}</text>`
  )
}

function pointsFontSize(display: string): number {
  return display === '¼' || display === '½' ? 30 : 36
}

export function renderCardSvg(input: CardInputs): string {
  const cornerLogo = input.cornerLogoDataUri || input.skyQuestMarkDataUri
  const pointColor = input.pointColorOverride || POINT_COLORS[input.points] || DEFAULT_POINT_COLOR
  const nameUpper = input.formationName.toUpperCase()
  const pointsText = POINT_DISPLAY[input.points] ?? input.points
  const pFs = pointsFontSize(pointsText)

  const formationBlock = inlineFormationSvg(input.formationSvg)
  const ribbon = playerRibbon(input.playerName)
  const nb = nameBlock(nameUpper)

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 250 350" width="250" height="350">
  <rect x="6" y="6" width="238" height="338" rx="14" ry="14" fill="#FFFFFF" stroke="#000000" stroke-width="3"/>
  <image x="18" y="20" width="64" height="40" preserveAspectRatio="xMinYMid meet" xlink:href="${cornerLogo}"/>
  <image x="178" y="14" width="62" height="58" preserveAspectRatio="xMaxYMid meet" xlink:href="${input.fc8BadgeDataUri}"/>
  ${formationBlock}
  ${ribbon}
  <rect x="18" y="290" width="214" height="44" rx="3" fill="${pointColor}"/>
  ${nb}
  <text x="222" y="328" text-anchor="end" font-family="${FONT_FAMILY}" font-size="${pFs.toFixed(1)}" fill="#FFFFFF" font-weight="900">${pointsText}</text>
</svg>`
}

/** Strip an SVG's outer wrapper to get the inner body. */
function stripSvgWrapper(svg: string): string {
  let inner = svg.replace(/<\?xml[^?]+\?>/g, '')
  const first = inner.indexOf('<svg')
  const firstEnd = inner.indexOf('>', first) + 1
  const last = inner.lastIndexOf('</svg>')
  return inner.slice(firstEnd, last)
}

/** Cut marks: short ticks at every card-edge column/row line, in the bleed area. */
function cutMarks(): string {
  const xs = [MARGIN_X, MARGIN_X + CARD_W, MARGIN_X + 2 * CARD_W, MARGIN_X + 3 * CARD_W]
  const ys = [MARGIN_Y, MARGIN_Y + CARD_H, MARGIN_Y + 2 * CARD_H, MARGIN_Y + 3 * CARD_H]
  const lines: string[] = []
  const stroke = `stroke="#000000" stroke-width="0.5"`
  // Top and bottom edge ticks (vertical lines at each column boundary, going into the top/bottom margin)
  for (const x of xs) {
    lines.push(`<line x1="${x}" y1="${MARGIN_Y - CUT_OFFSET - CUT_LEN}" x2="${x}" y2="${MARGIN_Y - CUT_OFFSET}" ${stroke}/>`)
    lines.push(`<line x1="${x}" y1="${SHEET_H - MARGIN_Y + CUT_OFFSET}" x2="${x}" y2="${SHEET_H - MARGIN_Y + CUT_OFFSET + CUT_LEN}" ${stroke}/>`)
  }
  // Left and right edge ticks (horizontal lines at each row boundary, going into the left/right margin)
  for (const y of ys) {
    lines.push(`<line x1="${MARGIN_X - CUT_OFFSET - CUT_LEN}" y1="${y}" x2="${MARGIN_X - CUT_OFFSET}" y2="${y}" ${stroke}/>`)
    lines.push(`<line x1="${SHEET_W - MARGIN_X + CUT_OFFSET}" y1="${y}" x2="${SHEET_W - MARGIN_X + CUT_OFFSET + CUT_LEN}" y2="${y}" ${stroke}/>`)
  }
  return lines.join('\n  ')
}

/** Tile up to 9 card SVGs onto a US Letter sheet, dimensions matching the original template. */
export function renderSheetSvg(cardSvgs: string[]): string {
  const placed: string[] = []
  cardSvgs.slice(0, COLS * ROWS).forEach((cardSvg, idx) => {
    const col = idx % COLS
    const row = Math.floor(idx / COLS)
    const x = MARGIN_X + col * CARD_W
    const y = MARGIN_Y + row * CARD_H
    placed.push(
      `<svg x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 250 350">${stripSvgWrapper(cardSvg)}</svg>`
    )
  })

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" viewBox="0 0 ${SHEET_W} ${SHEET_H}" width="${SHEET_W}pt" height="${SHEET_H}pt">
  <rect width="${SHEET_W}" height="${SHEET_H}" fill="#FFFFFF"/>
  ${placed.join('\n  ')}
  ${cutMarks()}
</svg>`
}

/** Generate the back-of-card sheet (9 identical FC8 backs) sized to align exactly with the fronts. */
export function renderBackSheetSvg(fc8BadgeDataUri: string): string {
  // Single card back: navy field with the FC8 badge centered + corner ornaments.
  const backCard = `<g>
    <rect x="0" y="0" width="250" height="350" fill="#1A3A6E"/>
    <rect x="6" y="6" width="238" height="338" fill="none" stroke="#FFFFFF" stroke-width="2" rx="6"/>
    <image x="35" y="65" width="180" height="220" preserveAspectRatio="xMidYMid meet" xlink:href="${fc8BadgeDataUri}"/>
  </g>`

  const placed: string[] = []
  for (let i = 0; i < COLS * ROWS; i++) {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = MARGIN_X + col * CARD_W
    const y = MARGIN_Y + row * CARD_H
    placed.push(`<svg x="${x}" y="${y}" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 250 350">${backCard}</svg>`)
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${SHEET_W} ${SHEET_H}" width="${SHEET_W}pt" height="${SHEET_H}pt">
  <rect width="${SHEET_W}" height="${SHEET_H}" fill="#FFFFFF"/>
  ${placed.join('\n  ')}
  ${cutMarks()}
</svg>`
}

export async function fetchAsDataUri(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function fetchText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.text()
}

/**
 * Resolve a formation's SVG markup, in priority order:
 *   1. artUrl        — uploaded to Firebase Storage (preferred; any size)
 *   2. svgContent    — inline markup on the master doc (legacy / tiny art)
 *   3. public file   — /crazy8/formations/<slug>.svg (the shipped defaults)
 *   4. placeholder   — "no art" stub
 */
export async function loadFormationSvg(
  slug: string,
  source?: { artUrl?: string | null; svgContent?: string | null } | string | null,
): Promise<string> {
  // Back-compat: a bare string used to mean svgContent.
  const src = typeof source === 'string' ? { svgContent: source } : (source ?? {})
  if (src.artUrl) {
    try { return await fetchText(src.artUrl) } catch { /* fall through to next source */ }
  }
  if (src.svgContent) return src.svgContent
  try {
    return await fetchText(`/crazy8/formations/${slug}.svg`)
  } catch {
    return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><text x="50" y="50" text-anchor="middle" fill="#888" font-size="10">no art</text></svg>'
  }
}

/** Open an SVG string in a new window styled for print, exact US Letter sizing. */
export function openSvgPrintWindow(svg: string, title: string, isSheet = false) {
  const pageCss = isSheet
    ? `@page { size: 8.5in 11in; margin: 0; }`
    : `@page { size: letter; margin: 0.25in; }`
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    ${pageCss}
    html, body { margin: 0; padding: 0; background: white; }
    svg { display: block; margin: 0 auto; }
    @media screen { body { padding: 16px; background: #ccc; } svg { box-shadow: 0 2px 12px rgba(0,0,0,0.2); } }
    @media print { body { padding: 0; background: white; } svg { box-shadow: none; } }
  </style>
</head>
<body>${svg}<script>setTimeout(function(){window.print()},400)</script></body>
</html>`
  const win = window.open('', '_blank', 'width=900,height=1000')
  if (!win) { alert('Pop-up blocked — allow pop-ups and try again.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
}

export function downloadSvg(svg: string, filename: string) {
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 200)
}

// ── Reference sheets: formation pick sheet + combos-by-round strips ──────────
// These print the year's *valid* formations (a pick menu players choose from)
// and the menu combos grouped into cuttable per-round strips.

/** Pull an SVG's inner body + viewBox so it can be nested at any box. */
function svgInnerAndViewBox(raw: string): { inner: string; viewBox: string } {
  const vbMatch = raw.match(/viewBox="([^"]+)"/)
  const widthMatch = raw.match(/\bwidth="([\d.]+)(?:px)?"/)
  const heightMatch = raw.match(/\bheight="([\d.]+)(?:px)?"/)
  let viewBox = '0 0 100 100'
  if (vbMatch) viewBox = vbMatch[1]
  else if (widthMatch && heightMatch) viewBox = `0 0 ${widthMatch[1]} ${heightMatch[1]}`
  return { inner: stripSvgWrapper(raw), viewBox }
}

/** Nest a formation SVG into an arbitrary box, preserving aspect ratio. */
function embedFormation(raw: string, x: number, y: number, w: number, h: number): string {
  const { inner, viewBox } = svgInnerAndViewBox(raw)
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">${inner}</svg>`
}

const REF_FONT = "Bungee, Impact, 'Arial Black', sans-serif"

function letterPage(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${SHEET_W} ${SHEET_H}" width="${SHEET_W}pt" height="${SHEET_H}pt">
  <rect width="${SHEET_W}" height="${SHEET_H}" fill="#FFFFFF"/>
  ${body}
</svg>`
}

export interface PickItem { name: string; svg: string }

// Frikken Crazy 8s brand palette (matches the card back + point badges).
const FC8_NAVY = '#1A3A6E'
const FC8_RED = '#D81818'
const FC8_STEEL = '#9FB8E0'

/**
 * Pick sheet — every valid formation as an art + name tile, auto-fit onto a
 * SINGLE US Letter page with a branded header (Crazy 8 badge + navy/red band).
 * Returns a one-element array (kept as [] for the multi-page print helper).
 */
export function renderFormationPickSheet(
  items: PickItem[],
  opts?: { title?: string; subtitle?: string; logoDataUri?: string | null },
): string[] {
  if (items.length === 0) return []
  const title = (opts?.title ?? 'Frikken Crazy 8s').toUpperCase()
  const subtitle = (opts?.subtitle ?? 'Pick your formations').toUpperCase()
  const logo = opts?.logoDataUri || null
  const N = items.length

  const M = 22
  const GAP = 8
  const HEADER_H = 66
  const HEADER_GAP = 10
  const NAME_H = 17

  const usableW = SHEET_W - 2 * M
  const usableH = SHEET_H - M - HEADER_H - HEADER_GAP - M

  // Choose the column count whose grid yields the largest squarish tile while
  // still fitting all N formations on one page (maximize the smaller side).
  let best = { cols: 1, tileW: usableW, tileH: usableH, score: -1 }
  for (let cols = 1; cols <= N; cols++) {
    const rows = Math.ceil(N / cols)
    const tileW = (usableW - (cols - 1) * GAP) / cols
    const tileH = (usableH - (rows - 1) * GAP) / rows
    if (tileW <= 20 || tileH <= 34) continue
    const score = Math.min(tileW, tileH)
    if (score > best.score) best = { cols, tileW, tileH, score }
  }
  const { cols, tileW, tileH } = best
  const gridW = cols * tileW + (cols - 1) * GAP
  const gridX = M + (usableW - gridW) / 2
  const gridY = M + HEADER_H + HEADER_GAP
  const artH = tileH - NAME_H - 6

  const tiles = items.map((item, i) => {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = gridX + col * (tileW + GAP)
    const y = gridY + row * (tileH + GAP)
    const nm = item.name.toUpperCase()
    const fs = Math.max(7, Math.min(13, (tileW - 8) / (nm.length * 0.62)))
    return (
      `<rect x="${x}" y="${y}" width="${tileW}" height="${tileH}" rx="7" fill="#FFFFFF" stroke="${FC8_NAVY}" stroke-width="1.5"/>` +
      embedFormation(item.svg, x + 6, y + 6, tileW - 12, artH) +
      `<text x="${x + tileW / 2}" y="${y + tileH - 6}" text-anchor="middle" font-family="${REF_FONT}" font-size="${fs.toFixed(1)}" font-weight="900" fill="${FC8_NAVY}">${escapeXml(nm)}</text>`
    )
  }).join('\n  ')

  // Branded header band: navy field, Crazy 8 badge, title + subtitle, red rule.
  const logoImg = logo
    ? `<image x="${M + 8}" y="${M + 8}" width="${HEADER_H - 16}" height="${HEADER_H - 16}" preserveAspectRatio="xMidYMid meet" xlink:href="${logo}"/>`
    : ''
  const titleX = logo ? M + HEADER_H + 4 : M + 16
  const titleAvail = M + usableW - titleX - 12
  const titleFs = Math.max(12, Math.min(22, titleAvail / (title.length * 0.6)))
  const header =
    `<rect x="${M}" y="${M}" width="${usableW}" height="${HEADER_H}" rx="10" fill="${FC8_NAVY}"/>` +
    logoImg +
    `<text x="${titleX}" y="${M + HEADER_H / 2}" font-family="${REF_FONT}" font-size="${titleFs.toFixed(1)}" font-style="italic" font-weight="900" fill="#FFFFFF">${escapeXml(title)}</text>` +
    `<text x="${titleX}" y="${M + HEADER_H / 2 + 18}" font-family="${REF_FONT}" font-size="10" letter-spacing="1.5" fill="${FC8_STEEL}">${escapeXml(subtitle)}</text>` +
    `<rect x="${M + 10}" y="${M + HEADER_H - 6}" width="${usableW - 20}" height="3" rx="1.5" fill="${FC8_RED}"/>`

  return [letterPage(`${header}\n  ${tiles}`)]
}

export interface StripCombo { formations: PickItem[]; value: number }
export interface StripRound { round: number; combos: StripCombo[] }

/**
 * Combos-by-round strips — one horizontal band per round, ONE dive (combo)
 * per line (formation art + names + total value). No cut marks; rounds simply
 * stack with a gap and paginate (roughly two rounds per US Letter page).
 */
export function renderRoundStripsSheet(rounds: StripRound[], opts?: { title?: string }): string[] {
  const withCombos = rounds.filter(r => r.combos.length > 0)
  if (withCombos.length === 0) return []
  const title = (opts?.title ?? 'Frikken Crazy 8s — Round Menus').toUpperCase()

  const M = 30
  const TITLE_H = 40
  const LABEL_W = 78
  const ROW_GAP = 6
  const STRIP_PAD = 8
  const ROUND_GAP = 10
  const PER_ROW = 1        // one dive per line
  const usableW = SHEET_W - 2 * M
  const combosAreaW = usableW - LABEL_W - 12
  const cellW = combosAreaW

  // Size each dive row so the whole menu fills ONE page when it can. Clamp to a
  // legible range; if even the min doesn't fit, height-based pagination below
  // spills the overflow onto extra pages.
  const numRounds = withCombos.length
  const totalCombos = withCombos.reduce((sum, r) => sum + r.combos.length, 0)
  const usableStripH = (SHEET_H - M) - (M + TITLE_H) - 6  // 6px safety
  const fitH =
    (usableStripH - numRounds * STRIP_PAD * 2 - (totalCombos - numRounds) * ROW_GAP - (numRounds - 1) * ROUND_GAP)
    / Math.max(1, totalCombos)
  const CELL_H = Math.max(54, Math.min(92, fitH))

  const stripHeight = (nCombos: number): number => {
    const rows = Math.max(1, Math.ceil(nCombos / PER_ROW))
    return STRIP_PAD * 2 + rows * CELL_H + (rows - 1) * ROW_GAP
  }

  // One dive per full-width line: formation art on the left (with "+" between),
  // the combo's names centered in the open space, and the point value on the right.
  const comboCell = (combo: StripCombo, x: number, y: number): string => {
    const n = combo.formations.length
    const valW = 56
    const thumbGap = 6
    const plusW = 12
    const thumbW = 58
    const thumbH = 46
    const thumbY = y + (CELL_H - thumbH) / 2
    let thumbs = ''
    let tx = x + 12
    combo.formations.forEach((f, i) => {
      thumbs += embedFormation(f.svg, tx, thumbY, thumbW, thumbH)
      tx += thumbW
      if (i < n - 1) {
        thumbs += `<text x="${tx + plusW / 2}" y="${y + CELL_H / 2 + 6}" text-anchor="middle" font-family="${REF_FONT}" font-size="18" fill="#999999">+</text>`
        tx += plusW + thumbGap
      }
    })
    const caption = combo.formations.map(f => f.name.toUpperCase()).join('  +  ')
    const valX = x + cellW - valW - 8
    const capX = tx + 16
    const capAvail = valX - capX - 10
    const capFs = Math.max(7, Math.min(16, capAvail / (caption.length * 0.64)))
    return (
      `<rect x="${x}" y="${y}" width="${cellW}" height="${CELL_H}" rx="6" fill="#FAFAFA" stroke="#DDDDDD" stroke-width="1"/>` +
      thumbs +
      `<text x="${capX}" y="${y + CELL_H / 2 + capFs / 3}" font-family="${REF_FONT}" font-size="${capFs.toFixed(1)}" font-weight="900" fill="#1A3A6E">${escapeXml(caption)}</text>` +
      `<rect x="${valX}" y="${y + 10}" width="${valW}" height="${CELL_H - 20}" rx="5" fill="#1A3A6E"/>` +
      `<text x="${valX + valW / 2}" y="${y + CELL_H / 2 + 3}" text-anchor="middle" font-family="${REF_FONT}" font-size="22" font-weight="900" fill="#FFFFFF">${combo.value}</text>` +
      `<text x="${valX + valW / 2}" y="${y + CELL_H - 12}" text-anchor="middle" font-family="${REF_FONT}" font-size="7" fill="#FFFFFF" opacity="0.8">PTS</text>`
    )
  }

  const strip = (round: StripRound, y: number): string => {
    const h = stripHeight(round.combos.length)
    const cx = M + LABEL_W + 12
    const cells = round.combos.map((combo, i) => {
      const cy = y + STRIP_PAD + i * (CELL_H + ROW_GAP)
      return comboCell(combo, cx, cy)
    }).join('\n  ')
    return (
      `<rect x="${M}" y="${y}" width="${usableW}" height="${h}" rx="8" fill="#FFFFFF" stroke="#111111" stroke-width="1.5"/>` +
      `<text x="${M + 14}" y="${y + h / 2 - 4}" font-family="${REF_FONT}" font-size="11" fill="#999999" font-style="italic">ROUND</text>` +
      `<text x="${M + 14}" y="${y + h / 2 + 22}" font-family="${REF_FONT}" font-size="34" font-weight="900" fill="#D81818">${round.round}</text>` +
      cells
    )
  }

  const bottom = SHEET_H - M
  const pages: string[] = []
  let body: string[] = []
  let y = M + TITLE_H
  let firstOnPage = true

  const flush = (isFirstPage: boolean) => {
    const header = isFirstPage
      ? `<text x="${M}" y="${M + 22}" font-family="${REF_FONT}" font-size="20" font-style="italic" font-weight="900" fill="#111111">${escapeXml(title)}</text>`
      : ''
    pages.push(letterPage(`${header}\n  ${body.join('\n  ')}`))
    body = []
  }

  for (const round of withCombos) {
    const h = stripHeight(round.combos.length)
    // Spill to a new page only when this round genuinely won't fit.
    if (!firstOnPage && y + h > bottom) {
      flush(pages.length === 0)
      y = M
      firstOnPage = true
    }
    if (!firstOnPage) {
      y += ROUND_GAP
    }
    body.push(strip(round, y))
    y += h
    firstOnPage = false
  }
  if (body.length) flush(pages.length === 0)
  return pages
}

/** Open one or more full-page SVGs in a print window, one letter page each. */
export function openMultiPageSvgPrintWindow(svgs: string[], title: string) {
  if (svgs.length === 0) { alert('Nothing to print.'); return }
  const pages = svgs.map(s => `<div class="page">${s}</div>`).join('\n')
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    @page { size: 8.5in 11in; margin: 0; }
    html, body { margin: 0; padding: 0; background: white; }
    .page { page-break-after: always; }
    .page:last-child { page-break-after: auto; }
    svg { display: block; margin: 0 auto; }
    @media screen { body { padding: 16px; background: #ccc; } .page { margin-bottom: 16px; } svg { box-shadow: 0 2px 12px rgba(0,0,0,0.2); } }
    @media print { body { padding: 0; background: white; } svg { box-shadow: none; } }
  </style>
</head>
<body>${pages}<script>setTimeout(function(){window.print()},400)</script></body>
</html>`
  const win = window.open('', '_blank', 'width=900,height=1000')
  if (!win) { alert('Pop-up blocked — allow pop-ups and try again.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
}
