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
