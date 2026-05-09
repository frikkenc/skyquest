import { useState, useRef } from 'react'
import styles from './AdminEmailTemplates.module.css'

type Scope = 'All' | 'League' | 'SCSL' | 'Poker' | 'Crazy 8' | 'Awards'
const SCOPES: Scope[] = ['All', 'League', 'SCSL', 'Poker', 'Crazy 8', 'Awards']

interface Template {
  id: string
  name: string
  subject: string
  scope: Exclude<Scope, 'All'>
  sends: number
  body: string
  trigger: string
}

const TEMPLATES: Template[] = [
  { id: 'welcome', name: 'welcome_to_skyquest', subject: 'Welcome to SoCal SkyQuest 2026 — your season starts now', scope: 'League', sends: 86, trigger: 'Manual / season kick-off', body: `Hey {{firstName}},

Welcome to SoCal SkyQuest 2026! You're now on the season roster.

Follow the leaderboard at socalskyquest.com — it updates live after each event.

See you in the sky,
Christy` },
  { id: 'scsl-confirm', name: 'scsl_reg_confirmation', subject: "You're in! SCSL @ {{eventDz}} — {{eventDate}}", scope: 'SCSL', sends: 62, trigger: 'Fury Reg: on registration approved', body: `Hey {{firstName}},

You're in for {{eventName}} at {{eventDz}} on {{eventDate}}!

This is a 4-way Formation Skydiving comp — 8 rounds, all divisions. You'll get the dive pool by {{divePoolDate}}.

What you signed up for:
  Team: {{teamName}}
  Division: {{division}}
  Reg fee: {{regFee}} (paid via Fury Reg)

What's next:
  1. We'll match you with teammates if you're solo — watch for "Your team is set!" email
  2. Dive pool drops {{divePoolDate}}
  3. Show up at {{eventDz}} on {{eventDate}}, 7:30am check-in

Your slot in the SkyQuest leaderboard is locked. One event or six — it all counts!

See you in the sky,
Christy

PS — sign up for the rest of the season at socalskyquest.com/schedule` },
  { id: 'scsl-team-set', name: 'scsl_team_set', subject: 'Your SCSL team for {{eventName}} is set!', scope: 'SCSL', sends: 14, trigger: 'Manual: after team roster finalized', body: `Hey {{firstName}},

Your team for {{eventName}} has been confirmed:

Team: {{teamName}}
Division: {{division}}
Members: {{teammates}}

Your team captain is {{captainName}} — they'll be your point of contact for the event.

See you at {{eventDz}},
Christy` },
  { id: 'scsl-divepool', name: 'scsl_dive_pool', subject: 'SCSL {{eventName}} dive pool is live', scope: 'SCSL', sends: 14, trigger: 'Manual: when dive pool published', body: `Hey {{firstName}},

The dive pool for {{eventName}} is live:
socalskyquest.com/events/scsl/{{instanceId}}/divepool

Download it, study up, and reach out if you have questions.

See you in the sky,
Christy` },
  { id: 'scsl-results', name: 'scsl_results_posted', subject: '{{eventName}} results — your team scored {{teamPts}} pts', scope: 'SCSL', sends: 14, trigger: 'Manual: after results published', body: `Hey {{firstName}},

Results for {{eventName}} are in!

{{teamName}} — Division {{division}}
Total score: {{teamScore}}
Placement: {{placement}}
Season points earned: {{teamPts}}

Full results at socalskyquest.com/events/scsl/{{instanceId}}

See you at the next one,
Christy` },
  { id: 'leaderboard-weekly', name: 'leaderboard_weekly', subject: 'SkyQuest standings — {{weekRange}}', scope: 'League', sends: 86, trigger: 'Automated: every Monday', body: `Hey {{firstName}},

Here's where the season stands after {{weekRange}}:

Top 5 — AAA:
{{leaderboard_aaa_top5}}

Full standings: socalskyquest.com/leaderboard

Next event: {{nextEventName}} · {{nextEventDate}} · {{nextEventDz}}
Register by {{nextEventDeadline}} at socalskyquest.com/schedule

See you in the sky,
Christy` },
  { id: 'poker-confirm', name: 'poker_run_reg_confirmation', subject: "You're in the Poker Run! Hand draw at 9am", scope: 'Poker', sends: 22, trigger: 'Fury Reg: on registration approved', body: `Hey {{firstName}},

You're registered for the SkyQuest Poker Run at {{eventDz}} on {{eventDate}}!

Hand draw is at 9am — be there early. You'll jump your way to the best poker hand.

Entry fee: {{regFee}} (paid)
Prize pool: Grows with registrations

See you in the sky,
Christy` },
  { id: 'poker-pot', name: 'poker_run_pot_update', subject: 'Poker Run pot is up to {{potTotal}} — last call', scope: 'Poker', sends: 0, trigger: 'Manual: before registration deadline', body: `Hey {{firstName}},

Registration for the Poker Run closes {{deadline}} and the pot is already at {{potTotal}}!

Lock in your spot: socalskyquest.com/events/poker

Christy` },
  { id: 'crazy8-submit', name: 'crazy8_card_combo_submit', subject: 'Submit your Crazy 8 combo by {{deadline}}', scope: 'Crazy 8', sends: 0, trigger: 'Manual: 2 weeks before event', body: `Hey {{firstName}},

Time to pick your Crazy 8 card combo! Submit by {{deadline}} at:
socalskyquest.com/events/crazy8/{{instanceId}}/combo

You'll pick 8 cards to match during the event — your dive pool will be built from them.

Christy` },
  { id: 'crazy8-locked', name: 'crazy8_combo_locked', subject: 'Your Crazy 8 combo is locked — see you at Perris', scope: 'Crazy 8', sends: 0, trigger: 'Automated: on combo submission', body: `Hey {{firstName}},

Your Crazy 8 combo is locked in:
{{combo}}

Your custom dive pool will be posted one week before the event.

See you at Perris on {{eventDate}},
Christy` },
  { id: 'awards-invite', name: 'awards_invitation', subject: 'Awards Night at the Bombshelter — RSVP', scope: 'Awards', sends: 0, trigger: 'Manual: 3 weeks before awards night', body: `Hey {{firstName}},

SkyQuest 2026 Awards Night is happening at the Bombshelter at Perris on {{eventDate}}.

RSVP: socalskyquest.com/awards

Awards for all division winners, top teams, most improved, and a few surprises.

Free for all 2026 SkyQuest competitors. Bring your team.

See you there,
Christy` },
  { id: 'awards-recap', name: 'awards_recap', subject: "SkyQuest 2026 wrap-up · what a season", scope: 'Awards', sends: 0, trigger: 'Manual: after awards night', body: `Hey {{firstName}},

What a season.

Thanks for being part of SkyQuest 2026. Results, photos, and video highlights are posted at socalskyquest.com.

{{personalRecap}}

We'll be back in 2027. Registration opens in January.

See you in the sky,
Christy` },
]

const MERGE_TOKENS = [
  '{{firstName}}', '{{teamName}}', '{{division}}', '{{eventName}}',
  '{{eventDz}}', '{{eventDate}}', '{{regFee}}', '{{placement}}',
  '{{teamScore}}', '{{teamPts}}', '{{divePoolDate}}', '{{deadline}}',
  '{{potTotal}}', '{{weekRange}}', '{{teammates}}',
]

const SCOPE_COLORS: Record<Exclude<Scope, 'All'>, string> = {
  League: styles.tagLeague,
  SCSL: styles.tagSCSL,
  Poker: styles.tagPoker,
  'Crazy 8': styles.tagCrazy8,
  Awards: styles.tagAwards,
}

export default function AdminEmailTemplates() {
  const [scopeFilter, setScopeFilter] = useState<Scope>('All')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string>('scsl-confirm')
  const [editedTemplates, setEditedTemplates] = useState<Record<string, Partial<Template>>>({})
  const [saved, setSaved] = useState(true)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const filtered = TEMPLATES.filter(t => {
    const matchScope = scopeFilter === 'All' || t.scope === scopeFilter
    const q = search.toLowerCase()
    const matchSearch = !q || t.name.includes(q) || t.subject.toLowerCase().includes(q)
    return matchScope && matchSearch
  })

  const selected = TEMPLATES.find(t => t.id === selectedId)!
  const edits = editedTemplates[selectedId] ?? {}
  const current = { ...selected, ...edits }

  function patch(field: keyof Template, value: string) {
    setEditedTemplates(prev => ({
      ...prev,
      [selectedId]: { ...(prev[selectedId] ?? {}), [field]: value },
    }))
    setSaved(false)
  }

  function handleSave() {
    setSaved(true)
  }

  function insertToken(token: string) {
    const ta = bodyRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const body = current.body
    const next = body.slice(0, start) + token + body.slice(end)
    patch('body', next)
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + token.length
      ta.focus()
    })
  }

  return (
    <div>
      {/* Page header */}
      <div className={styles.pageHd}>
        <div>
          <h1 className={styles.pageTitle}>Email Templates</h1>
          <p className={styles.pageDesc}>League-wide and per-event-type templates with mail-merge tokens.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles.adminBtn}>Import from Fresh Meet</button>
          <button className={`${styles.adminBtn} ${styles.primary}`}>+ New Template</button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiStrip}>
        {[
          { num: TEMPLATES.length, lbl: 'Templates' },
          { num: TEMPLATES.filter(t => t.scope === 'League').length, lbl: 'League-wide' },
          { num: TEMPLATES.filter(t => t.scope !== 'League').length, lbl: 'Event-Specific' },
          { num: TEMPLATES.reduce((s, t) => s + t.sends, 0), lbl: 'Sent · 2026' },
          { num: 22, lbl: 'In Queue' },
        ].map(k => (
          <div key={k.lbl} className={styles.kpi}>
            <div className={styles.kpiNum}>{k.num}</div>
            <div className={styles.kpiLbl}>{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Two-panel shell */}
      <div className={styles.shell}>
        {/* Left: template list */}
        <div className={styles.listPanel}>
          <div className={styles.listHead}>
            <input
              className={styles.listSearch}
              placeholder="Search templates…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.filterTabs}>
            {SCOPES.map(s => (
              <button
                key={s}
                className={`${styles.filterTab} ${scopeFilter === s ? styles.filterTabOn : ''}`}
                onClick={() => setScopeFilter(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className={styles.templateList}>
            {filtered.map(t => (
              <div
                key={t.id}
                className={`${styles.templateItem} ${selectedId === t.id ? styles.templateItemActive : ''}`}
                onClick={() => { setSelectedId(t.id); setSaved(true) }}
              >
                <div className={styles.tiName}>
                  <span>{t.name}</span>
                  <span className={styles.tiSent}>{t.sends > 0 ? `${t.sends} sent` : 'unsent'}</span>
                </div>
                <div className={styles.tiSubj}>{t.subject}</div>
                <div className={styles.tiMeta}>
                  <span className={`${styles.tag} ${SCOPE_COLORS[t.scope]}`}>{t.scope}</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className={styles.listEmpty}>No templates match.</div>
            )}
          </div>
        </div>

        {/* Right: editor */}
        <div className={styles.editorPanel}>
          <div className={styles.editorHead}>
            <div>
              <h2 className={styles.editorTitle}>{current.name}</h2>
              <div className={styles.editorMeta}>{current.scope} · {current.trigger} · {current.sends} sends in 2026</div>
            </div>
            <div className={styles.editorHeadActions}>
              <button className={styles.adminBtn}>Test Send</button>
              <button className={styles.adminBtn}>Preview</button>
              <button className={styles.adminBtn}>Duplicate</button>
              <button className={`${styles.adminBtn} ${styles.danger}`}>Archive</button>
            </div>
          </div>

          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel}>Subject</label>
            <input
              className={styles.fieldInput}
              value={current.subject}
              onChange={e => patch('subject', e.target.value)}
            />
          </div>

          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel}>From</label>
            <select className={styles.fieldInput}>
              <option>Christy &lt;christy@furycoaching.com&gt;</option>
              <option>SoCal SkyQuest &lt;info@socalskyquest.com&gt;</option>
            </select>
          </div>

          <div className={styles.fieldBlock}>
            <label className={styles.fieldLabel}>Body (plain text · merge tokens supported)</label>
            <div className={styles.tokenBar}>
              {MERGE_TOKENS.map(tok => (
                <button key={tok} className={styles.token} onClick={() => insertToken(tok)}>{tok}</button>
              ))}
            </div>
            <textarea
              ref={bodyRef}
              className={styles.fieldBody}
              value={current.body}
              onChange={e => patch('body', e.target.value)}
            />
          </div>

          <div className={styles.editorFooter}>
            <div className={styles.aiSuggest}>
              <span>✦</span>
              <span>AI suggestion available — Claude can rewrite this template in Christy's voice based on Fresh Meet templates.</span>
              <button className={styles.adminBtn} style={{ marginLeft: 'auto' }}>Generate</button>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
              <button className={styles.adminBtn} onClick={() => {
                setEditedTemplates(prev => { const n = { ...prev }; delete n[selectedId]; return n })
                setSaved(true)
              }}>Discard</button>
              <button
                className={`${styles.adminBtn} ${styles.primary}`}
                onClick={handleSave}
                disabled={saved}
              >
                {saved ? 'Saved' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
