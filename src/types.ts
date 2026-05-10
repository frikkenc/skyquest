export type EventStatus = 'draft' | 'open' | 'closed' | 'complete' | 'upcoming' | 'season-finale'

export type Division = 'AAA' | 'AA' | 'A' | 'Open' | 'Rookie' | '2-way' | '8-way'

export type EventSlug =
  | 'scsl'
  | 'poker-run'
  | 'dueling-dzs'
  | 'crazy8s'
  | 'ghost-nationals'
  | 'fury-classic-8way'
  | 'awards'

export type ScoringType = 'rounds' | 'poker' | 'crazy8s' | 'none'

export interface Jumper {
  id: string
  name: string
  uspaNumber?: string
}

export interface TeamMember {
  id: string
  name: string
  uspaNumber?: string
  isSoft?: boolean       // said they're coming but hasn't registered yet
  isAlternate?: boolean  // takes turns in a slot (overfull team)
  isVideo?: boolean      // video person role
}

export interface EventType {
  slug: EventSlug
  name: string
  shortName: string
  description: string
  longDescription: string
  format: string
  logo: string
  badgeClass: string
  color: string
}

export type RegistrationMethod = 'fury' | 'manual'

export interface EventTypeSettings {
  typeSlug: EventSlug
  defaultTeamSize: number
  minTeamSize: number
  hasVideoSlot: boolean
  scoringType: ScoringType
  registrationMethod: RegistrationMethod  // fury = via Fury Reg; manual = names entered by hand
}

export interface EventInstance {
  id: string
  typeSlug: EventSlug
  name: string
  date: string
  dropzone: string
  status: EventStatus
  divisions: Division[]
  registrationCount: number
  approvedCount: number
  revenue?: number
  waitlistCount?: number
  pendingBalance?: number
  furyEventId?: string
  furyRegistrationUrl?: string
  registrationLabel?: string      // custom button label; defaults to 'Sign Up'
  registrationDeadline?: string   // ISO date, e.g. '2026-08-08'
  shortTagline?: string           // 6–10 words for card/schedule views
  oneLiner?: string               // 1–2 sentences for meta and detail pages
  contactEmail?: string           // for manual-registration events
  lookingForTeamCount?: number
  teamsNotFullCount?: number
}

export type OfferingType = 'jumper' | 'video' | 'captain'

export interface TeamRegistration {
  id: string
  eventId: string
  division: Division
  teamName: string
  offeringType?: OfferingType   // role they registered as in Fury (default: jumper)
  members: TeamMember[]
  teammateNote?: string   // free-text "who's on your team" from registration form
  status: 'pending' | 'approved' | 'waitlist' | 'denied' | 'unmatched'
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  balance: number
  submittedAt: string
  teamAssignmentId?: string
}

export interface TeamAssignment {
  id: string
  eventId: string
  division?: Division
  teamName?: string
  memberIds: string[]          // TeamRegistration ids
  videoPersonId?: string       // TeamRegistration id
  alternateIds?: string[]      // TeamRegistration ids
  isConfirmed: boolean
  confirmedAt?: string
  confirmationEmailSentAt?: string
}

export interface ScoreEntry {
  teamId: string
  roundNumber: number
  score: number
}

export interface TeamResult {
  rank: number
  teamId: string
  teamName: string
  members: Jumper[]
  division: Division
  roundScores: number[]
  roundBusts?: number[]   // parallel array: busts[i] reduces raw points to net; total = sum(roundScores)
  total: number
}

export interface LeaderboardEntry {
  rank: number
  teamId: string
  teamName: string
  members: Jumper[]
  division: Division
  totalPoints: number
  eventsAttended: string[]
  bestFinishRank?: number
  bestFinishEvent?: string
}

export interface SeasonKPIs {
  totalRevenue: number
  registrations: number
  uniqueJumpers: number
  eventsRun: number
  eventsTotal: number
  pendingBalance: number
}

export interface ApprovalQueueItem {
  id: string
  eventId: string
  eventName: string
  eventTypeSlug: EventSlug
  teamName: string
  members: string[]
  division: Division
  submittedAt: string
}

export interface PendingRefund {
  id: string
  teamName: string
  eventName: string
  amount: number
  reason: string
}

// ── Season Setup ──────────────────────────────────────────────────────────────

export interface SeasonEventConfig {
  eventTypeSlug: EventSlug
  instanceId?: string           // links to EventInstance once created
  tentativeDate?: string        // ISO date
  dropzone?: string
  furyEventId?: string
  furyRegistrationUrl?: string
  registrationOpenDate?: string
  registrationCloseDate?: string
  notes?: string
}

export interface Season {
  id: string
  name: string
  year: number
  isActive: boolean
  events: SeasonEventConfig[]
}

// ── Leaderboard publishing ─────────────────────────────────────────────────────

export interface PublishedTeamResult {
  rank: number
  teamId: string
  teamName: string
  members: { id: string; name: string }[]
  division: Division
  rawScore: number
  jpp?: number | null
  rankingPoints: number
}

export interface PublishedEventResult {
  instanceId: string
  eventName: string
  date: string
  teams: PublishedTeamResult[]
}

export interface IndividualStanding {
  rank: number
  jumperId: string
  name: string
  division: Division
  eventScores: {
    instanceId: string
    eventName: string
    points: number
    teamName: string
  }[]
  droppedEventId?: string
  totalPoints: number
}

export interface GalaAward {
  id: string
  category: string
  winner: string
  notes?: string
  isPublished: boolean
}

// ── Email scheduling ───────────────────────────────────────────────────────────

export type EmailScheduleStatus = 'draft' | 'test-sent' | 'approved' | 'scheduled' | 'sent' | 'failed'

export interface ScheduledEmail {
  id: string
  templateId: string
  templateName: string
  subject: string
  scope: string
  eventId?: string
  scheduledFor: string        // ISO datetime
  status: EmailScheduleStatus
  testSentAt?: string
  approvedAt?: string
  sentAt?: string
  recipientCount?: number
}
