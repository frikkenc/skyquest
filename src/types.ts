export type EventStatus = 'draft' | 'open' | 'closed' | 'complete' | 'upcoming'

export type Division = 'AAA' | 'AA' | 'A' | 'Open' | 'Rookie' | '2-way' | '8-way'

export type EventSlug =
  | 'scsl'
  | 'poker-run'
  | 'dueling-dzs'
  | 'crazy8s'
  | 'ghost-nationals'
  | 'fury-classic-8way'
  | 'awards'

export interface Jumper {
  id: string
  name: string
  uspaNumber?: string
}

export interface EventType {
  slug: EventSlug
  name: string
  shortName: string
  description: string
  format: string
  logo: string
  badgeClass: string
  color: string
}

export interface EventInstance {
  id: string
  typeSlug: EventSlug
  name: string
  date: string          // ISO date
  dropzone: string
  status: EventStatus
  divisions: Division[]
  registrationCount: number
  approvedCount: number
  revenue?: number
  waitlistCount?: number
}

export interface TeamRegistration {
  id: string
  eventId: string
  division: Division
  teamName: string
  members: Jumper[]
  status: 'pending' | 'approved' | 'waitlist' | 'denied'
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  balance: number
  submittedAt: string
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
  total: number
}

export interface LeaderboardEntry {
  rank: number
  teamId: string
  teamName: string
  members: Jumper[]
  division: Division
  totalPoints: number
  eventsAttended: string[]   // eventInstance ids
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
