// Frikken Crazy 8s data types. Stored in Firestore under crazy8config/*.

export interface FormationDef {
  slug: string         // canonical id (matches /crazy8/formations/<slug>.svg)
  name: string         // display name (e.g. "OPPOSED DIAMOND")
  retired?: boolean    // out of current rotation
  notes?: string
}

export interface FormationMaster {
  formations: FormationDef[]
}

// Per-year market: how many of each formation are in circulation.
// 'earned' = won during play (event scoring). 'promo' = FreshMeet / handouts.
export interface MarketEntry {
  earned: number
  promo: number
}

// One dive option in a round: a list of formation slugs + a typed-in point value.
export interface MenuCombo {
  id: string
  formations: string[]   // formation slugs
  value: number          // total dive value (free-form, you type it in)
  notes?: string
}

export interface MenuRound {
  round: number
  combos: MenuCombo[]
}

export interface YearMenu {
  year: number
  rounds: MenuRound[]
}

// Yearly Firestore doc — bundles menu + market entries for one year.
export interface Crazy8YearDoc {
  year: number
  menu: YearMenu
  market: { [slug: string]: MarketEntry }
}
