import { onCall, HttpsError } from 'firebase-functions/v2/https'
// IMPORTANT: do NOT import @anthropic-ai/sdk at the top level. Pulling it in
// (and its transitive deps) blows past the 10s module-load window Firebase
// Functions uses to read backend specs, and deploy fails with "User code
// failed to load. Cannot determine backend specification. Timeout after
// 10000." Lazy-imported inside the handler instead.

/**
 * Callable function: suggestTeams
 *
 * The job is NOT to pack everyone into teamSize-sized chunks. The job is to
 * read each registrant's "wants" note, fuzzy-resolve names against the
 * registrant roster, then build teams ONLY from mutual / consistent
 * preferences. People who didn't name anyone, or whose preferences conflict,
 * stay in the pool until a human decides. Wanted teammates who aren't
 * registered show up as `pendingNames` so the captain can see "Jack hasn't
 * signed up yet" rather than the system silently swapping in a stranger.
 *
 * Input:
 *   { registrants: {id, name, teammateNote?}[], teamSize: number }
 *
 * Output:
 *   {
 *     groups: [{ confirmedIds: string[], pendingNames: string[], reasoning: string }],
 *     unassigned: string[],              // registrant ids that stay in the pool
 *     conflicts: [{ description: string, involvedIds: string[] }]
 *   }
 *
 * Uses claude-haiku-4-5. ~$0.001 per call for ~20 registrants.
 *
 * Configure ANTHROPIC_API_KEY via `firebase functions:secrets:set ANTHROPIC_API_KEY`.
 */

interface Registrant {
  id: string
  name: string
  teammateNote?: string
}

interface SuggestTeamsRequest {
  registrants: Registrant[]
  teamSize: number
}

interface AiGroup {
  confirmedIds: string[]
  pendingNames: string[]
  reasoning: string
}

interface AiConflict {
  description: string
  involvedIds: string[]
}

interface AiResponse {
  groups: AiGroup[]
  unassigned: string[]
  conflicts: AiConflict[]
}

export const suggestTeams = onCall(
  // `secrets` binds Secret Manager keys into process.env at cold start. Without
  // this, `firebase functions:secrets:set ANTHROPIC_API_KEY` stores the secret
  // but the function instance never sees it, so process.env.ANTHROPIC_API_KEY
  // stays undefined and every call throws "ANTHROPIC_API_KEY is not configured".
  { region: 'us-central1', secrets: ['ANTHROPIC_API_KEY'] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in to use AI suggestions')
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new HttpsError('internal', 'ANTHROPIC_API_KEY is not configured on the server')
    }

    const { registrants, teamSize } = request.data as SuggestTeamsRequest

    if (!Array.isArray(registrants) || registrants.length === 0) {
      throw new HttpsError('invalid-argument', 'No registrants provided')
    }

    // Lazy-load — see comment at top of file.
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })

    // Short aliases instead of the 36-char Fury UUIDs. Every id is echoed back
    // in the JSON, so with a real roster the UUIDs alone ran the reply past
    // max_tokens and it came back cut off mid-array ("unparseable response").
    // Short ids are also far harder for the model to garble.
    const aliasToId = new Map<string, string>()
    const idToAlias = new Map<string, string>()
    registrants.forEach((r, i) => {
      aliasToId.set(`p${i + 1}`, r.id)
      idToAlias.set(r.id, `p${i + 1}`)
    })

    const participantList = registrants
      .map((r) => `  - id="${idToAlias.get(r.id)}" name="${r.name}" wants="${r.teammateNote?.trim() || '(no preference)'}"`)
      .join('\n')

    const systemPrompt =
      `You group skydivers into competition teams based ONLY on who they said they want to fly with. ` +
      `You do NOT randomly pack everyone into teams. People who didn't name anyone, ` +
      `or whose stated preferences conflict, are left in the pool for the captain to decide.`

    const userPrompt =
      `Target team size: ${teamSize} jumpers per team (but smaller teams are fine — never pad with strangers).\n\n` +
      `PARTICIPANTS:\n${participantList}\n\n` +
      `HOW TO BUILD TEAMS:\n` +
      `1. Read each person's "wants" — free text naming desired teammates. Names may be first-only, ` +
      `   nicknames, misspellings, or last-name-only. Normalize and fuzzy-match against the participant list.\n` +
      `2. Form a team when there is CLEAR mutual or chained intent. Examples:\n` +
      `   - A wants B, and B wants A → {A, B} is a team (size 2, leave open slots).\n` +
      `   - A wants {B, C}, B wants {A, C}, C wants {A, B} → {A, B, C}.\n` +
      `   - A wants B, B wants A, B wants C, C wants B → {A, B, C} (chained).\n` +
      `3. NEVER add a person to a team they didn't ask for and who didn't ask for them. ` +
      `   That includes people who said "(no preference)" — they stay in the pool.\n` +
      `4. If a wanted teammate isn't in the participant list (e.g. "Bobbie B." with no matching id), ` +
      `   add their name to that team's pendingNames so the captain knows who's missing.\n` +
      `5. NEVER pad a team to teamSize with strangers. A team of 3 with one open slot is fine.\n\n` +
      `CONFLICTS — surface as a decision point, do NOT silently pick:\n` +
      `- Two mutual partners disagree on the third teammate. ` +
      `  e.g. "Joe wants {Jack, Jill}, Jill wants {Joe, Max}" → Joe-Jill team but Jack vs Max conflict.\n` +
      `- One person is wanted by two different consistent clusters that can't merge.\n` +
      `- A says they're with B, but B's wants don't include A at all and B is firmly in another cluster.\n` +
      `For each conflict, name the people involved and describe the choice in one short sentence.\n\n` +
      `OUTPUT — return ONLY this JSON shape, no prose, no markdown fences:\n` +
      `{\n` +
      `  "groups": [\n` +
      `    {\n` +
      `      "confirmedIds": ["<id>", "<id>"],\n` +
      `      "pendingNames": ["<name not in roster>"],\n` +
      `      "reasoning": "one short sentence — who matched whom and why"\n` +
      `    }\n` +
      `  ],\n` +
      `  "unassigned": ["<id of registrant left in the pool>"],\n` +
      `  "conflicts": [\n` +
      `    {\n` +
      `      "description": "Joe wants {Jack, Jill}; Jill wants {Joe, Max}. Pick a third teammate for Joe & Jill.",\n` +
      `      "involvedIds": ["<id of Joe>", "<id of Jill>"]\n` +
      `    }\n` +
      `  ]\n` +
      `}\n` +
      `Every id you emit must come from the PARTICIPANTS list above.`

    let rawText = ''
    let stopReason: string | null = null
    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })
      rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
      stopReason = message.stop_reason
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new HttpsError('internal', `Anthropic API error: ${msg}`)
    }
    if (stopReason === 'max_tokens') {
      throw new HttpsError('internal', `AI reply was cut off (roster of ${registrants.length} too long) — try again or team up a few by hand first`)
    }

    // The model sometimes wraps the JSON in markdown fences and/or appends
    // prose after the closing fence. Try candidates from most to least
    // specific: fenced block contents → first {...} block → raw text.
    const candidates: string[] = []
    const fenced = rawText.match(/```[a-z]*\s*([\s\S]*?)```/i)
    if (fenced) candidates.push(fenced[1].trim())
    const braced = rawText.match(/\{[\s\S]*\}/)
    if (braced) candidates.push(braced[0])
    candidates.push(rawText)

    let parsed: AiResponse | null = null
    for (const candidate of candidates) {
      try {
        parsed = JSON.parse(candidate) as AiResponse
        break
      } catch {
        // try the next candidate
      }
    }
    if (!parsed) {
      throw new HttpsError('internal', `AI returned unparseable response: ${rawText.slice(0, 160)}`)
    }

    // Map aliases back to real registration ids. Anything unrecognized becomes
    // '' and is dropped by the validation below.
    const unalias = (v: unknown) => (typeof v === 'string' ? aliasToId.get(v.trim()) ?? '' : '')
    if (Array.isArray(parsed.groups)) {
      parsed.groups.forEach((g) => { if (Array.isArray(g?.confirmedIds)) g.confirmedIds = g.confirmedIds.map(unalias) })
    }
    if (Array.isArray(parsed.conflicts)) {
      parsed.conflicts.forEach((c) => { if (Array.isArray(c?.involvedIds)) c.involvedIds = c.involvedIds.map(unalias) })
    }

    // Validate + scrub: drop any IDs that aren't in the registrant list, dedupe,
    // and reconcile the unassigned list with what's actually unassigned after
    // groups are formed (Claude sometimes forgets to add stragglers).
    const validIds = new Set(registrants.map((r) => r.id))
    const seenInGroups = new Set<string>()

    const groups: AiGroup[] = (Array.isArray(parsed.groups) ? parsed.groups : [])
      .map((g) => {
        const ids = (Array.isArray(g?.confirmedIds) ? g.confirmedIds : [])
          .filter((id: unknown): id is string => typeof id === 'string' && validIds.has(id) && !seenInGroups.has(id))
        ids.forEach((id) => seenInGroups.add(id))
        const pendingNames = (Array.isArray(g?.pendingNames) ? g.pendingNames : [])
          .filter((n: unknown): n is string => typeof n === 'string' && n.trim().length > 0)
          .map((n) => n.trim())
        return {
          confirmedIds: ids,
          pendingNames,
          reasoning: typeof g?.reasoning === 'string' ? g.reasoning : '',
        }
      })
      // Drop empty groups (Claude sometimes emits a stub).
      .filter((g) => g.confirmedIds.length > 0)

    // Recompute unassigned authoritatively: anyone not placed in a group.
    const unassigned = registrants
      .map((r) => r.id)
      .filter((id) => !seenInGroups.has(id))

    const conflicts: AiConflict[] = (Array.isArray(parsed.conflicts) ? parsed.conflicts : [])
      .map((c) => ({
        description: typeof c?.description === 'string' ? c.description : '',
        involvedIds: (Array.isArray(c?.involvedIds) ? c.involvedIds : [])
          .filter((id: unknown): id is string => typeof id === 'string' && validIds.has(id)),
      }))
      .filter((c) => c.description.length > 0)

    return { groups, unassigned, conflicts }
  }
)

/**
 * Callable function: notifySignup
 *
 * "Notify me when reg opens" email capture, proxied server-side. The modal
 * used to POST straight to api.brevo.com with a VITE_BREVO_API_KEY baked into
 * the public JS bundle — Brevo detects exposed keys and disables them ("API
 * Key is not enabled"), which broke the modal for every visitor. Any key
 * shipped to the browser will eventually meet the same fate, so the key now
 * lives only here.
 *
 * Deliberately NO auth check: this is anonymous email capture from the
 * marketing site. Input is validated and the only thing a caller can do is
 * add an email to the notify list — same power the public form always had.
 *
 * Configure via `firebase functions:secrets:set BREVO_API_KEY` (generate a
 * NEW key in Brevo — the leaked one is dead and should stay dead).
 */

// Brevo list the site's notify-me signups land in (was VITE_BREVO_LIST_ID).
const BREVO_NOTIFY_LIST_ID = 46

export const notifySignup = onCall(
  { region: 'us-central1', secrets: ['BREVO_API_KEY'] },
  async (request) => {
    const { email, eventName } = (request.data ?? {}) as { email?: unknown; eventName?: unknown }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      throw new HttpsError('invalid-argument', 'A valid email is required')
    }
    if (typeof eventName !== 'string' || eventName.trim().length === 0 || eventName.length > 200) {
      throw new HttpsError('invalid-argument', 'eventName is required')
    }

    const apiKey = process.env.BREVO_API_KEY
    if (!apiKey) {
      throw new HttpsError('internal', 'BREVO_API_KEY is not configured on the server')
    }

    const res = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        listIds: [BREVO_NOTIFY_LIST_ID],
        updateEnabled: true,
        attributes: { SKYQUEST_NOTIFY: eventName.trim() },
      }),
    })

    if (res.ok || res.status === 204) return { ok: true }

    const body = (await res.json().catch(() => null)) as { code?: string; message?: string } | null
    // Contact already exists — they're on the list, that's success.
    if (body?.code === 'DUPLICATE_PARAMETER') return { ok: true }

    console.error('Brevo contact create failed', res.status, body)
    throw new HttpsError('internal', body?.message ?? `Brevo error ${res.status}`)
  }
)

/**
 * Callable function: submitJumpNumbers
 *
 * Public write path for the Dueling DZs handicap (JPP = score × 1000 ÷ team
 * jump total). Jumpers aren't signed in, so they can't write
 * `jumpNumbers/{instanceId}` directly — the rules keep that sign-in only and
 * this function is the narrow door: it can only set a jump count for a
 * person who is actually on the event.
 *
 * Two modes:
 *   { instanceId, email, jumps, regId? }   — self-entry from /jumps/:id.
 *       Email is matched against `teamingPrivate/{instanceId}` (mirrored from
 *       Fury by the admin event page; never public). One email can sit on
 *       more than one registration (a couple sharing an inbox), so with
 *       several matches and no regId it returns the names to pick from
 *       instead of guessing.
 *   { instanceId, teamId, teamJumps[] }    — whole-team entry from /checkin/:id.
 *       teamJumps is in the team's scoring-member order (video person excluded).
 */
const MAX_JUMPS = 50000

function adminDb() {
  // Lazy for the same module-load-window reason as the Anthropic import.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const admin = require('firebase-admin') as typeof import('firebase-admin')
  if (!admin.apps.length) admin.initializeApp()
  return admin.firestore()
}

function validJumps(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= MAX_JUMPS
}

export const submitJumpNumbers = onCall(
  { region: 'us-central1' },
  async (request) => {
    const data = (request.data ?? {}) as Record<string, unknown>
    const instanceId = data.instanceId
    if (typeof instanceId !== 'string' || !/^[\w-]{1,100}$/.test(instanceId)) {
      throw new HttpsError('invalid-argument', 'instanceId is required')
    }

    const db = adminDb()
    const now = new Date().toISOString()
    const jumpRef = db.doc(`jumpNumbers/${instanceId}`)

    // ── Whole team ──
    if (typeof data.teamId === 'string') {
      const teamJumps = data.teamJumps
      if (!Array.isArray(teamJumps) || !teamJumps.every(validJumps)) {
        throw new HttpsError('invalid-argument', `Every jump number must be a whole number from 1 to ${MAX_JUMPS}`)
      }
      const teaming = (await db.doc(`teaming/${instanceId}`).get()).data()
      const groups = (teaming?.groups ?? []) as { id: string; memberIds: string[]; videoMemberId?: string }[]
      const group = groups.find(g => g.id === data.teamId)
      if (!group) throw new HttpsError('not-found', 'That team is not on this event')
      const memberIds = group.memberIds.filter(id => id !== group.videoMemberId)
      if (memberIds.length !== teamJumps.length) {
        throw new HttpsError('failed-precondition', 'The team roster changed — reload the page')
      }
      const byReg: Record<string, unknown> = {}
      memberIds.forEach((id, i) => { byReg[id] = { jumps: teamJumps[i], updatedAt: now, by: 'team' } })
      await jumpRef.set({ byReg }, { merge: true })
      const names = teaming?.memberNames ?? {}
      return { status: 'saved', names: memberIds.map(id => names[id] ?? '') }
    }

    // ── One person, by email ──
    const email = data.email
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254) {
      throw new HttpsError('invalid-argument', 'A valid email is required')
    }
    if (!validJumps(data.jumps)) {
      throw new HttpsError('invalid-argument', `Jump number must be a whole number from 1 to ${MAX_JUMPS}`)
    }
    const priv = (await db.doc(`teamingPrivate/${instanceId}`).get()).data()
    const people = (priv?.people ?? {}) as Record<string, { email: string; name: string }>
    const want = email.trim().toLowerCase()
    const matches = Object.entries(people).filter(([, p]) => p.email === want)
    if (matches.length === 0) {
      throw new HttpsError('not-found', "That email isn't on this event's registration list")
    }
    let regIds = matches.map(([id]) => id)
    if (matches.length > 1) {
      if (typeof data.regId !== 'string') {
        return { status: 'choose', options: matches.map(([regId, p]) => ({ regId, name: p.name })) }
      }
      if (!regIds.includes(data.regId)) throw new HttpsError('invalid-argument', 'Pick one of the listed names')
      regIds = [data.regId]
    }
    await jumpRef.set({ byReg: { [regIds[0]]: { jumps: data.jumps, updatedAt: now, by: 'self' } } }, { merge: true })
    return { status: 'saved', names: [people[regIds[0]].name] }
  }
)
