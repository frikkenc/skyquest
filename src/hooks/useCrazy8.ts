import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { FormationMaster, FormationDef, Crazy8YearDoc, MarketEntry, MenuRound } from '../types/crazy8'
import {
  DEFAULT_FORMATIONS, SEED_2026_MENU, SEED_2024_MARKET, SEED_2025_MARKET, SEED_2026_MARKET,
} from '../data/crazy8Seed'

const docRef = (id: string) => doc(db, 'crazy8config', id)

// ── Master formations list ──────────────────────────────────────────────────
export function useCrazy8Master() {
  const [master, setMaster] = useState<FormationMaster>({ formations: DEFAULT_FORMATIONS })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getDoc(docRef('master')).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as FormationMaster
        if (Array.isArray(data?.formations)) setMaster(data)
      }
    }).catch(() => { /* fall back to defaults */ })
      .finally(() => setLoading(false))
  }, [])

  async function saveMaster(next: FormationMaster) {
    setMaster(next)
    setSaving(true)
    try {
      await setDoc(docRef('master'), next, { merge: false })
    } finally {
      setSaving(false)
    }
  }

  async function upsertFormation(f: FormationDef) {
    const next: FormationMaster = {
      formations: master.formations.some(x => x.slug === f.slug)
        ? master.formations.map(x => x.slug === f.slug ? f : x)
        : [...master.formations, f],
    }
    await saveMaster(next)
  }

  return { master, loading, saving, saveMaster, upsertFormation }
}

function emptyMenuRounds(): MenuRound[] {
  return [1, 2, 3, 4].map(round => ({
    round,
    combos: [
      { id: `r${round}-a`, formations: [], value: 0 },
      { id: `r${round}-b`, formations: [], value: 0 },
    ],
  }))
}

// ── Per-year doc (menu + market) ────────────────────────────────────────────
export function useCrazy8Year(year: number) {
  const [yearDoc, setYearDoc] = useState<Crazy8YearDoc>({
    year,
    menu: { year, rounds: emptyMenuRounds() },
    market: {},
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    getDoc(docRef(`year_${year}`)).then(snap => {
      if (snap.exists()) {
        const data = snap.data() as Crazy8YearDoc
        setYearDoc({
          year,
          menu: data.menu ?? { year, rounds: emptyMenuRounds() },
          market: data.market ?? {},
        })
      } else {
        setYearDoc({ year, menu: { year, rounds: emptyMenuRounds() }, market: {} })
      }
    }).catch(() => { /* leave defaults */ })
      .finally(() => setLoading(false))
  }, [year])

  async function saveYear(next: Crazy8YearDoc) {
    setYearDoc(next)
    setSaving(true)
    try {
      await setDoc(docRef(`year_${year}`), next, { merge: false })
    } finally {
      setSaving(false)
    }
  }

  async function saveMarket(market: { [slug: string]: MarketEntry }) {
    await saveYear({ ...yearDoc, market })
  }

  async function saveMenu(rounds: MenuRound[]) {
    await saveYear({ ...yearDoc, menu: { year, rounds } })
  }

  return { yearDoc, loading, saving, saveYear, saveMarket, saveMenu }
}

// One-click loader for the starter data extracted from the user's Sheet.
// Seeds the master list + 2024/2025/2026 year docs from the Market and Menu tabs.
// Throws on Firestore errors so the UI can surface them.
export async function seed2026(): Promise<void> {
  await setDoc(docRef('master'), { formations: DEFAULT_FORMATIONS })
  await setDoc(docRef('year_2024'), {
    year: 2024,
    menu: { year: 2024, rounds: emptyMenuRounds() },
    market: SEED_2024_MARKET,
  })
  await setDoc(docRef('year_2025'), {
    year: 2025,
    menu: { year: 2025, rounds: emptyMenuRounds() },
    market: SEED_2025_MARKET,
  })
  await setDoc(docRef('year_2026'), {
    year: 2026,
    menu: SEED_2026_MENU,
    market: SEED_2026_MARKET,
  })
}

// ── Total cards in market, summed across all year docs ──
// Returns { [slug]: total } where total = sum of earned + promo across every year_YYYY doc.
import type { MarketEntry as _MarketEntry } from '../types/crazy8'
export function useCrazy8MarketTotals(years: number[]): {
  totals: { [slug: string]: number },
  loading: boolean,
} {
  const [totals, setTotals] = useState<{ [slug: string]: number }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all(years.map(async y => {
      try {
        const snap = await getDoc(docRef(`year_${y}`))
        return snap.exists() ? ((snap.data() as Crazy8YearDoc).market ?? {}) : {}
      } catch {
        return {} as { [slug: string]: _MarketEntry }
      }
    })).then(maps => {
      if (!alive) return
      const sum: { [slug: string]: number } = {}
      maps.forEach(m => {
        for (const [slug, entry] of Object.entries(m)) {
          sum[slug] = (sum[slug] ?? 0) + (entry.earned || 0) + (entry.promo || 0)
        }
      })
      setTotals(sum)
      setLoading(false)
    })
    return () => { alive = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years.join('|')])

  return { totals, loading }
}
