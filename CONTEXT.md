# SkyQuest — Project Context

**GitHub:** https://github.com/frikkenc/skyquest  
**Last updated:** 2026-05-09  
**To start dev:** `npm install && npm run dev` (port 5173)

---

## Session history

### Thread 1 — "Flesh out SkyQuest plan + create mockups" (Apr 27)
- Created the full HTML mockup set at `D:\Dropbox\Claude\Design\SkyQuest\mockups\`
- 14 mockup files covering every page: landing, schedule, leaderboard, event instance, all admin pages, awards show, dive maker, Fury live scoring
- Each mockup has `API:` annotations documenting which Fury endpoints each data section calls
- Created implementation plan doc

### Thread 2 — "Implement SkyQuest React Firebase feature" (May 8)
Phase 1 build — scaffolded the entire app:
- Vite + React 18 + TypeScript project setup
- Firebase config, GitHub Actions CI/CD (`.github/workflows/deploy.yml`)
- All public pages: Landing, Schedule, Leaderboard, EventInstance
- Admin layout: fixed topbar + 220px sidebar + `<Outlet />`
- `AdminDashboard`: approval queue with animate-out, KPI strip, pending refunds, coming-up list, unmatched jumpers
- `src/types.ts` — all TypeScript interfaces
- `src/data/mockData.ts` — full mock data layer

### Thread 3 — Current session (May 9)
Phase 2 build — all admin drill-down pages:
- `AdminEventType` — subtabs (Overview/Instances/Divisions/Scoring/Settings), KPI strip, instance list, points table
- `AdminEventInstance` — 5-tab page: Registrations (bulk-select, inline approve/waitlist/deny), Scores (live-edit grid, instant re-rank), Waitlist, Payments, Emails
- `AdminEmailTemplates` — two-panel editor, 12 templates, scope filters, merge-token toolbar
- Wired all routes in `App.tsx`
- Moved code from `D:\Dropbox\Claude\Design\SkyQuest\app` → `D:\Dropbox2\Documents\Code\skyquest`
- Pushed to GitHub: 2 commits on `master`

---

## Repo state

```
src/
  App.tsx                   — all routes wired
  main.tsx                  — entry point
  index.css                 — CSS custom properties (brand tokens)
  types.ts                  — TypeScript interfaces
  data/mockData.ts          — all mock data (no real API yet)
  layouts/
    AdminLayout.tsx         — topbar + sidebar + <Outlet />
    AdminLayout.module.css
  pages/
    Landing.tsx
    Schedule.tsx
    Leaderboard.tsx
    EventInstance.tsx       — public event page
    admin/
      AdminDashboard.tsx    — approval queue, KPIs, refunds, coming-up
      AdminEventType.tsx    — event type overview with subtabs
      AdminEventInstance.tsx — 5-tab instance manager
      AdminEmailTemplates.tsx — two-panel template editor
  components/
    StatusPill.tsx
    EventBadge.tsx
```

---

## Routes

| Path | Component | Status |
|---|---|---|
| `/` | `Landing` | ✅ |
| `/schedule` | `Schedule` | ✅ |
| `/leaderboard` | `Leaderboard` | ✅ |
| `/events/:typeSlug/:instanceId` | `EventInstance` | ✅ |
| `/admin` | `AdminDashboard` | ✅ |
| `/admin/events/:typeSlug` | `AdminEventType` | ✅ |
| `/admin/events/:typeSlug/:instanceId` | `AdminEventInstance` | ✅ |
| `/admin/emails` | `AdminEmailTemplates` | ✅ |
| `/admin/*` | `AdminPlaceholder` | Stub |

---

## Tech stack

- React 18 + Vite + TypeScript
- React Router v6 (nested routes, `<Outlet />`)
- `@tanstack/react-query` — installed, not yet wired to real API
- CSS Modules (`.module.css` per component)
- CSS custom properties for all brand tokens (`--sq-red`, `--adm-ink`, etc.)
- Firebase Hosting + Firebase Auth — configured, needs env vars
- GitHub Actions CI/CD — PRs → preview channel, `main` push → live

**Fonts:** Bungee (display/headings, italic), Inter (body)  
**Brand red:** `#D81818`

---

## Mock data (`src/data/mockData.ts`)

- `EVENT_TYPES` — SCSL, Poker Run, Dueling DZs, Crazy 8's, Ghost Nationals
- `EVENT_INSTANCES` — 7 events for 2026 season
- `REGISTRATIONS` — 4 teams for poker-run (used by AdminEventInstance)
- `SCSL_RESULTS` — 5 teams × 8 round scores (used by Scores tab)
- `APPROVAL_QUEUE` — 4 pending items
- `PENDING_REFUNDS` — 2 items
- `SEASON_KPIS` — dashboard numbers
- `LEADERBOARD_AAA`, `LEADERBOARD_AA`

**All real data comes via Fury API — Phase 3 work.** The mockups have `API:` comments on every section.

---

## AdminEventInstance — tab detail

**Registrations:** division + status dropdowns, bulk-select checkboxes, "Approve All / Deny All" bulk bar, per-row Approve / Waitlist / Deny / ··· inline buttons, color-coded status + payment pills.

**Scores:** division pill switcher (AAA/AA/A/Rookie), editable inputs per round (8 rounds), totals + rankings recalculate live on every keystroke, "Unsaved changes" indicator, Save/Reset.

**Payments:** fee / paid / balance per team, Record Payment + Void buttons.

**Emails:** list of sent event-scoped emails, View + Resend buttons.

---

## AdminEmailTemplates — detail

12 templates across 5 scopes: League (2), SCSL (4), Poker (2), Crazy 8 (2), Awards (2).  
Left panel: search + scope filter + template list with sent counts.  
Right panel: subject / from (sender dropdown) / body editor, merge-token toolbar (click to insert at cursor), Discard / Save, AI Suggest bar (UI only).

---

## Firebase setup (not done yet)

1. Create project at console.firebase.google.com — use project ID `skyquest-fury`
2. Copy `.env.example` → `.env.local`, fill in the 6 `VITE_FIREBASE_*` vars
3. `firebase init hosting` to link the project
4. Add GitHub Actions secrets: `FIREBASE_SERVICE_ACCOUNT` + all 6 `VITE_FIREBASE_*` vars

---

## Phase 3 — what's next

### Admin pages still to build (mockups exist for all of these)
| Page | Route | Mockup |
|---|---|---|
| `AdminLeaderboard` | `/admin/leaderboard` | `02-leaderboard.html` |
| `AdminSeasons` | `/admin/seasons` | `14-admin-dashboard.html` |
| `AdminJumpers` | `/admin/jumpers` | — |
| `AdminResultsImport` | `/admin/results-import` | — |
| `AdminAwardsShow` | `/admin/awards` | `10-awards-live.html` |
| `AdminFuryLive` | `/admin/fury-live` | `13-fury-live.html` |
| Dive Builder | external: dive.fury.coach | `11-dive-maker.html`, `12-fury-dive.html` |

### API integration
Replace mock data with real Fury API via `@tanstack/react-query`. Key endpoints:
- `fury_admin_list_events`, `fury_admin_event_registrations`
- `fury_unit_approve`, `fury_unit_deny`, `fury_unit_waitlist`
- `fury_admin_approval_queue`, `fury_event_pending_refunds`
- `fury_payment_record`, `fury_order_void`

### Features to wire
- Approve/Deny/Waitlist → real Fury API calls
- Score save → publish to leaderboard
- Email template send → Fury Hub / Brevo
- Season context switcher (topbar dropdown)
- Topbar search (jumper/team lookup)
- Firebase Auth guard on `/admin`

---

## Mockups location

`D:\Dropbox\Claude\Design\SkyQuest\mockups\` — HTML files, reference these when building new pages. Each has `API:` annotations for Fury endpoint mapping.
