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

    const participantList = registrants
      .map((r) => `  - id="${r.id}" name="${r.name}" wants="${r.teammateNote?.trim() || '(no preference)'}"`)
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
    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      })
      rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new HttpsError('internal', `Anthropic API error: ${msg}`)
    }

    // Strip any accidental markdown fences before parsing.
    const cleanJson = (() => {
      const stripped = rawText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
      if (stripped.startsWith('{')) return stripped
      // Try extracting the first {...} block as a fallback.
      const match = rawText.match(/\{[\s\S]*\}/)
      return match ? match[0] : stripped
    })()

    let parsed: AiResponse
    try {
      parsed = JSON.parse(cleanJson) as AiResponse
    } catch {
      throw new HttpsError('internal', `AI returned unparseable response: ${rawText.slice(0, 160)}`)
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
