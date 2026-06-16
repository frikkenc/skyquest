import type {
  EventType,
  EventTypeSettings,
  EventInstance,
  TeamResult,
} from '../types'

export const EVENT_TYPES: EventType[] = [
  {
    slug: 'scsl',
    name: 'SCSL',
    shortName: 'SCSL',
    description: 'The classic 4-way competition — easier to sign up for, with divisions for all levels.',
    longDescription: 'Standard 4-way formation skydiving competition with real judging, real divisions, and real medals. Great for pickup teams, first-time competitors, and teams training toward US Nationals. Register solo and we\'ll do our best to place you with a team — the sooner you register, the better your chances. Eight rounds, divisions from Rookie through AAA. The series runs twice in 2026 — Elsinore in March, Perris in August — and both events count toward the season leaderboard.',
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
    longDescription: 'Every jumper in your 6-way team draws a card on exit. After all rounds, flip your hand — best poker combo takes the cash pot. Part skydiving meet, part Vegas night, all ridiculous. No experience level requirement beyond safe skydiving skills. Tequila shots happen on the ground (obviously). Open division, so any team composition goes. It counts toward your SkyQuest season points just like any other meet.',
    format: '6-way · Cash pot · Tequila shots',
    logo: '/logos/dueling-dzs.png',
    badgeClass: 'badge-poker',
    color: '#F28C28',
  },
  {
    slug: 'dueling-dzs',
    name: 'Dueling DZs',
    shortName: 'Dueling DZs',
    description: 'Four rounds of 6-way between two dropzones — leave one, land the other, board up, go back. Canyon Lake after.',
    longDescription: 'This one actually works the way it sounds. Your team exits over the gap between Elsinore and Perris, flies the round, and touches down at the other dropzone. Board the plane right there. Go back. Repeat four times — no shuttles, no ground crew, just four rounds of back-and-forth with a view you don\'t get anywhere else. After the final round, everyone converges on Canyon Lake for awards, appetizers, and the kind of mixing that only happens when two dropzone communities spend a day sharing the same sky. Think of it as a mini inhop. Open division.',
    format: '6-way · Cross-DZ · 4 rounds',
    logo: '/logos/dueling-dzs.png',
    badgeClass: 'badge-dueling',
    color: '#D81818',
  },
  {
    slug: 'crazy8s',
    name: "Frikken Crazy 8's",
    shortName: "Crazy 8's",
    description: "Christy Frikken's wild twist — teams craft their own dives and gamble on the combo.",
    longDescription: "Christy Frikken's signature event. Eight-way teams design their own formation sequences, then before the round they gamble which combos will score. You're not just flying — you're engineering your own scoring system under pressure. Flying skill matters, but so does tactical thinking. One well-timed gamble can leapfrog the field; one busted formation can erase your lead. Open division, Open chaos.",
    format: '8-way · Build-your-own dive · Combo gamble',
    logo: '/logos/crazy8.png',
    badgeClass: 'badge-crazy8',
    color: '#F5A623',
  },
  {
    slug: 'ghost-nationals',
    name: 'Ghost Nationals',
    shortName: 'Ghost Nats',
    description: 'Part of the previous USPA Nationals draw, run locally — great for a redo, a first meet, or building a team for next season.',
    longDescription: "USPA Nationals moves around every year — most people can't make it. Ghost Nationals runs part of the previous year's Nationals draw at Skydive Perris, so you can fly the same sequences without the travel. Great for teams wanting a redo after Nationals, beginners looking to sample a friendly meet, and flyers who want to test or build a team heading into next season. Runs 4-way and 8-way with A / AA / AAA divisions.",
    format: '4-way & 8-way · National dive pool · A / AA / AAA',
    logo: '/logos/ghost-nationals.png',
    badgeClass: 'badge-ghost',
    color: '#29B6F6',
  },
  {
    slug: 'fury-classic-8way',
    name: 'Fury Classic 8-way',
    shortName: 'Fury 8-way',
    description: '8-way action with divisions for every skill level, including beginner-friendly.',
    longDescription: 'The classic Fury big-way event, now a SkyQuest scoring meet. Eight-way formation skydiving with divisions for every level — including a beginner bracket for teams doing their first 8-way competition. Runs alongside the Crazy 8s weekend at Perris, so you can fly both if you\'re ambitious. Counts toward the season leaderboard just like any other event.',
    format: '8-way Formation · All levels · Multiple divisions',
    logo: '/logos/fury-classic-8.png',
    badgeClass: 'badge-fury8',
    color: '#9C27B0',
  },
  {
    slug: 'awards',
    name: 'Awards Show',
    shortName: 'Awards',
    description: 'Season-ending awards evening at the Bombshelter — same day as Ghost Nationals. Fancy dress optional.',
    longDescription: "Ghost Nationals wraps, then everyone heads to the Bombshelter for the season close. Year-end trophies, divisional medals, most creative team name, most epic fail — and live voting on a few categories. Free and open to anyone who jumped in the league or just wants to celebrate the season. Fancy dress optional.",
    format: 'Live awards · Open to all · Free',
    logo: '',
    badgeClass: 'badge-awards',
    color: '#FDD835',
  },
]

export const EVENT_TYPE_SETTINGS: EventTypeSettings[] = [
  { typeSlug: 'scsl',              defaultTeamSize: 4, minTeamSize: 4, hasVideoSlot: true,  scoringType: 'rounds',  registrationMethod: 'fury',   hasDivisions: true  },
  { typeSlug: 'poker-run',         defaultTeamSize: 6, minTeamSize: 4, hasVideoSlot: true,  scoringType: 'poker',   registrationMethod: 'manual', hasDivisions: false },
  { typeSlug: 'dueling-dzs',       defaultTeamSize: 6, minTeamSize: 4, hasVideoSlot: true,  scoringType: 'rounds',  registrationMethod: 'fury',   hasDivisions: false },
  { typeSlug: 'crazy8s',           defaultTeamSize: 8, minTeamSize: 8, hasVideoSlot: true,  scoringType: 'crazy8s', registrationMethod: 'fury',   hasDivisions: false },
  { typeSlug: 'ghost-nationals',   defaultTeamSize: 4, minTeamSize: 4, hasVideoSlot: true,  scoringType: 'rounds',  registrationMethod: 'fury',   hasDivisions: true  },
  { typeSlug: 'fury-classic-8way', defaultTeamSize: 8, minTeamSize: 8, hasVideoSlot: true,  scoringType: 'rounds',  registrationMethod: 'fury',   hasDivisions: false },
  { typeSlug: 'awards',            defaultTeamSize: 1, minTeamSize: 1, hasVideoSlot: false, scoringType: 'none',    registrationMethod: 'manual', hasDivisions: false },
]

export const EVENT_INSTANCES: EventInstance[] = [
  {
    id: 'scsl-elsinore-spring-2026',
    typeSlug: 'scsl',
    name: 'SCSL @ Elsinore — Spring',
    shortTagline: 'The classic 4-way meet. All levels welcome.',
    oneLiner: 'A friendly, well-run 4-way competition with three divisions and real medals — the easiest first comp in SoCal.',
    date: '2026-03-15',
    dropzone: 'Elsinore',
    status: 'complete',
    divisions: ['AAA', 'AA', 'A', 'Rookie'],
    registrationCount: 0,
    approvedCount: 0,
    revenue: 0,
    pendingBalance: 0,
    furyEventId: 'fury-scsl-2026-01',
    furyRegistrationUrl: 'https://register.furycoaching.com/registration?eventId=evt-scsl-4way-elsinore-spring-2026',
    lookingForTeamCount: 0,
    teamsNotFullCount: 0,
  },
  {
    id: 'poker-run-elsinore-2026',
    typeSlug: 'poker-run',
    name: 'Poker Run @ Elsinore',
    shortTagline: '6-way meet. Poker hand. Cash pot. Tequila.',
    oneLiner: 'A 6-way meet with a deck of cards and a tequila-fueled twist — the most fun way to score SkyQuest points.',
    date: '2026-06-13',
    dropzone: 'Elsinore',
    status: 'complete',
    divisions: ['Open'],
    registrationCount: 0,
    approvedCount: 0,
    revenue: 0,
    pendingBalance: 0,
    waitlistCount: 0,
    furyEventId: 'fury-poker-2026-01',
    // Poker Run is registered via its Facebook event (independently priced — not in Fury Registration).
    furyRegistrationUrl: 'https://www.facebook.com/events/4088089458172392/',
    registrationLabel: 'Event Info',
    contactEmail: 'events@skydiveelsinore.com',
    lookingForTeamCount: 0,
    teamsNotFullCount: 0,
  },
  {
    id: 'dueling-dzs-2026',
    typeSlug: 'dueling-dzs',
    name: 'Dueling DZs — Perris ↔ Elsinore',
    shortTagline: 'Take off at one DZ. Land at the other.',
    oneLiner: 'Four rounds of 6-way back and forth between two dropzones — board the plane, fly the round, land, board again. Canyon Lake after for awards and apps.',
    date: '2026-10-25',
    dropzone: 'Perris ↔ Elsinore',
    // Reg coming soon, price TBD — show Notify Me until it opens.
    status: 'upcoming',
    divisions: ['Open'],
    registrationCount: 0,
    approvedCount: 0,
    revenue: 0,
    pendingBalance: 0,
    waitlistCount: 0,
    lookingForTeamCount: 0,
    teamsNotFullCount: 0,
  },
  {
    id: 'scsl-perris-late-summer-2026',
    typeSlug: 'scsl',
    name: 'SCSL @ Perris — Late Summer',
    shortTagline: 'Classic 4-way. Three divisions. Real medals.',
    oneLiner: 'Five rounds of 4-way at Skydive Perris with A / AA / AAA divisions — round two of the SCSL series.',
    date: '2026-08-15',
    dropzone: 'Perris',
    status: 'open',
    divisions: ['AAA', 'AA', 'A', 'Rookie'],
    registrationCount: 0,
    approvedCount: 0,
    revenue: 0,
    pendingBalance: 0,
    lookingForTeamCount: 0,
    teamsNotFullCount: 0,
    furyEventId: 'evt-scsl-4way-perris-2026',
    furyRegistrationUrl: 'https://register.furycoaching.com/registration?eventId=evt-scsl-4way-perris-2026',
  },
  {
    id: 'crazy8s-perris-2026',
    typeSlug: 'crazy8s',
    name: "Frikken Crazy 8's @ Perris",
    shortTagline: '8-way meet. You build the dives. Strategy wins.',
    oneLiner: 'An 8-way event where teams choose their own formations and gamble on which combos will score — flying skill plus smart engineering.',
    date: '2026-08-16',
    dropzone: 'Perris',
    status: 'open',
    divisions: ['Open'],
    registrationCount: 0,
    approvedCount: 0,
    furyEventId: 'evt-frikken-crazy8s-2026',
    furyRegistrationUrl: 'https://register.furycoaching.com/registration?eventId=evt-frikken-crazy8s-2026',
  },
  {
    id: 'ghost-nationals-perris-2026',
    typeSlug: 'ghost-nationals',
    name: 'Ghost Nationals @ Perris',
    shortTagline: 'Fly the actual US Nationals draw. Locally.',
    oneLiner: 'Part of the previous USPA Nationals draw, run at Skydive Perris — a redo, a first meet, or a team-building test before next season.',
    date: '2026-11-28',
    dropzone: 'Perris',
    status: 'open',
    divisions: ['AAA', 'AA', 'A'],
    registrationCount: 0,
    approvedCount: 0,
    furyEventId: 'evt-ghost-nationals-2026',
    furyRegistrationUrl: 'https://register.furycoaching.com/registration?eventId=evt-ghost-nationals-2026',
  },
  {
    id: 'awards-show-2026',
    typeSlug: 'awards',
    name: 'Awards Show @ The Bombshelter',
    shortTagline: 'Same evening as Ghost Nationals. Awards, medals, bad decisions. Fancy dress optional.',
    oneLiner: 'Fly Ghost Nationals in the morning, celebrate the season that evening at the Bombshelter. Free and open to all.',
    date: '2026-11-28',
    dropzone: 'The Bombshelter',
    status: 'season-finale',
    divisions: [],
    registrationCount: 0,
    approvedCount: 0,
    registrationLabel: 'RSVP',
  },
]

// ── Event scores keyed by instanceId ─────────────────────────────────────────
// Add completed-event round scores here; AdminScores loads them on mount.

export const EVENT_RESULTS: Record<string, TeamResult[]> = {
  'scsl-elsinore-spring-2026': [
    // Division A
    {
      rank: 1, teamId: 'els26-t1', teamName: 'Spirograph',
      members: [
        { id: 'els26-m1a', name: 'Ron Setina' },
        { id: 'els26-m1b', name: 'Carol Setina' },
        { id: 'els26-m1c', name: 'Tessa Gill' },
        { id: 'els26-m1d', name: 'Jennifer McCord' },
      ],
      division: 'A', roundScores: [6], total: 6,
    },
    {
      rank: 1, teamId: 'els26-t2', teamName: 'Belly Bitches',
      members: [
        { id: 'els26-m2a', name: 'Christina Rhein' },
        { id: 'els26-m2b', name: 'Thao Nguyen' },
        { id: 'els26-m2c', name: 'Kayla Nebeker' },
        { id: 'els26-m2d', name: 'Jessica Detering' },
      ],
      division: 'A', roundScores: [6], total: 6,
    },
    {
      rank: 1, teamId: 'els26-t3', teamName: "Linda Lee's Flying Butts",
      members: [
        { id: 'els26-m3a', name: 'Ricki Cline' },
        { id: 'els26-m3b', name: 'Abby Brandtmeier' },
        { id: 'els26-m3c', name: 'Matthew Dottinger' },
        { id: 'els26-m3d', name: 'Mary Santangelo' },
      ],
      division: 'A', roundScores: [6], total: 6,
    },
    {
      rank: 4, teamId: 'els26-t4', teamName: "I'll Come Up With One Later",
      members: [
        { id: 'els26-m4a', name: 'Jim Stewart' },
        { id: 'els26-m4b', name: 'Trent' },
        { id: 'els26-m4c', name: 'Keith Conner' },
        { id: 'els26-m4d', name: 'Shashank' },
      ],
      division: 'A', roundScores: [3], total: 3,
    },
    // Division AA
    {
      rank: 1, teamId: 'els26-t5', teamName: 'Emotional Support American',
      members: [
        { id: 'els26-m5a', name: 'Sam Yost' },
        { id: 'els26-m5b', name: 'Cindy Kou' },
        { id: 'els26-m5c', name: 'Dima' },
        { id: 'els26-m5d', name: 'Anderson Briglia' },
      ],
      division: 'AA', roundScores: [10], total: 10,
    },
    {
      rank: 2, teamId: 'els26-t6', teamName: 'Perris Prime',
      members: [
        { id: 'els26-m6a', name: 'Nathan Casper' },
        { id: 'els26-m6b', name: 'Jay Richards' },
        { id: 'els26-m6c', name: 'Derek Nelson' },
        { id: 'els26-m6d', name: 'Erik Prime' },
      ],
      division: 'AA', roundScores: [8], total: 8,
    },
    {
      rank: 3, teamId: 'els26-t7', teamName: 'Sun Kissed Spinners',
      members: [
        { id: 'els26-m7a', name: 'Christopher Massie' },
        { id: 'els26-m7b', name: 'Chuck Reilly' },
        { id: 'els26-m7c', name: 'Cody' },
        { id: 'els26-m7d', name: 'Mike Teague' },
      ],
      division: 'AA', roundScores: [7], total: 7,
    },
    {
      rank: 3, teamId: 'els26-t8', teamName: 'Only 4way Fans',
      members: [
        { id: 'els26-m8a', name: 'Sam Abelovski' },
        { id: 'els26-m8b', name: 'Khan Griffith' },
        { id: 'els26-m8c', name: 'Heather Abrahim' },
        { id: 'els26-m8d', name: 'Yvonne Ontiveros' },
      ],
      division: 'AA', roundScores: [7], total: 7,
    },
    // Division AAA
    {
      rank: 1, teamId: 'els26-t9', teamName: 'Perris Probably Fine',
      members: [
        { id: 'els26-m9a', name: 'Grace Katz' },
        { id: 'els26-m9b', name: 'Alex Sarmiento' },
        { id: 'els26-m9c', name: 'David Schrager' },
        { id: 'els26-m9d', name: 'Jeff Hill' },
      ],
      division: 'AAA', roundScores: [9], total: 9,
    },
  ],
}

// ── Poker Run seeds keyed by instanceId ─────────────────────────────────────
//
// Loaded by AdminScoresPokerRun on first mount when no localStorage state
// exists. Once an admin saves anything, the local copy supersedes — these
// seeds only matter for first-time-open. After Publish, the canonical results
// land in Firestore `results_2026/{instanceId}`.

export interface PokerRunTeamSeed {
  teamId: string
  teamName: string
  handicap: number
  members: { id: string; name: string }[]
  /** Video flyer — separate from the scoring team but tracked for credit. */
  videoName?: string
  /** Per-round raw scores. Length is whatever was actually flown. */
  scores: number[]
}

export const POKER_RUN_SEEDS: Record<string, { rounds: number; teams: PokerRunTeamSeed[] }> = {
  // From Mary SantAngelo's email + the whiteboard photo (May 10, 2026).
  // Whiteboard cumulative columns matched raw sums exactly, so handicaps are
  // display-only here. Adjust the publish math if that ever changes.
  'poker-run-elsinore-2026': {
    rounds: 3,
    teams: [
      {
        teamId: 'pr-elsinore-2026-dust-angels',
        teamName: 'Dust Angels',
        handicap: 6,
        members: [
          { id: 'pr-2026-jessica-detering', name: 'Jessica Detering' },
          { id: 'pr-2026-josh-whiteside', name: 'Josh Whiteside' },
          { id: 'pr-2026-james-kling', name: 'James Kling' },
          { id: 'pr-2026-heather-abrahim', name: 'Heather Abrahim' },
          { id: 'pr-2026-samuel-abelovski', name: 'Samuel Abelovski' },
          { id: 'pr-2026-matt-dottinger', name: 'Matt Dottinger' },
        ],
        videoName: 'Justin Larios',
        scores: [14, 12, 9],
      },
      {
        teamId: 'pr-elsinore-2026-the-calamity',
        teamName: 'The Calamity',
        handicap: 1,
        members: [
          { id: 'pr-2026-zach-winoker', name: 'Zach Winoker' },
          { id: 'pr-2026-mary-santangelo', name: 'Mary SantAngelo' },
          { id: 'pr-2026-khan-griffith', name: 'Khan Griffith' },
          { id: 'pr-2026-rosemary-brown', name: 'Rosemary Brown' },
          { id: 'pr-2026-jay-richards', name: 'Jay Richards' },
          { id: 'pr-2026-seth-johnson', name: 'Seth Johnson' },
        ],
        videoName: 'Roman',
        scores: [8, 8, 8],
      },
      {
        teamId: 'pr-elsinore-2026-half-a-six-pack',
        teamName: 'Half a Six Pack',
        handicap: 0,
        members: [
          { id: 'pr-2026-mike-teague', name: 'Mike Teague' },
          { id: 'pr-2026-cody-miller', name: 'Cody Miller' },
          { id: 'pr-2026-dillion-cole', name: 'Dillion Cole' },
          { id: 'pr-2026-ander-mattsson', name: 'Ander Mattsson' },
          { id: 'pr-2026-josh-hall', name: 'Josh Hall' },
        ],
        videoName: "Justin D'Amico",
        scores: [7, 7, 6],
      },
      {
        teamId: 'pr-elsinore-2026-jstf',
        teamName: 'JSTF',
        handicap: 3,
        members: [
          { id: 'pr-2026-christian-van-sickle', name: 'Christian Van Sickle' },
          { id: 'pr-2026-spencer-stephen', name: 'Spencer Stephen' },
          { id: 'pr-2026-tiger-valdes', name: 'Tiger Valdes' },
          { id: 'pr-2026-matt-stelzer', name: 'Matt Stelzer' },
          { id: 'pr-2026-koi-van-sickle', name: 'Koi Van Sickle' },
        ],
        videoName: 'Roman',
        scores: [4, 5, 0],
      },
    ],
  },
}

