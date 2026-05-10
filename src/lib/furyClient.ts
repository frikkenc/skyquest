import { getIdToken } from 'firebase/auth'
import { auth } from '../firebase'

const BASE = import.meta.env.DEV
  ? '/fury-api'
  : (import.meta.env.VITE_FURY_API_URL as string | undefined) ?? ''

async function headers(): Promise<Record<string, string>> {
  const user = auth.currentUser
  if (!user) throw new Error('Not signed in')
  const token = await getIdToken(user, /* forceRefresh */ false)
  return { Authorization: `Bearer ${token}` }
}

async function furyGet<T>(path: string): Promise<T> {
  const h = await headers()
  const res = await fetch(`${BASE}${path}`, { headers: h })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Fury ${path} → ${res.status}: ${text.slice(0, 120)}`)
  }
  return res.json() as Promise<T>
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface FurySession {
  authenticated: boolean
  uid: string
  admin: boolean
}

export interface FuryUnit {
  id: string
  type: string
  subtype: string
  status: string
  approvalStatus: string
  nominalPrice: number
  eventOfferingId: string
  createdAt: string
}

export interface FuryRegistrant {
  id: string
  registrationId: string
  eventId: string
  clientId: string
  status: string
  approvalStatus: string
  createdAt: string
  checkoutCompletedAt: string | null
  name: string
  email: string
  phone: string
  client: {
    id: string
    firstName: string
    lastName: string
    preferredName: string | null
    email: string
    phone: string
  }
  formData: {
    needsTeamUp?: string
    teammates?: string
    whatIsYourPreferredDivision?: string
    doYouNeedHelpFindingVideo?: string
    firstName?: string
    lastName?: string
    preferredName?: string
    email?: string
    phone?: string
  }
  units: FuryUnit[]
}

export interface FuryRegistrationsPayload {
  eventId: string
  registrations: FuryRegistrant[]
}

// ── API calls ─────────────────────────────────────────────────────────────────

export function fetchFurySession(): Promise<FurySession> {
  return furyGet<FurySession>('/api/admin/session')
}

export function fetchFuryRegistrations(furyEventId: string): Promise<FuryRegistrationsPayload> {
  return furyGet<FuryRegistrationsPayload>(`/api/events/${furyEventId}/registrations`)
}

// ── Event list + stats types ──────────────────────────────────────────────────

export interface FuryEventConfig {
  slug: string
  status: string
  timezone: string
  location: string
  description: string
  registrationOpen: boolean
  eventVisibility: string
  brand?: string
  style?: string
  salesOpenAt?: string
  salesCloseAt?: string
}

export interface FuryEvent {
  id: string
  name: string
  startDate: string
  endDate: string
  config: FuryEventConfig
}

export interface FuryMoneySummary {
  eventId: string
  grossCollected: number
  netAfterProcessingFees: number
  totalRefunded: number
  potentialRefundsOwed: number
  paidPaymentCount: number
  refundedPaymentCount: number
  pendingRefundDueCount: number
}

export interface FuryOfferingStats {
  eventId: string
  statsByOfferingId: Record<string, {
    confirmed: number
    pending: number
    waitlisted: number
    denied: number
    totalActive: number
  }>
}

export function fetchFuryEventList(): Promise<FuryEvent[]> {
  return furyGet<FuryEvent[]>('/api/admin/events')
}

export function fetchFuryMoneySummary(eventId: string): Promise<FuryMoneySummary> {
  return furyGet<FuryMoneySummary>(`/api/admin/events/${eventId}/money-summary`)
}

export function fetchFuryOfferingStats(eventId: string): Promise<FuryOfferingStats> {
  return furyGet<FuryOfferingStats>(`/api/admin/events/${eventId}/offering-stats`)
}
