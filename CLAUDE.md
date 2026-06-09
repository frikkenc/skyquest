# SkyQuest — notes for Claude (and humans)

Stuff you only learn by getting bitten by it. Read this before changing
anything to do with deploys, auth, Fury API, or the admin AI button. The
session that produced these notes burned a real Identity Hub deploy and a
leaked API key getting them sorted — don't repeat.

For historical session context, see `CONTEXT.md`. This file is the
gotcha-and-pattern reference.

---

## 1. Two Firebase projects — never mix them up

SkyQuest spans **two** Firebase projects on purpose:

| Project           | Holds                                              | Public URL                  |
|-------------------|----------------------------------------------------|-----------------------------|
| `fury-identity`   | Firebase Auth, Firestore data, Cloud Functions     | `fury-identity.web.app` (Identity Hub — NOT SkyQuest) |
| `skyquest-7cfe0`  | The public hosting site                            | `skyquest-7cfe0.web.app`    |

`fury-identity.web.app` is the **Fury Identity Hub**. The Fury Registration
frontend points users there for sign-in (`VITE_IDENTITY_HUB_BASE_URL` in the
furyregistration repo). If you deploy SkyQuest hosting to `fury-identity` by
mistake, you clobber the Hub and break sign-in for the entire Fury ecosystem.

**`.env.local` must use the `fury-identity` web SDK config**, not
`skyquest-7cfe0`'s. Tokens minted by skyquest-7cfe0 Auth are not valid against
the Fury Registration API — its Path B verifier expects `fury-identity` as
the audience. Wrong env → every Fury call 401s with "Invalid or expired token"
and the admin Registrations tab shows "Could not load Fury registrations".

Pull the right config with:
```powershell
firebase --project fury-identity apps:sdkconfig WEB <web-app-id>
```

---

## 2. Deploying

**Use the npm scripts. Don't call `firebase deploy` by hand without
`--project`.**

```powershell
npm run deploy           # build + hosting → skyquest, then functions → fury-identity
npm run deploy:hosting   # build + hosting → skyquest-7cfe0
npm run deploy:functions # functions → fury-identity (default project)
```

If you ever do call the CLI directly, **hosting must include
`--project skyquest`**. The default project is `fury-identity` and
`firebase deploy --only hosting` without the flag deploys to the wrong site.
The alias name `skyquest` in `.firebaserc` was deliberately chosen so this is
obvious — the previous alias was `hosting` which read like a Firebase
Hosting target and was the booby trap behind the clobbering incident.

If you do clobber `fury-identity.web.app`, restore the Identity Hub by
re-releasing the previous version via the Hosting REST API (list releases,
pick the pre-incident version, POST a new release with that `versionName`).
The CLI's `firebase hosting:clone` doesn't work here because the Hub source
isn't on this machine.

---

## 3. Fury Registration API

### URLs

| Env       | URL                                                 | Notes                                       |
|-----------|-----------------------------------------------------|---------------------------------------------|
| Local dev | `http://localhost:4000`                             | Run from `../furyregistration/backend`      |
| Deployed  | `https://api-wj2a2vwtsq-uc.a.run.app`               | Cloud Run, Firebase Functions v2 under the hood |

The Vite proxy in `vite.config.ts` points at the deployed API by default.
Swap to `http://localhost:4000` if you have the Fury backend running locally
(faster, no cold start, and at one point the deployed revision had a stale
identity service account credential that 401'd every valid token — local was
the only path that worked until Fury redeployed).

### Token verification — Path B

The Fury backend runs in "Path B" / split mode: data lives in
`fury-registration`, but tokens are verified against `fury-identity`. That's
why SkyQuest signs into `fury-identity` and sends those tokens — they
satisfy the Fury backend's `verifyIdToken(getApp("identity")).verifyIdToken(t)`.

A 401 from Fury usually means one of:
- SkyQuest's Auth project is wrong (see section 1).
- The Cloud Run revision has a stale `IDENTITY_SERVICE_ACCOUNT_JSON` secret.
  (Fix is on the Fury side: redeploy from clean main against the same
  Secret Manager binding.)
- Sometimes just an expired token — `getIdToken(true)` to force refresh.

### React Query options for Fury queries

Use the shared options in `src/hooks/useFuryData.ts`:

```ts
{ networkMode: 'always', retry: false }
```

React Query v5's default `networkMode: 'online'` treats a 401 as a transient
connectivity blip. `fetchStatus` oscillates between `fetching` and `paused`,
`failureCount` resets each cycle, `status` stays `'pending'`, `isError`
never becomes `true`. The UI falls through to the success branch and renders
"0 registrants · live from Fury" — silently masking auth failures. Don't
relax these options.

---

## 4. AI Suggest (the `suggestTeams` Cloud Function)

**Path:** `functions/src/index.ts` → deployed to `fury-identity` Cloud Run.

### Job: explicit-mention graph, not random packing

The function builds teams ONLY from explicit mutual or chained mentions in
each registrant's "wants" note. Read the prompt in
`functions/src/index.ts` for the exact rules. Key invariants:

- **Never pad teams with strangers.** A team of 3 with one open slot is fine.
- **People with no preferences stay in the pool.** No silent shuffling.
- **Wanted teammates not in the roster** become `pendingNames` on the team
  (a visible "waiting for them to sign up" slot), not silent substitutions.
- **Conflicts** ("Joe wants Jack+Jill, Jill wants Joe+Max — pick a third")
  are surfaced as decision points the captain resolves, not auto-resolved.

Response shape:
```ts
{
  groups: { confirmedIds: string[]; pendingNames: string[]; reasoning: string }[]
  unassigned: string[]
  conflicts: { description: string; involvedIds: string[] }[]
}
```

Frontend handler is `runAiSuggest` in `AdminEventInstance.tsx`. It defensively
coerces every field — server-side prompt drift is a real risk, so don't
assume keys exist.

### Function gotchas

- **Don't import `@anthropic-ai/sdk` at the top of `index.ts`.** Its
  transitive deps blow past the 10s module-load window Firebase uses to
  discover backend specs. Deploy fails with *"User code failed to load.
  Cannot determine backend specification. Timeout after 10000."* Use the
  `await import('@anthropic-ai/sdk')` pattern inside the handler — the cold
  start pays the cost once, deploy stays fast.
- **`firebase-functions` v7 minimum.** v6's discovery server hits the same
  10s timeout regardless of how the user code is structured.
- **`secrets: ['ANTHROPIC_API_KEY']` must be declared on the `onCall`
  options.** Without it, `firebase functions:secrets:set ANTHROPIC_API_KEY`
  stores the secret but the function instance can't see it — `process.env.
  ANTHROPIC_API_KEY` stays undefined and the function 500s.
- **Cloud Run invoker permission.** When the function is first deployed,
  the Cloud Run service rejects browser callables with *"Empty Authorization
  header value"* until you grant `roles/run.invoker` to `allUsers`:
  ```powershell
  gcloud run services add-iam-policy-binding suggestteams `
    --region=us-central1 --member="allUsers" --role="roles/run.invoker" `
    --project=fury-identity
  ```
  The function's own `if (!request.auth)` check is what gates real auth;
  the public Cloud Run permission just lets the SDK reach the URL.
- **First Cloud Functions v2 deploy on a freshly-Blaze-upgraded project**
  fails with *"missing permission on the build service account"*. Grant
  the Compute Engine default SA (`<projectNumber>-compute@...`) the
  `roles/cloudbuild.builds.builder` role.

### Setting / rotating the Anthropic key

```powershell
firebase functions:secrets:set ANTHROPIC_API_KEY    # prompts for value, do NOT paste it on the command line
npm run deploy:functions                            # grants the function access to the secret on first deploy
```

NEVER pass the value as the secret name (`firebase functions:secrets:set sk-ant-...`).
It looks like it works because the CLI accepts the syntax, but the key
ends up in PSReadLine history, the CLI debug log, and any chat transcript.
If you do leak one, rotate it before anything else.

---

## 5. Top-nav SIGN UP and per-event signup buttons

- The working host is **`register.furycoaching.com`**. The legacy
  `registration.furycoaching.com` does not resolve (NXDOMAIN) — that was the
  original "dead SIGN UP link" bug.
- `src/utils/registrationUrl.ts` exports a `normalizeRegistrationUrl()`
  self-heal that rewrites the typo'd host. Nav, EventCTA, and EventInstance
  all run their hrefs through it. If you ever see a per-event reg URL come
  back with the wrong host (Firestore eventConfig override, stale Fury
  record, hand-edited admin URL), this layer keeps the link clickable.
- The top-nav CTA is intentionally a single hardcoded
  `https://register.furycoaching.com/` — it does NOT deep-link to a specific
  event. The previous behavior of picking "the soonest open event" caused
  too many "wrong event" reports. Don't reintroduce per-event deep-linking
  on the top bar.

---

## 6. Teaming tab — Fury → TeamRegistration mapper

`src/pages/admin/AdminEventInstance.tsx::furyToTeamReg()` is the shared
mapper that turns a `FuryRegistrant` into the local `TeamRegistration`
shape. Both the Registrations tab and the Teaming tab use it via the same
`useFuryRegistrations` query (react-query dedupes — one fetch feeds both).
It detects video subtypes on the Fury offering so the 📷 chip shows up
correctly in the Teaming pool.

`lftCount` in `AdminEventInstance` is derived from the raw Fury data, not
from the mapped `registrations` array. Specifically: `registrants.filter(r
=> r.formData.needsTeamUp === 'yes').length`. The previous derivation
counted everyone-not-yet-in-a-Team as LFT, which is always-everyone before
teams are built, so the hero badge ballooned to the whole roster. If you
touch `lftCount`, keep it tied to `formData.needsTeamUp` — the form field
is the source of truth.

---

## 7. Leaderboard event counts

`Through {n} of {TOTAL_EVENTS} scoring events` on both Leaderboard.tsx and
Landing.tsx is derived, never hardcoded:

```ts
TOTAL_EVENTS = EVENT_INSTANCES.filter(e => e.typeSlug !== 'awards' && e.status !== 'season-finale').length
published.length // from localStorage 'sq-results-2026' or Firestore 'results_2026'
```

When you add or remove an event type, the denominators stay correct
automatically — don't reintroduce the literal `2 / 6`.

---

## 8. StatusPill — open-but-external case

`<StatusPill status={evt.status} evt={evt} />` — always pass `evt` when
rendering. When `status === 'open'` but `evt.registrationLabel` is set to a
non-default value ("Event Info" for the Facebook-only Poker Run, etc.), the
pill renders that label with the `pill-upcoming` style instead of the green
`pill-open` "Reg Open" — keeps the badge from over-promising a Fury reg
flow that doesn't exist.

---

## 9. Homepage event order

`Landing.tsx` sorts `EVENT_INSTANCES` chronologically before rendering. The
homepage grid was previously rendering raw array order, which put Dueling
DZs (mock-data Jun) ahead of the August events even though the live Fury
date was October. Don't drop the `.sort((a, b) => a.date.localeCompare(b.date))`.

---

## 10. Christy-isms

- Loose to-dos that aren't tied to a project go to Todoist Inbox.
- Apex is the system of record for project state.
- The Fury ecosystem (Registration, Identity, Coaching, etc.) is Christy's
  business. SkyQuest is a Fury Coaching league, not a Fury product.
- When in doubt, commits and PRs should explain the **why** in the body
  — the project survives by leaving good crumbs for the next session.
