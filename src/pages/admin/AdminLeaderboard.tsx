import { LeaderboardContent } from '../Leaderboard'

/**
 * Admin leaderboard preview — the exact same content the public site shows
 * at /leaderboard, but rendered inside the admin layout chrome (no public
 * Nav/Footer, just the wrap padding to match other admin pages).
 *
 * If the public leaderboard ever diverges from this preview, the shared
 * component is the bug — both surfaces should be byte-identical readouts of
 * Firestore `results_2026`.
 */
export default function AdminLeaderboard() {
  return (
    <div style={{ padding: '8px 0' }}>
      <LeaderboardContent />
    </div>
  )
}
