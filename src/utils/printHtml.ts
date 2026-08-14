import type { TeamAssignment, TeamRegistration, EventInstance } from '../types'
import type { FuryPayment } from '../lib/furyClient'

export type RegMap = Record<string, TeamRegistration>

export function buildRegMap(regs: TeamRegistration[]): RegMap {
  return Object.fromEntries(regs.map(r => [r.id, r]))
}

export function eventYear(event: EventInstance): number {
  return new Date(event.date + 'T12:00:00').getFullYear()
}

// Print header title from the event name. Drops the "(SoCal SkyQuest)" league
// suffix — the subtitle already carries it — so any event's printouts are
// correctly titled (not hardcoded to SCSL).
export function eventTitle(event: EventInstance): string {
  return event.name.replace(/\s*\(SoCal SkyQuest\)\s*$/i, '').trim().toUpperCase()
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
          <div class="stitle">${eventTitle(event)}</div>
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

/**
 * The day-of table sheet: who's here, who still owes you something.
 *
 * Organised by team rather than alphabetically, because check-in happens a
 * team at a time — a captain walks up with their whole team, and an alpha list
 * means four separate lookups across two columns.
 *
 * Each person carries the two things the table has to settle before they jump:
 * whether they're registered, and whether they've paid (and how, so a "I already
 * Venmo'd you" can be checked rather than argued). Team name and division are
 * blank write-in fields — both get decided at the table, not in advance.
 *
 * `payments` is optional and keyed by registration id: `undefined` for an id
 * means we couldn't find out (the per-registration fetch failed), which prints
 * differently from a confirmed "nothing paid".
 */
export function checkInListHtml(
  teams: TeamAssignment[],
  regById: RegMap,
  event: EventInstance,
  opts: {
    payments?: Record<string, FuryPayment[] | undefined>
    unassigned?: TeamRegistration[]
  } = {},
): string {
  const logo = `${window.location.origin}/logos/skyquest-master.png`
  const year = eventYear(event)
  const payments = opts.payments

  // Only 'paid' rows count — a refunded payment means the money went back.
  const paidFor = (regId: string) => {
    const rows = payments?.[regId]
    if (!rows) return null                       // unknown vs. known-nothing
    const paid = rows.filter(p => p.status === 'paid')
    if (!paid.length) return { total: 0, methods: [] as string[] }
    return {
      total: paid.reduce((s, p) => s + p.amount, 0),
      methods: [...new Set(paid.map(p => p.method))],
    }
  }

  const regCell = (reg: TeamRegistration) => {
    if (reg.status === 'pending') return '<span class="tag tag-bad">NOT REG</span>'
    if (reg.status === 'waitlist') return '<span class="tag tag-warn">WAITLIST</span>'
    if (reg.status === 'cancelled') return '<span class="tag tag-bad">CANCELLED</span>'
    return '<span class="tag tag-ok">REG&rsquo;D</span>'
  }

  const payCell = (reg: TeamRegistration) => {
    // Someone who pulled out owes nothing. They stay on the sheet so the table
    // can see the team is short, but chasing them for money is wrong.
    if (reg.status === 'cancelled') return '<span class="amt none">—</span>'
    const p = paidFor(reg.id)
    const owed = reg.balance || 0
    // Nothing to collect (video slots and comped entries are $0) — an "OWES $0"
    // badge next to their name is just noise at the table.
    if (!owed && (!p || p.total === 0)) return '<span class="amt none">—</span>'
    // No payment data at all — print the amount and a line, same as the old
    // sheet did, rather than asserting they owe it.
    if (!p) return `<span class="amt">$${owed}</span><span class="wline"></span>`
    if (p.total > 0) {
      const short = p.total < owed ? ` <span class="tag tag-warn">SHORT $${owed - p.total}</span>` : ''
      return `<span class="tag tag-ok">PAID $${p.total}</span> <span class="method">${p.methods.join(' + ')}</span>${short}`
    }
    return `<span class="tag tag-bad">OWES $${owed}</span><span class="wline"></span>`
  }

  const personRow = (reg: TeamRegistration, isVideo = false) => {
    const full = reg.fullName || reg.members[0]?.name || ''
    return `<div class="p-row">
      <span class="p-box"></span>
      <span class="p-name">${full}</span>
      <span class="p-reg">${regCell(reg)}${isVideo ? ' <span class="tag tag-vid">VIDEO</span>' : ''}</span>
      <span class="p-pay">${payCell(reg)}</span>
    </div>`
  }

  // Expected but never registered — no id to look up, and the whole reason
  // they're printed is so someone chases them at the table.
  const pendingRow = (name: string) => `<div class="p-row">
      <span class="p-box"></span>
      <span class="p-name">${name}</span>
      <span class="p-reg"><span class="tag tag-bad">NOT REG</span></span>
      <span class="p-pay"><span class="tag tag-bad">OWES</span><span class="wline"></span></span>
    </div>`

  const teamBlock = (team: TeamAssignment, slot: number) => {
    const members = team.memberIds.map(id => regById[id]).filter(Boolean)
    // When the video person is one of the team's own members they'd otherwise
    // print twice — once as a jumper, once as a synthetic video registration
    // under a different id. Tag their real row instead and drop the extra one,
    // so their registration and payment status stays visible.
    const videoIsMember = !!team.videoMemberId
    const videoReg = !videoIsMember && team.videoPersonId ? regById[team.videoPersonId] : null
    const videoName = videoReg ? (videoReg.members[0]?.name ?? '') : ''
    const load = team.loadNumber
      ? `<span class="t-load">LOAD ${team.loadNumber}${team.loadTime ? ` · ${team.loadTime}` : ''}</span>`
      : ''
    // A team already named in the app still gets the blank line — names change
    // at the table, and there's nowhere else to write the new one.
    const nameHint = team.teamName ? `<span class="fill">${team.teamName}</span>` : ''

    return `<div class="team">
      <div class="t-head"><span class="t-n">TEAM ${slot}</span>${load}</div>
      <div class="t-fields">
        <span class="f-lbl">TEAM NAME</span><span class="f-line">${nameHint}</span>
        <span class="f-lbl">DIVISION</span><span class="f-line f-short"></span>
      </div>
      <div class="t-people">
        ${members.map(m => personRow(m, m.id === team.videoMemberId)).join('')}
        ${(team.pendingNames ?? []).map(pendingRow).join('')}
        ${videoName ? `<div class="p-row p-video"><span class="p-box"></span><span class="p-name">${videoName}</span><span class="p-reg"><span class="tag tag-vid">VIDEO</span></span><span class="p-pay"></span></div>` : ''}
      </div>
    </div>`
  }

  const unassigned = (opts.unassigned ?? []).filter(r => r.status !== 'denied' && r.status !== 'cancelled')
  const unassignedBlock = unassigned.length ? `<div class="team">
      <div class="t-head t-head-alt"><span class="t-n">NOT ON A TEAM</span><span class="t-load">${unassigned.length} registered</span></div>
      <div class="t-people">${unassigned.map(r => personRow(r)).join('')}</div>
    </div>` : ''

  // Counts worth knowing before the doors open.
  const allOnTeams = teams.flatMap(t => t.memberIds.map(id => regById[id])).filter(Boolean) as TeamRegistration[]
  const everyone = [...allOnTeams, ...unassigned]
  const notReg = everyone.filter(r => r.status === 'pending').length
    + teams.reduce((s, t) => s + (t.pendingNames?.length ?? 0), 0)
  const owing = payments
    ? everyone.filter(r => { const p = paidFor(r.id); return p && p.total === 0 && (r.balance || 0) > 0 }).length
    : null

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Check-In — ${event.name}</title>
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
.hrule{border-bottom:3pt solid #d81818;margin-bottom:7pt}
.summary{font-size:8pt;color:#444;margin-bottom:8pt;display:flex;gap:14pt;flex-wrap:wrap}
.summary b{color:#d81818}
.team{border:1px solid #ccc;margin-bottom:8pt;break-inside:avoid;page-break-inside:avoid}
.t-head{background:#1a5c2a;color:#fff;padding:4pt 9pt;display:flex;align-items:baseline;justify-content:space-between;gap:10pt}
.t-head-alt{background:#555}
.t-n{font-size:10.5pt;font-weight:900;letter-spacing:.05em}
.t-load{font-size:7.5pt;font-weight:700;letter-spacing:.06em;opacity:.85}
.t-fields{display:flex;align-items:center;gap:6pt;padding:5pt 9pt 4pt;border-bottom:1px solid #eee;font-size:6.5pt;color:#888;text-transform:uppercase;letter-spacing:.05em}
.f-lbl{white-space:nowrap;flex-shrink:0}
.f-line{flex:1;border-bottom:1px solid #999;height:1.25em;position:relative}
.f-short{flex:0 0 70pt}
.fill{position:absolute;left:2pt;bottom:1pt;font-size:8.5pt;font-weight:800;color:#111;text-transform:none;letter-spacing:0}
.t-people{padding:3pt 9pt 6pt}
.p-row{display:flex;align-items:center;gap:8pt;padding:3.5pt 0;border-bottom:1px solid #f0f0f0;min-height:19pt}
.p-row:last-child{border-bottom:none}
.p-box{width:11pt;height:11pt;border:1.2pt solid #333;border-radius:2pt;flex-shrink:0}
.p-name{flex:1;font-size:9.5pt;font-weight:700}
.p-reg{flex:0 0 62pt}
.p-pay{flex:0 0 165pt;display:flex;align-items:center;gap:5pt}
.p-video .p-name{font-weight:600;color:#555;font-style:italic}
.tag{font-size:6.5pt;font-weight:800;letter-spacing:.05em;padding:1.5pt 4pt;border-radius:2pt;white-space:nowrap}
.tag-ok{background:#e3f2e5;color:#1a5c2a;border:.8pt solid #1a5c2a}
.tag-bad{background:#fdeaea;color:#d81818;border:.8pt solid #d81818}
.tag-warn{background:#fff4e0;color:#a86400;border:.8pt solid #a86400}
.tag-vid{background:#f2e8f7;color:#7b3fa0;border:.8pt solid #7b3fa0}
.method{font-size:7.5pt;color:#444;text-transform:capitalize}
.amt{font-size:8.5pt;font-weight:800;flex-shrink:0}
.amt.none{color:#bbb;font-weight:400}
.wline{flex:1;border-bottom:1px solid #bbb;height:1em;min-width:44pt}
.dfooter{margin-top:8pt;padding-top:5pt;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7.5pt;color:#888}
</style></head><body>
<div class="dhead">
  <div class="hl"><img class="hlogo" src="${logo}" alt="">
    <div><div class="htitle">${eventTitle(event)}</div><div class="hsub">SoCal SkyQuest • ${event.dropzone}, CA • ${year}</div></div>
  </div>
  <div class="hbadge">CHECK-IN</div>
</div>
<div class="hrule"></div>
<div class="summary">
  <span>${teams.length} teams · ${everyone.length} people</span>
  ${notReg ? `<span><b>${notReg}</b> still to register</span>` : ''}
  ${owing !== null && owing > 0 ? `<span><b>${owing}</b> still to pay</span>` : ''}
  ${payments ? '' : '<span>· payment history unavailable — amounts shown are the fee owed</span>'}
</div>
${teams.map((t, i) => teamBlock(t, i + 1)).join('')}
${unassignedBlock}
<div class="dfooter"><span>SoCal SkyQuest | furycoaching.com/socal-skyquest</span><span>☐ = checked in</span></div>
</body></html>`
}

// ── 3. Payment Status ──────────────────────────────────────────────────────────

export function paymentStatusHtml(regs: TeamRegistration[], event: EventInstance): string {
  const logo = `${window.location.origin}/logos/skyquest-master.png`
  const year = eventYear(event)

  // Same as check-in: cancelled owes nothing and shouldn't be on the collect sheet.
  const all = regs.filter(r => r.status !== 'denied' && r.status !== 'cancelled')
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
    <div><div class="htitle">${eventTitle(event)}</div><div class="hsub">SoCal SkyQuest • ${event.dropzone}, CA • ${year}</div></div>
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

    // Day-of collect sheet: name · fee · checkbox to tick off as paid is
    // collected. (No online-paid data in the feed — so it's a manual sheet.)
    const memberRow = (reg: TeamRegistration) => {
      const name = reg.members[0]?.name ?? ''
      const fee = reg.balance > 0 ? `$${reg.balance}` : '—'
      // Someone who cancelled after teams were built still sits on the team.
      // Print it loudly — this sheet is what manifest works from.
      const cancelled = reg.status === 'cancelled'
      return `<div class="tm-row${cancelled ? ' tm-row-cxl' : ''}">
        <span class="tm-dot">●</span>
        <span class="tm-name">${name}</span>
        ${cancelled ? '<span class="tm-cxl">CANCELLED</span>' : ''}
        <span class="tm-fee">${cancelled ? '—' : fee}</span>
        <span class="tm-check"></span>
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
.tm-fee{font-size:8.5pt;font-weight:800;color:#111;flex-shrink:0;min-width:32pt;text-align:right}
.tm-check{width:11pt;height:11pt;border:1.2pt solid #333;border-radius:2pt;flex-shrink:0;margin-left:2pt}
.tc-video{padding-top:4pt;font-size:8pt;color:#555}
.tm-row-cxl .tm-name{text-decoration:line-through;color:#999}
.tm-cxl{font-size:5.5pt;font-weight:800;color:#d81818;letter-spacing:.06em;border:.8pt solid #d81818;border-radius:2pt;padding:.5pt 3pt;flex-shrink:0}
.load-head{grid-column:1/-1;display:flex;align-items:baseline;gap:8pt;border-bottom:1.5pt solid #111;padding:6pt 2pt 3pt;margin-top:4pt;break-after:avoid;page-break-after:avoid}
.load-head:first-child{margin-top:0}
.lh-n{font-size:12pt;font-weight:900;letter-spacing:.06em}
.lh-t{font-size:9pt;font-weight:700;color:#d81818}
.footnote{margin-top:12pt;font-size:7pt;color:#888;padding-top:5pt;border-top:1px solid #ddd}
.dfooter{margin-top:8pt;padding-top:5pt;border-top:1px solid #ddd;display:flex;justify-content:space-between;font-size:7.5pt;color:#888}
</style></head><body>
<div class="dhead">
  <div class="hl"><img class="hlogo" src="${logo}" alt="">
    <div><div class="htitle">${eventTitle(event)}</div><div class="hsub">SoCal SkyQuest • ${event.dropzone}, CA • ${year}</div></div>
  </div>
  <div class="hbadge">TEAMS MANIFEST</div>
</div>
<div class="hrule"></div>
<div class="teams-grid">${teams.map((t, i) => {
  // Teams arrive in saved order, so a load header goes in wherever the load
  // number changes. Teams with no load set at all just render as a flat list.
  const prev = i > 0 ? teams[i - 1].loadNumber : undefined
  const header = t.loadNumber && t.loadNumber !== prev
    ? `<div class="load-head"><span class="lh-n">LOAD ${t.loadNumber}</span>${t.loadTime ? `<span class="lh-t">${t.loadTime}</span>` : ''}</div>`
    : ''
  return header + cardHtml(t, i + 1)
}).join('')}</div>
<div class="footnote">$ = registration fee &nbsp;·&nbsp; ☐ = check off as you collect day-of &nbsp;·&nbsp; some may have already paid online</div>
<div class="dfooter"><span>SoCal SkyQuest | furycoaching.com/socal-skyquest</span><span>Page 1</span></div>
</body></html>`
}
