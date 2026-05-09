import type {
  EventType,
  EventInstance,
  LeaderboardEntry,
  TeamResult,
  TeamRegistration,
  ApprovalQueueItem,
  PendingRefund,
  SeasonKPIs,
} from '../types'

export const EVENT_TYPES: EventType[] = [
  {
    slug: 'scsl',
    name: 'SCSL',
    shortName: 'SCSL',
    description: 'The classic 4-way competition — easier to sign up for, with divisions for all levels.',
    format: '4-way Formation · 8 rounds',
    logo: '/logos/scsl.png',
    badgeClass: 'badge-scsl',
    color: '#1565C0',
  },
  {
    slug: 'poker-run',
    name: 'Poker Run',
    shortName: 'Poker Run',
    description: 'A 6-way meet with a poker hand, a cash pot, and tequila shots. Do it!',
    format: '6-way · Cash pot · Tequila',
    logo: '/logos/dueling-dzs.png',
    badgeClass: 'badge-poker',
    color: '#F28C28',
  },
  {
    slug: 'dueling-dzs',
    name: 'Dueling DZs',
    shortName: 'Dueling DZs',
    description: 'Takeoff at one dropzone, land in the other! Wingsuiter? We\'ve got you.',
    format: '6-way · Head-to-head · Wingsuit options',
    logo: '/logos/dueling-dzs.png',
    badgeClass: 'badge-dueling',
    color: '#D81818',
  },
  {
    slug: 'crazy8s',
    name: "Frikken Crazy 8's",
    shortName: "Crazy 8's",
    description: "Christy Frikken's wild twist — teams craft their own dives and gamble on the combo.",
    format: '8-way · Card draw · Build-your-own dive',
    logo: '/logos/crazy8.png',
    badgeClass: 'badge-crazy8',
    color: '#F5A623',
  },
  {
    slug: 'ghost-nationals',
    name: 'Ghost Nationals',
    shortName: 'Ghost Nats',
    description: 'The most fun dives from US Nationals, re-run for everyone who couldn\'t make it to Eloy.',
    format: '4-way & 8-way · National dive pool',
    logo: '/logos/ghost-nationals.png',
    badgeClass: 'badge-ghost',
    color: '#29B6F6',
  },
  {
    slug: 'fury-classic-8way',
    name: 'Fury Classic 8-way',
    shortName: 'Fury 8-way',
    description: '8-way action with divisions for every skill level, including beginner-friendly.',
    format: '8-way Formation · All levels',
    logo: '/logos/fury-classic-8.png',
    badgeClass: 'badge-fury8',
    color: '#9C27B0',
  },
  {
    slug: 'awards',
    name: 'Awards Show',
    shortName: 'Awards',
    description: 'Season-ending swanky awards night at the Bombshelter. Costumes encouraged.',
    format: 'Live voting · Year-end celebration',
    logo: '',
    badgeClass: 'badge-awards',
    color: '#FDD835',
  },
]

export const EVENT_INSTANCES: EventInstance[] = [
  {
    id: 'scsl-elsinore-spring-2026',
    typeSlug: 'scsl',
    name: 'SCSL @ Elsinore — Spring',
    date: '2026-03-15',
    dropzone: 'Elsinore',
    status: 'complete',
    divisions: ['AAA', 'AA', 'A', 'Rookie'],
    registrationCount: 14,
    approvedCount: 14,
    revenue: 1680,
  },
  {
    id: 'poker-run-elsinore-2026',
    typeSlug: 'poker-run',
    name: 'Poker Run @ Elsinore',
    date: '2026-05-10',
    dropzone: 'Elsinore',
    status: 'open',
    divisions: ['Open', '2-way'],
    registrationCount: 22,
    approvedCount: 18,
    revenue: 1320,
    waitlistCount: 0,
  },
  {
    id: 'dueling-dzs-2026',
    typeSlug: 'dueling-dzs',
    name: 'Dueling DZs — Perris ↔ Elsinore',
    date: '2026-06-21',
    dropzone: 'Perris ↔ Elsinore',
    status: 'upcoming',
    divisions: ['Open', '2-way'],
    registrationCount: 0,
    approvedCount: 0,
  },
  {
    id: 'scsl-perris-late-summer-2026',
    typeSlug: 'scsl',
    name: 'SCSL @ Perris — Late Summer',
    date: '2026-08-16',
    dropzone: 'Perris',
    status: 'upcoming',
    divisions: ['AAA', 'AA', 'A', 'Rookie'],
    registrationCount: 0,
    approvedCount: 0,
  },
  {
    id: 'crazy8s-perris-2026',
    typeSlug: 'crazy8s',
    name: "Frikken Crazy 8's @ Perris",
    date: '2026-09-13',
    dropzone: 'Perris',
    status: 'upcoming',
    divisions: ['Open'],
    registrationCount: 0,
    approvedCount: 0,
  },
  {
    id: 'ghost-nationals-perris-2026',
    typeSlug: 'ghost-nationals',
    name: 'Ghost Nationals @ Perris',
    date: '2026-10-25',
    dropzone: 'Perris',
    status: 'upcoming',
    divisions: ['AAA', 'AA', 'A'],
    registrationCount: 0,
    approvedCount: 0,
  },
  {
    id: 'awards-show-2026',
    typeSlug: 'awards',
    name: 'Awards Show @ The Bombshelter',
    date: '2026-11-15',
    dropzone: 'The Bombshelter',
    status: 'upcoming',
    divisions: [],
    registrationCount: 0,
    approvedCount: 0,
  },
]

export const LEADERBOARD_AAA: LeaderboardEntry[] = [
  { rank: 1, teamId: 't1', teamName: 'Cheated Donuts', members: [{ id: 'j1', name: 'Christina R.' }, { id: 'j2', name: 'Seth J.' }, { id: 'j3', name: 'Kayla N.' }, { id: 'j4', name: 'Thao N.' }], division: 'AAA', totalPoints: 428, eventsAttended: ['scsl-elsinore-spring-2026', 'poker-run-elsinore-2026'], bestFinishRank: 1, bestFinishEvent: 'SCSL Elsinore' },
  { rank: 2, teamId: 't2', teamName: 'Probably Fine', members: [{ id: 'j5', name: 'Grace K.' }, { id: 'j6', name: 'David S.' }, { id: 'j7', name: 'Alex S.' }, { id: 'j8', name: 'Danny K.' }], division: 'AAA', totalPoints: 390, eventsAttended: ['scsl-elsinore-spring-2026', 'poker-run-elsinore-2026'], bestFinishRank: 1, bestFinishEvent: 'Poker Run' },
  { rank: 3, teamId: 't3', teamName: 'Perris Bits', members: [{ id: 'j9', name: 'Jeff H.' }, { id: 'j10', name: 'Anderson B.' }, { id: 'j11', name: 'Khan G.' }, { id: 'j12', name: 'Sam Y.' }], division: 'AAA', totalPoints: 372, eventsAttended: ['scsl-elsinore-spring-2026'], bestFinishRank: 2, bestFinishEvent: 'SCSL Elsinore' },
  { rank: 4, teamId: 't4', teamName: 'Camel Case', members: [{ id: 'j13', name: 'Alex S.' }, { id: 'j14', name: 'Rob R.' }, { id: 'j15', name: 'Jeff H.' }, { id: 'j16', name: 'Rosemary B.' }], division: 'AAA', totalPoints: 340, eventsAttended: ['scsl-elsinore-spring-2026'], bestFinishRank: 3, bestFinishEvent: 'SCSL Elsinore' },
  { rank: 5, teamId: 't5', teamName: 'Balagan', members: [{ id: 'j17', name: 'Dror A.' }, { id: 'j18', name: 'Agustin S.' }, { id: 'j19', name: 'Jay R.' }, { id: 'j20', name: 'Nathan C.' }], division: 'AAA', totalPoints: 312, eventsAttended: ['scsl-elsinore-spring-2026'], bestFinishRank: 4, bestFinishEvent: 'SCSL Elsinore' },
  { rank: 6, teamId: 't6', teamName: 'Night Crew', members: [{ id: 'j21', name: 'Heather A.' }, { id: 'j22', name: 'Khan G.' }, { id: 'j23', name: 'Yvonne O.' }, { id: 'j24', name: 'Sam Ab.' }], division: 'AAA', totalPoints: 280, eventsAttended: ['poker-run-elsinore-2026'], bestFinishRank: 2, bestFinishEvent: 'Poker Run' },
]

export const LEADERBOARD_AA: LeaderboardEntry[] = [
  { rank: 1, teamId: 't7', teamName: 'Static Line', members: [{ id: 'j25', name: 'Cathy C.' }, { id: 'j26', name: 'Tara Y.' }, { id: 'j27', name: 'Lisa W.' }, { id: 'j28', name: 'Alicia P.' }], division: 'AA', totalPoints: 360, eventsAttended: ['scsl-elsinore-spring-2026'], bestFinishRank: 1, bestFinishEvent: 'SCSL Elsinore' },
  { rank: 2, teamId: 't8', teamName: 'Generation Gap', members: [{ id: 'j29', name: 'Tessa G.' }, { id: 'j30', name: 'Janelle S.' }, { id: 'j31', name: 'Carol S.' }, { id: 'j32', name: 'Ron S.' }], division: 'AA', totalPoints: 290, eventsAttended: ['scsl-elsinore-spring-2026'], bestFinishRank: 2, bestFinishEvent: 'SCSL Elsinore' },
  { rank: 3, teamId: 't9', teamName: 'Sun Kissed Spinners', members: [{ id: 'j33', name: 'Cody M.' }, { id: 'j34', name: 'Christopher M.' }, { id: 'j35', name: 'Chuck R.' }, { id: 'j36', name: 'Mike T.' }], division: 'AA', totalPoints: 240, eventsAttended: ['scsl-elsinore-spring-2026'], bestFinishRank: 3, bestFinishEvent: 'SCSL Elsinore' },
]

export const SCSL_RESULTS: TeamResult[] = [
  { rank: 1, teamId: 't1', teamName: 'Cheated Donuts', members: [{ id: 'j1', name: 'Christina R.' }, { id: 'j2', name: 'Seth J.' }, { id: 'j3', name: 'Kayla N.' }, { id: 'j4', name: 'Thao N.' }], division: 'AA', roundScores: [9, 8, 10, 9, 9, 10, 8, 9], total: 72 },
  { rank: 2, teamId: 't2', teamName: 'Probably Fine', members: [{ id: 'j5', name: 'Grace K.' }, { id: 'j6', name: 'David S.' }, { id: 'j7', name: 'Alex S.' }, { id: 'j8', name: 'Danny K.' }], division: 'AA', roundScores: [8, 9, 8, 10, 8, 9, 9, 7], total: 68 },
  { rank: 3, teamId: 't3', teamName: 'Perris Bits', members: [{ id: 'j9', name: 'Jeff H.' }, { id: 'j10', name: 'Anderson B.' }, { id: 'j11', name: 'Khan G.' }, { id: 'j12', name: 'Sam Y.' }], division: 'AA', roundScores: [7, 8, 8, 8, 9, 8, 8, 8], total: 64 },
  { rank: 4, teamId: 't4', teamName: 'Camel Case', members: [{ id: 'j13', name: 'Alex S.' }, { id: 'j14', name: 'Rob R.' }, { id: 'j15', name: 'Jeff H.' }, { id: 'j16', name: 'Rosemary B.' }], division: 'AA', roundScores: [7, 7, 8, 7, 8, 8, 7, 8], total: 60 },
  { rank: 5, teamId: 't5', teamName: 'Balagan', members: [{ id: 'j17', name: 'Dror A.' }, { id: 'j18', name: 'Agustin S.' }, { id: 'j19', name: 'Jay R.' }, { id: 'j20', name: 'Nathan C.' }], division: 'AA', roundScores: [6, 7, 7, 8, 7, 7, 6, 8], total: 56 },
]

export const APPROVAL_QUEUE: ApprovalQueueItem[] = [
  { id: 'aq-1', eventId: 'poker-run-elsinore-2026', eventName: 'Poker Run', eventTypeSlug: 'poker-run', teamName: 'The Usual Suspects', members: ['Jordan Lee', 'Sam Park', 'Avery Hall', 'Casey Liu'], division: 'AA', submittedAt: '2026-05-08T09:46:00Z' },
  { id: 'aq-2', eventId: 'poker-run-elsinore-2026', eventName: 'Poker Run', eventTypeSlug: 'poker-run', teamName: 'Probably Fine', members: ['Morgan Kane', 'River Shaw', 'Quinn Wright', 'Drew Ellis'], division: 'A', submittedAt: '2026-05-08T09:29:00Z' },
  { id: 'aq-3', eventId: 'scsl-elsinore-spring-2026', eventName: 'SCSL', eventTypeSlug: 'scsl', teamName: 'New Kids on the DZ', members: ['Taylor Moore', 'Chris Vega', 'Jamie North', 'Robin Tran'], division: 'A', submittedAt: '2026-05-08T08:00:00Z' },
  { id: 'aq-4', eventId: 'scsl-elsinore-spring-2026', eventName: 'SCSL', eventTypeSlug: 'scsl', teamName: 'Crossfire', members: ['Dana Cole', 'Jesse Park', 'Sam Quinn', 'Alex Ruiz'], division: 'AAA', submittedAt: '2026-05-08T07:00:00Z' },
]

export const PENDING_REFUNDS: PendingRefund[] = [
  { id: 'ref-1', teamName: 'Night Crew', eventName: 'SCSL @ Elsinore Spring', amount: 120, reason: 'Cancelled' },
  { id: 'ref-2', teamName: 'Static Line', eventName: 'Poker Run', amount: 60, reason: 'Partial refund requested' },
]

export const SEASON_KPIS: SeasonKPIs = {
  totalRevenue: 8460,
  registrations: 94,
  uniqueJumpers: 211,
  eventsRun: 2,
  eventsTotal: 6,
  pendingBalance: 380,
}

export const REGISTRATIONS: TeamRegistration[] = [
  { id: 'reg-1', eventId: 'poker-run-elsinore-2026', division: 'AA', teamName: 'The Usual Suspects', members: [{ id: 'j1', name: 'Jordan Lee' }, { id: 'j2', name: 'Sam Park' }, { id: 'j3', name: 'Avery Hall' }, { id: 'j4', name: 'Casey Liu' }], status: 'pending', paymentStatus: 'unpaid', balance: 120, submittedAt: '2026-05-08T09:46:00Z' },
  { id: 'reg-2', eventId: 'poker-run-elsinore-2026', division: 'A', teamName: 'Probably Fine', members: [{ id: 'j5', name: 'Morgan Kane' }, { id: 'j6', name: 'River Shaw' }, { id: 'j7', name: 'Quinn Wright' }, { id: 'j8', name: 'Drew Ellis' }], status: 'pending', paymentStatus: 'unpaid', balance: 120, submittedAt: '2026-05-08T09:29:00Z' },
  { id: 'reg-3', eventId: 'poker-run-elsinore-2026', division: 'AA', teamName: 'Cheated Donuts', members: [{ id: 'j9', name: 'Christina R.' }, { id: 'j10', name: 'Seth J.' }, { id: 'j11', name: 'Kayla N.' }, { id: 'j12', name: 'Thao N.' }], status: 'approved', paymentStatus: 'paid', balance: 0, submittedAt: '2026-05-01T10:00:00Z' },
  { id: 'reg-4', eventId: 'poker-run-elsinore-2026', division: 'AAA', teamName: 'Balagan', members: [{ id: 'j13', name: 'Dror A.' }, { id: 'j14', name: 'Agustin S.' }, { id: 'j15', name: 'Jay R.' }, { id: 'j16', name: 'Nathan C.' }], status: 'approved', paymentStatus: 'partial', balance: 60, submittedAt: '2026-05-02T09:00:00Z' },
]
