import type { TeamAssignment, TeamRegistration, EventInstance } from '../types'

export type RegMap = Record<string, TeamRegistration>

export function buildRegMap(regs: TeamRegistration[]): RegMap {
  return Object.fromEntries(regs.map(r => [r.id, r]))
}

export function eventYear(event: EventInstance): number {
  return new Date(event.date + 'T12:00:00').getFullYear()
}

export function openPrint(html: string) {
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Pop-up blocked — allow pop-ups for this page and try again.'); return }
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
}

// ── 1. Manifest Slips ──────────────────────────────────────────────────────────

export function manifestSlipsHtml(teams: TeamAssignment[], regById: RegMap, event: EventInstance): string {
  const logo = `${window.location.origin}/logos/scsl.png`
  const year = eventYear(event)
  const BLANKS = 2

  const slipHtml = (team: TeamAssignment | null) => {
    const members = team ? team.memberIds.map(id => regById[id]).filter(Boolean) : []
    const videoReg = team?.videoPersonId ? regById[team.videoPersonId] : null
    const videoName = videoReg ? (videoReg.members[0]?.name ?? '—') : '—'
    const knownTeamName = team?.teamName ?? ''
    const knownDiv = team?.division ?? (team ? (regById[team.memberIds[0]]?.division ?? '') : '')

    const rows = [0,1,2,3].map(i => {
      const reg = members[i]
      const shaded = i % 2 === 0
      if (!reg) return `<div class="row ${shaded ? 'shaded' : ''}">
        <span class="num">${i+1}</span>
        <span class="rhyphen">—</span>
        <span class="rblank"></span>
      </div>`
      const notReg = reg.status === 'pending' && reg.paymentStatus === 'unpaid'
      return `<div class="row ${shaded ? 'shaded' : ''}">
        <span class="num">${i+1}</span>
        <span class="rname">${reg.members[0]?.name ?? ''}</span>
        ${notReg ? '<span class="flag">NOT REG</span>' : ''}
      </div>`
    }).join('')

    const teamNameField = knownTeamName
      ? `<div class="sfield"><span class="sflbl">TEAM NAME</span><span class="sfval">${knownTeamName}</span></div>`
      : `<div class="sfield"><span class="sflbl">TEAM NAME</span><div class="sline"></div></div>`
    const divField = knownDiv
      ? `<div class="sfield sfield-div"><span class="sflbl">DIV</span><span class="sfval sfval-div">${knownDiv}</span></div>`
      : `<div class="sfield sfield-div"><span class="sflbl">DIV</span><div class="sline-short"></div></div>`

    return `<div class="slip">
      <div class="shead">
        <img class="slogo" src="${logo}" alt="">
        <div class="stitleblock">
          <div class="stitle">SCSL 4-WAY</div>
          <div class="ssub">SoCal SkyQuest • ${event.dropzone} ${year}</div>
        </div>
        <div class="scircle"></div>
      </div>
      <div class="sfields">${teamNameField}${divField}</div>
      <div class="smembers">${rows}</div>
      <div class="svideo"><span class="svid-lbl">VIDEO</span>${team ? videoName : '<span class="rblank svid-blank"></span>'}</div>
    </div>`
  }

  const cards = [
    ...teams.map(t => slipHtml(t)),
    ...Array(BLANKS).fill(null).map(() => slipHtml(null)),
  ].join('')

  return `<!DOCTYPE html><html><head><title>Manifest Slips — ${event.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:letter portrait;margin:.3in}
body{font-family:Arial,sans-serif;background:#fff}
.page{display:grid;grid-template-columns:1fr 1fr;gap:8pt}
.slip{border:1px solid #ccc;display:flex;flex-direction:column;break-inside:avoid;page-break-inside:avoid}
.shead{background:#111;color:#fff;display:flex;align-items:center;padding:5pt 7pt;gap:6pt;border-bottom:3pt solid #d81818}
.slogo{height:34pt;width:auto}
.stitleblock{flex:1}
.stitle{font-size:13pt;font-weight:900;letter-spacing:.04em}
.ssub{font-size:6.5pt;color:#aaa;margin-top:1pt}
.scircle{width:30pt;height:30pt;border-radius:50%;background:#fff;flex-shrink:0}
.sfields{padding:4pt 7pt;display:flex;align-items:center;gap:10pt;border-bottom:1px solid #e8e8e8;font-size:6pt;color:#888;letter-spacing:.07em;text-transform:uppercase}
.sfield{display:flex;align-items:center;gap:5pt;flex:1}
.sfield-div{flex:0 0 auto}
.sflbl{white-space:nowrap}
.sfval{font-weight:800;color:#111;font-size:8pt;letter-spacing:.01em;text-transform:none}
.sfval-div{min-width:28pt}
.sline{flex:1;border-bottom:1px solid #aaa;height:1em}
.sline-short{width:28pt;border-bottom:1px solid #aaa;height:1em}
.smembers{flex:1}
.row{display:flex;align-items:center;padding:6pt 7pt;min-height:20pt;font-size:9.5pt;border-bottom:1px solid #e8e8e8;gap:5pt}
.shaded{background:#f3f3f3}
.num{color:#d81818;font-weight:700;font-size:8.5pt;width:13pt;flex-shrink:0}
.rname{font-weight:700}
.rhyphen{color:#bbb;font-size:10pt;flex-shrink:0}
.rblank{flex:1;border-bottom:1px solid #bbb;height:1em;min-width:40pt}
.flag{font-size:5.5pt;color:#d81818;font-weight:800;margin-left:6pt;letter-spacing:.05em;text-transform:uppercase}
.svideo{background:#1a5c2a;color:#fff;padding:5pt 7pt;font-size:8.5pt;font-weight:600;display:flex;align-items:center;gap:10pt}
.svid-lbl{background:rgba(255,255,255,.15);border-radius:2pt;padding:1.5pt 5pt;font-size:6.5pt;font-weight:700;letter-spacing:.08em;flex-shrink:0}
.svid-blank{border-bottom-color:rgba(255,255,255,.4)}
</style></head><body>
<div class="page">${cards}</div>
</body></html>`
}

// ── 2. Check-In List ───────────────────────────────────────────────────────────

export function checkInListHtml(regs: TeamRegistration[], event: EventInstance): string {
  const logo = `${window.location.origin}/logos/skyquest-master.png`
  const year = eventYear(event)

  const confirmed = regs.filter(r => r.status !== 'denied')
  const sorted = [...confirmed].sort((a, b) => {
    const aLast = (a.members[0]?.name ?? '').split(' ').at(-1) ?? ''
    const bLast = (b.members[0]?.name ?? '').split(' ').at(-1) ?? ''
    return aLast.localeCompare(bLast)
  })

  const half = Math.ceil(sorted.length / 2)
  const cols = [sorted.slice(0, half), sorted.slice(half)]

  const rowHtml = (reg: TeamRegistration) => {
    const name = reg.members[0]?.name ?? ''
    const parts = name.split(' ')
    const last = parts.at(-1) ?? ''
    const first = parts.slice(0, -1).join(' ')
    const unpaid = reg.paymentStatus !== 'paid'
    return `<div class="ci-row${unpaid ? ' ci-unpaid' : ''}">
      <div class="ci-box"></div>
      <div class="ci-name"><strong>${last}</strong>, ${first}</div>
      <div class="ci-line"></div>
    </div>`
  }

  return `<!DOCTYPE html><html><head><title>Check-In List — ${event.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:letter portrait;margin:.4in}
body{font-family:Arial,sans-serif;background:#fff;font-size:9pt}
.dhead{background:#111;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:10pt 14pt;gap:12pt}
.hl{display:flex;align-items:center;gap:12pt}
.hlogo{height:50pt;width:auto}
.htitle{font-size:20pt;font-weight:900;letter-spacing:.02em}
.hsub{font-size:9pt;color:#bbb;margin-top:2pt}
.hbadge{background:#d81818;color:#fff;font-size:8pt;font-weight:800;padding:6pt 12pt;border-radius:3pt;letter-spacing:.06em;white-space:nowrap}
.hrule{border-bottom:3pt solid #d81818;margin-bottom:8pt}
.col-hdrs{display:grid;grid-template-columns:1fr 1fr;gap:8pt;margin-bottom:4pt}
.col-hdr{background:#1a5c2a;color:#fff;display:flex;justify-content:space-between;align-items:center;padding:4pt 10pt;font-size:7.5pt;font-weight:700;letter-spacing:.06em}
.count-line{font-size:7.5pt;color:#666;margin-bottom:5pt;padding-left:2pt}
.ci-cols{display:grid;grid-template-columns:1fr 1fr;gap:8pt}
.ci-row{display:flex;align-items:center;gap:7pt;padding:3.5pt 5pt;border-bottom:1px solid #e8e8e8;min-height:17pt}
.ci-row:nth-child(even){background:#f8f8f8}
.ci-box{width:10pt;height:10pt;border:1pt solid #aaa;flex-shrink:0}
.ci-name{font-size:8.5pt;white-space:nowrap}
.ci-line{flex:1;border-bottom:1px solid #ccc;height:1em}
.ci-unpaid .ci-name{color:#999}
.dfooter{margin-top:10pt;padding-top:5pt;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7.5pt;color:#888}
</style></head><body>
<div class="dhead">
  <div class="hl"><img class="hlogo" src="${logo}" alt="">
    <div><div class="htitle">SCSL 4-WAY MEET</div><div class="hsub">SoCal SkyQuest • ${event.dropzone}, CA • ${year}</div></div>
  </div>
  <div class="hbadge">CHECK-IN LIST</div>
</div>
<div class="hrule"></div>
<div class="col-hdrs">
  <div class="col-hdr"><span>LAST, FIRST</span><span>CHECKED IN</span></div>
  <div class="col-hdr"><span>LAST, FIRST</span><span>CHECKED IN</span></div>
</div>
<div class="count-line">${confirmed.length} Confirmed Athletes • Alpha by Last Name</div>
<div class="ci-cols">
  ${cols.map(col => `<div>${col.map(rowHtml).join('')}</div>`).join('')}
</div>
<div class="dfooter"><span>SoCal SkyQuest | furycoaching.com/socal-skyquest</span><span>Page 1</span></div>
</body></html>`
}

// ── 3. Payment Status ──────────────────────────────────────────────────────────

export function paymentStatusHtml(regs: TeamRegistration[], event: EventInstance): string {
  const logo = `${window.location.origin}/logos/skyquest-master.png`
  const year = eventYear(event)

  const all = regs.filter(r => r.status !== 'denied')
  const owes = [...all.filter(r => r.paymentStatus !== 'paid')]
    .sort((a, b) => (a.members[0]?.name ?? '').localeCompare(b.members[0]?.name ?? ''))
  const paid = [...all.filter(r => r.paymentStatus === 'paid')]
    .sort((a, b) => (a.members[0]?.name ?? '').localeCompare(b.members[0]?.name ?? ''))

  const oweRow = (reg: TeamRegistration) => {
    const name = reg.members[0]?.name ?? ''
    const tag = reg.paymentStatus === 'partial' ? ' <span class="tag-partial">partial</span>'
      : reg.status === 'pending' ? ' <span class="tag-notreg">not reg</span>' : ''
    return `<div class="owe-person">
      <div class="owe-name">${name}${tag}</div>
      <div class="owe-method">PAYMENT METHOD:<span class="owe-line"></span></div>
    </div>`
  }

  const paidRow = (reg: TeamRegistration) =>
    `<div class="paid-person"><span class="pdot">●</span>${reg.members[0]?.name ?? ''}</div>`

  const half = Math.ceil(owes.length / 2)
  const third = Math.ceil(paid.length / 3)

  return `<!DOCTYPE html><html><head><title>Payment Status — ${event.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:letter portrait;margin:.4in}
body{font-family:Arial,sans-serif;background:#fff;font-size:9pt}
.dhead{background:#111;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:10pt 14pt;gap:12pt}
.hl{display:flex;align-items:center;gap:12pt}
.hlogo{height:50pt;width:auto}
.htitle{font-size:20pt;font-weight:900;letter-spacing:.02em}
.hsub{font-size:9pt;color:#bbb;margin-top:2pt}
.hbadge{background:#d81818;color:#fff;font-size:8pt;font-weight:800;padding:6pt 12pt;border-radius:3pt;letter-spacing:.06em}
.hrule{border-bottom:3pt solid #d81818;margin-bottom:10pt}
.sec-hdr{padding:6pt 10pt;font-size:8pt;font-weight:800;letter-spacing:.05em;border-radius:3pt;margin-bottom:8pt}
.sec-owes{background:#d81818;color:#fff}
.sec-paid{background:#1a5c2a;color:#fff;margin-top:14pt}
.owe-grid{display:grid;grid-template-columns:1fr 1fr;gap:4pt 16pt}
.owe-person{padding:4pt 5pt;border-bottom:1px solid #eee}
.owe-name{font-size:9.5pt;font-weight:700;margin-bottom:2pt}
.owe-method{font-size:6pt;color:#888;letter-spacing:.05em;text-transform:uppercase;display:flex;align-items:center;gap:4pt}
.owe-line{flex:1;border-bottom:1px solid #bbb;height:1em}
.tag-notreg{font-size:7pt;color:#d81818;font-weight:700;margin-left:4pt}
.tag-partial{font-size:7pt;color:#e67e22;font-weight:700;margin-left:4pt}
.paid-grid{display:grid;grid-template-columns:1fr 1fr 1fr}
.paid-person{padding:3pt 5pt;font-size:9pt;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;gap:5pt}
.pdot{color:#1a5c2a;font-size:11pt;line-height:1}
.dfooter{margin-top:10pt;padding-top:5pt;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7.5pt;color:#888}
</style></head><body>
<div class="dhead">
  <div class="hl"><img class="hlogo" src="${logo}" alt="">
    <div><div class="htitle">SCSL 4-WAY MEET</div><div class="hsub">SoCal SkyQuest • ${event.dropzone}, CA • ${year}</div></div>
  </div>
  <div class="hbadge">PAYMENT STATUS</div>
</div>
<div class="hrule"></div>
<div class="sec-hdr sec-owes">COLLECT DAY OF EVENT (${owes.length} people)</div>
<div class="owe-grid">
  <div>${owes.slice(0, half).map(oweRow).join('')}</div>
  <div>${owes.slice(half).map(oweRow).join('')}</div>
</div>
<div class="sec-hdr sec-paid">PAID — FOR REFERENCE (${paid.length} people)</div>
<div class="paid-grid">
  <div>${paid.slice(0, third).map(paidRow).join('')}</div>
  <div>${paid.slice(third, third * 2).map(paidRow).join('')}</div>
  <div>${paid.slice(third * 2).map(paidRow).join('')}</div>
</div>
<div class="dfooter"><span>SoCal SkyQuest | furycoaching.com/socal-skyquest</span><span>Page 1</span></div>
</body></html>`
}

// ── 4. Teams Manifest ──────────────────────────────────────────────────────────

export function teamsManifestHtml(teams: TeamAssignment[], regById: RegMap, event: EventInstance): string {
  const logo = `${window.location.origin}/logos/skyquest-master.png`
  const year = eventYear(event)

  const cardHtml = (team: TeamAssignment, slot: number) => {
    const members = team.memberIds.map(id => regById[id]).filter(Boolean)
    const videoReg = team.videoPersonId ? regById[team.videoPersonId] : null
    const videoName = videoReg ? (videoReg.members[0]?.name ?? '—') : '—'
    const knownTeamName = team.teamName ?? ''
    const knownDiv = team.division ?? (regById[team.memberIds[0]]?.division ?? '')
    const headLabel = knownTeamName ? ` — ${knownTeamName}` : ''

    const memberRow = (reg: TeamRegistration) => {
      const name = reg.members[0]?.name ?? ''
      const isPaid = reg.paymentStatus === 'paid'
      const notReg = reg.status === 'pending' && reg.paymentStatus === 'unpaid'
      return `<div class="tm-row">
        <span class="tm-dot">●</span>
        <span class="tm-name">${name}${notReg ? ' <span class="tm-nr">NOT REG</span>' : ''}</span>
        <span class="tm-badge ${isPaid ? 'badge-paid' : 'badge-owes'}">${isPaid ? 'PAID' : 'OWES'}</span>
      </div>`
    }

    const teamNameMeta = knownTeamName
      ? `<div class="tc-metarow"><span class="tc-mlbl">TEAM NAME</span><span class="tc-mval">${knownTeamName}</span></div>`
      : `<div class="tc-metarow"><span class="tc-mlbl">TEAM NAME</span><div class="tc-line"></div></div>`
    const divMeta = knownDiv
      ? `<div class="tc-metarow"><span class="tc-mlbl">DIVISION</span><span class="tc-mval">${knownDiv}</span></div>`
      : `<div class="tc-metarow"><span class="tc-mlbl">DIVISION</span><div class="tc-line tc-line-short"></div></div>`

    return `<div class="team-card">
      <div class="tc-head">TEAM ${slot}${headLabel}</div>
      <div class="tc-meta">
        ${teamNameMeta}
        ${divMeta}
      </div>
      <div class="tc-members">
        ${members.map(memberRow).join('')}
        <div class="tc-video">VIDEO:  ${videoName}</div>
      </div>
    </div>`
  }

  const notRegCount = teams.flatMap(t => t.memberIds.map(id => regById[id]))
    .filter(r => r && r.status === 'pending' && r.paymentStatus === 'unpaid').length

  return `<!DOCTYPE html><html><head><title>Teams Manifest — ${event.name}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:letter portrait;margin:.4in}
body{font-family:Arial,sans-serif;background:#fff;font-size:9pt}
.dhead{background:#111;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:10pt 14pt;gap:12pt}
.hl{display:flex;align-items:center;gap:12pt}
.hlogo{height:50pt;width:auto}
.htitle{font-size:20pt;font-weight:900;letter-spacing:.02em}
.hsub{font-size:9pt;color:#bbb;margin-top:2pt}
.hbadge{background:#d81818;color:#fff;font-size:8pt;font-weight:800;padding:6pt 12pt;border-radius:3pt;letter-spacing:.06em}
.hrule{border-bottom:3pt solid #d81818;margin-bottom:10pt}
.teams-grid{display:grid;grid-template-columns:1fr 1fr;gap:10pt}
.team-card{border:1px solid #ccc;break-inside:avoid;page-break-inside:avoid}
.tc-head{background:#1a5c2a;color:#fff;padding:6pt 10pt;font-size:11pt;font-weight:900;letter-spacing:.04em}
.tc-meta{padding:5pt 10pt 4pt;border-bottom:1px solid #eee;display:flex;flex-direction:column;gap:3pt}
.tc-metarow{display:flex;align-items:center;gap:6pt;font-size:6.5pt;color:#888;text-transform:uppercase;letter-spacing:.05em}
.tc-mlbl{white-space:nowrap}
.tc-mval{font-weight:800;color:#111;font-size:8.5pt;text-transform:none;letter-spacing:.01em}
.tc-line{flex:1;border-bottom:1px solid #bbb;height:1em}
.tc-line-short{max-width:60pt}
.tc-members{padding:5pt 10pt 8pt}
.tm-row{display:flex;align-items:center;padding:3pt 0;border-bottom:1px solid #f0f0f0;gap:5pt}
.tm-dot{color:#d81818;font-size:11pt;flex-shrink:0;line-height:1}
.tm-name{flex:1;font-size:9pt;font-weight:700}
.tm-nr{font-size:6pt;color:#d81818;font-weight:800;letter-spacing:.03em;margin-left:4pt}
.tm-badge{font-size:6pt;font-weight:800;padding:1.5pt 5pt;border-radius:2pt;flex-shrink:0;letter-spacing:.05em}
.badge-paid{background:#1a5c2a;color:#fff}
.badge-owes{background:#d81818;color:#fff}
.tc-video{padding-top:4pt;font-size:8pt;color:#555}
.footnote{margin-top:12pt;font-size:7pt;color:#888;padding-top:5pt;border-top:1px solid #ddd}
.dfooter{margin-top:8pt;padding-top:5pt;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7.5pt;color:#888}
</style></head><body>
<div class="dhead">
  <div class="hl"><img class="hlogo" src="${logo}" alt="">
    <div><div class="htitle">SCSL 4-WAY MEET</div><div class="hsub">SoCal SkyQuest • ${event.dropzone}, CA • ${year}</div></div>
  </div>
  <div class="hbadge">TEAMS MANIFEST</div>
</div>
<div class="hrule"></div>
<div class="teams-grid">${teams.map((t, i) => cardHtml(t, i + 1)).join('')}</div>
${notRegCount > 0 ? '<div class="footnote">NOT REG = not yet registered as of print date</div>' : ''}
<div class="dfooter"><span>SoCal SkyQuest | furycoaching.com/socal-skyquest</span><span>Page 1</span></div>
</body></html>`
}
