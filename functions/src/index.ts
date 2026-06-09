import { onCall, HttpsError } from 'firebase-functions/v2/https'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Callable function: suggestTeams
 *
 * Input:  { registrants: {id, name, teammateNote?}[], teamSize: number }
 * Output: { groups: { ids: string[] }[] }
 *
 * Uses claude-haiku-4-5 to fuzzy-match teammate preferences and produce
 * suggested team groups. Costs ~$0.001 per call for ~20 registrants.
 *
 * API key is read from ANTHROPIC_API_KEY environment variable.
 * Set it in functions/.env.fury-identity (gitignored) or via
 * firebase functions:secrets:set ANTHROPIC_API_KEY (requires Blaze + Secret Manager).
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

export const suggestTeams = onCall(
  // `secrets` binds Secret Manager keys into process.env at cold start. Without
  // this, `firebase functions:secrets:set ANTHROPIC_API_KEY` stores the secret
  // but the function instance never sees it, so process.env.ANTHROPIC_API_KEY
  // stays undefined and every call throws "ANTHROPIC_API_KEY is not configured".
  { region: 'us-central1', secrets: ['ANTHROPIC_API_KEY'] },
  async (request) => {
    // Auth required — admin must be signed in
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

    const client = new Anthropic({ apiKey })

    // Compact participant list — each line has id, name, and teammate notes
    const participantList = registrants
      .map((r) => `id="${r.id}" name="${r.name}" wants="${r.teammateNote?.trim() || ''}"`)
      .join('\n')

    const userPrompt =
      `Assign ${registrants.length} skydivers to teams of ~${teamSize} people.\n\n` +
      `PARTICIPANTS:\n${participantList}\n\n` +
      `RULES:\n` +
      `- Read each person's "wants" field — free text naming desired teammates (may use first names, nicknames, or misspellings)\n` +
      `- Fuzzy-match names case-insensitively; group mutual or one-way preferences together\n` +
      `- Everyone must be in exactly one group; groups of 3–5 people are fine\n` +
      `- Return ONLY a JSON array, no explanation, no markdown fences:\n` +
      `  [{"ids":["<id>","<id>"]},{"ids":["<id>","<id>","<id>"]}]`

    let rawText = ''
    try {
      const message = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: userPrompt }],
      })
      rawText = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new HttpsError('internal', `Anthropic API error: ${msg}`)
    }

    // Parse the JSON — strip any accidental markdown fences
    let groups: { ids: string[] }[]
    try {
      const clean = rawText.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim()
      groups = JSON.parse(clean)
    } catch {
      // Try extracting the first [...] block
      const match = rawText.match(/\[[\s\S]*\]/)
      if (!match) {
        throw new HttpsError('internal', `AI returned unparseable response: ${rawText.slice(0, 120)}`)
      }
      try {
        groups = JSON.parse(match[0])
      } catch {
        throw new HttpsError('internal', `AI returned invalid JSON: ${match[0].slice(0, 120)}`)
      }
    }

    if (!Array.isArray(groups)) {
      throw new HttpsError('internal', 'AI response was not a JSON array')
    }

    // Validate: keep only IDs that actually exist in the registrant list
    const validIds = new Set(registrants.map((r) => r.id))
    groups = groups
      .map((g) => ({
        ids: Array.isArray(g.ids) ? g.ids.filter((id: unknown) => typeof id === 'string' && validIds.has(id)) : [],
      }))
      .filter((g) => g.ids.length > 0)

    // Guarantee everyone is assigned — put stragglers into existing groups
    const assigned = new Set(groups.flatMap((g) => g.ids))
    const unassigned = registrants.filter((r) => !assigned.has(r.id)).map((r) => r.id)
    for (let i = 0; i < unassigned.length; i++) {
      if (groups.length === 0) {
        groups.push({ ids: [] })
      }
      groups[i % groups.length].ids.push(unassigned[i])
    }

    return { groups }
  }
)
