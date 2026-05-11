// Seed data extracted from Christy's 2025 Google Sheet
// (https://docs.google.com/spreadsheets/d/1OILTnMip8nO-1HcReI0J9SljYW2CGN4bw3saQTCAXN0/)
// Sheet has three tabs: Roster, Market, Menu.

import type { FormationDef, MarketEntry, YearMenu } from '../types/crazy8'

// Master formation list — file slug (matches /crazy8/formations/<slug>.svg) + display name.
export const DEFAULT_FORMATIONS: FormationDef[] = [
  { slug: 'sattelite',        name: 'SATTELITE' },
  { slug: 'helix',            name: 'HELIX' },
  { slug: 'yeesh',            name: 'YEESH' },
  { slug: 'opposed-diamonds', name: 'OPPOSED DIAMOND' },
  { slug: 'open',             name: 'OPEN' },
  { slug: 'speedbody',        name: 'SPEEDBODY' },
  { slug: 'phalanx',          name: 'PHALANX' },
  { slug: 'starzip',          name: 'STARZIP' },
  { slug: 'rainbow',          name: 'DOUBLE RAINBOW' },
  { slug: 'deez-donuts',      name: 'DEEZ DONUTS' },
  { slug: 'inout',            name: 'IN OUT' },
  { slug: 'star',             name: 'STAR' },
  { slug: 'vulture',          name: 'VULTURE' },
  { slug: 'friendly',         name: 'FRIENDLY' },
  { slug: 'crank',            name: 'CRANK' },
  { slug: 'flipflake',        name: 'FLIPFLAKE' },
  { slug: 'comp',             name: 'COMPRESSED' },
  { slug: 'jj',               name: 'JJ' },
  { slug: 'nacho',            name: 'NACHO' },
  { slug: 'siiiiiidebody',    name: 'SIDEBODY' },
]

// ── Column order from the Market tab ──
// Sattelite, Helix, Yeesh, Opposed Diamond, Open, Speedbody, Phalanx, Starzip,
// Double Rainbow, Deez Donuts, In Out, Star, Vulture, Friendly, Crank, FlipFlake, Comp
const COLS = [
  'sattelite','helix','yeesh','opposed-diamonds','open','speedbody','phalanx','starzip',
  'rainbow','deez-donuts','inout','star','vulture','friendly','crank','flipflake','comp',
] as const

function toMarket(earned: number[], promo: number[]): { [slug: string]: MarketEntry } {
  const out: { [slug: string]: MarketEntry } = {}
  COLS.forEach((slug, i) => {
    out[slug] = { earned: earned[i] ?? 0, promo: promo[i] ?? 0 }
  })
  return out
}

// 2024 — from "Remain 2024" row + 2024 FM promos (first 6 columns only in the sheet's partial FM row).
const REMAIN_2024 = [2,0.5,0.5,2,1,3.5,0,8.5,1,0,1.5,2,0.5,0,0,1,0]
const FM_2024     = [3,33,33,6,33,6,0,0,0,0,0,0,0,0,0,0,0]
export const SEED_2024_MARKET = toMarket(REMAIN_2024, FM_2024)

// 2025 — from "Just 2025" row (net change) + delta FM promos since 2024 (final FM minus 2024 FM).
const JUST_2025 = [-2,-2,-3,-3,-1,-2,0,-6.5,-1,-2,-1,-1,-4,2.5,-6,-4,-1]
const FM_FINAL  = [0,1.5,30.5,-1,0,1.5,33,2,0,-2,6.5,1,-3.5,2.5,27,-3,5]
const FM_2025   = FM_FINAL.map((v, i) => v - (FM_2024[i] ?? 0))
export const SEED_2025_MARKET = toMarket(JUST_2025, FM_2025)

// 2026 — starts blank, filled in as events score.
export const SEED_2026_MARKET: { [slug: string]: MarketEntry } = {}

// ── 2026 menu (from the Menu tab) ──
// Each round can have ANY number of combos; each combo can be 2 or 3 formations.
export const SEED_2026_MENU: YearMenu = {
  year: 2026,
  rounds: [
    {
      round: 1,
      combos: [
        { id: 'r1-a', formations: ['opposed-diamonds', 'sattelite'], value: 2 },
        { id: 'r1-b', formations: ['vulture', 'starzip', 'flipflake'], value: 4 },
      ],
    },
    {
      round: 2,
      combos: [
        { id: 'r2-a', formations: ['deez-donuts', 'rainbow'], value: 5 },
        { id: 'r2-b', formations: ['speedbody', 'star', 'flipflake'], value: 8 },
      ],
    },
    {
      round: 3,
      combos: [
        { id: 'r3-a', formations: ['star', 'helix'], value: 9 },
        { id: 'r3-b', formations: ['yeesh', 'open', 'vulture'], value: 12 },
      ],
    },
    {
      round: 4,
      combos: [
        { id: 'r4-a', formations: ['starzip', 'crank'], value: 13 },
        { id: 'r4-b', formations: ['friendly', 'inout', 'comp'], value: 16 },
      ],
    },
  ],
}
