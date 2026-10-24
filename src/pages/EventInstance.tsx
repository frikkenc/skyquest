import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import EventBadge from '../components/EventBadge'
import StatusPill from '../components/StatusPill'
import NotifyMeModal from '../components/NotifyMeModal'
import { EVENT_TYPES } from '../data/mockData'
import { useLiveEventList } from '../hooks/useLiveEventList'
import { getEventPhoto } from '../lib/eventPhotos'
import { normalizeRegistrationUrl } from '../utils/registrationUrl'
import { isEventDay as onEventDay } from '../utils/eventDay'
import type { Division, PublishedEventResult, PublishedTeamResult } from '../types'
import styles from './EventInstance.module.css'

function formatDate(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function EventInstance() {
  const { typeSlug, instanceId } = useParams<{ typeSlug: string; instanceId: string }>()
  const { events } = useLiveEventList()
  const event = events.find(e => e.id === instanceId)
  const eventType = event ? EVENT_TYPES.find(t => t.slug === event.typeSlug) : null
  // Default to whichever division actually exists on the event. Falling back
  // to 'AA' regardless was the source of the misleading "Results not yet
  // available for AA" message on the Poker Run (which only has 'Open').
  const [activeDivision, setActiveDivision] = useState<Division>(
    (event?.divisions[0] ?? 'AAA') as Division,
  )
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [published, setPublished] = useState<PublishedEventResult | null>(null)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [live, setLive] = useState<(PublishedEventResult & { updatedAt?: string }) | null>(null)

  // Load the published event result for this instance. results_2026 is
  // public-read so unauthenticated visitors can see it. Only fetch for
  // complete events — otherwise we'd hit Firestore on every event detail
  // page load with no value.
  useEffect(() => {
    if (!instanceId || event?.status !== 'complete') {
      setPublished(null)
      return
    }
    setResultsLoading(true)
    getDoc(doc(db, 'results_2026', instanceId))
      .then(snap => {
        setPublished(snap.exists() ? (snap.data() as PublishedEventResult) : null)
      })
      .catch(console.error)
      .finally(() => setResultsLoading(false))
  }, [instanceId, event?.status])

  // Day-of: the admin scoring tab mirrors its standings to liveScores on every
  // edit. Listen until the event is published, then the final results take over.
  useEffect(() => {
    if (!instanceId || !event || event.status === 'complete') { setLive(null); return }
    return onSnapshot(
      doc(db, 'liveScores', instanceId),
      snap => setLive(snap.exists() ? (snap.data() as PublishedEventResult & { updatedAt?: string }) : null),
      () => setLive(null),
    )
  }, [instanceId, event?.status])

  // /events/...#scores (the Live Scores buttons): jump to the section once it renders.
  const hasEvent = !!event
  useEffect(() => {
    if (window.location.hash !== '#scores' || !hasEvent) return
    const t = window.setTimeout(() => document.getElementById('scores')?.scrollIntoView({ behavior: 'smooth' }), 150)
    return () => window.clearTimeout(t)
  }, [hasEvent, live, published])

  // When the event or published results resolve, snap the active division to
  // one that actually has data (or, failing that, to the first division on
  // the event metadata). Prevents the "Results not yet available for AA" bug
  // when AA isn't even a tab on this event.
  useEffect(() => {
    if (!event) return
    const publishedDivs = Array.from(new Set((published?.teams ?? []).map(t => t.division)))
    const fallbackDivs = publishedDivs.length > 0 ? publishedDivs : event.divisions
    if (fallbackDivs.length > 0 && !fallbackDivs.includes(activeDivision)) {
      setActiveDivision(fallbackDivs[0] as Division)
    }
  }, [event, published, activeDivision])

  if (!event || !eventType) {
    return (
      <>
        <Nav />
        <div className="wrap" style={{ paddingTop: 80, textAlign: 'center', color: 'var(--sq-gray)' }}>
          Event not found.
        </div>
        <Footer />
      </>
    )
  }

  const isComplete = event.status === 'complete'
  const isOpen = event.status === 'open' && !!event.furyRegistrationUrl
  const isManualOpen = event.status === 'open' && !event.furyRegistrationUrl
  const isUpcoming = event.status === 'upcoming'
  const isClosed = event.status === 'closed'
  const isFinale = event.status === 'season-finale'
  // Live standings only on event day (through the next day, for a weather
  // spill-over) and only once a score has actually been entered — test entries
  // weeks out, or a grid of zeros before the first load lands, stay hidden.
  const isEventDay = onEventDay(event.date)
  const isLive = !isComplete && isEventDay && !!live && live.teams.some(t => t.rawScore > 0)
  const shown = isComplete ? published : isLive ? live : null

  // Tabs surface divisions that actually have published teams — not what the
  // event metadata says. The Poker Run lists 'Open' in event.divisions but
  // its teams publish under 'AAA' (so they roll up into the AAA season
  // standings), so the tab needs to follow the data, not the schedule.
  const divisionsWithResults = Array.from(
    new Set((shown?.teams ?? []).map(t => t.division)),
  ) as Division[]
  const visibleDivisions: Division[] = divisionsWithResults.length > 0
    ? divisionsWithResults
    : (event.divisions.length > 0 ? event.divisions : (['AAA', 'AA', 'A', 'Rookie'] as Division[]))

  // Filter to the active division for this event. published.teams is the
  // post-Publish snapshot from Firestore.
  const results: PublishedTeamResult[] = (shown?.teams ?? [])
    .filter(t => t.division === activeDivision)
    .sort((a, b) => a.rank - b.rank)

  // Round-by-round columns: counted rounds only (weather-scrubbed rounds are
  // dropped, so labels renumber to what was actually flown), plus the jumpoff.
  // Docs published before roundScores existed fall back to the total-only table.
  const publishedGridLen = shown?.roundCount ?? 0
  const roundCols: { idx: number; label: string }[] =
    shown && publishedGridLen > 0 && results.some(t => (t.roundScores?.length ?? 0) > 0)
      ? [
          ...Array.from({ length: publishedGridLen }, (_, i) => i)
            .filter(i => (shown.roundStatuses?.[i] ?? 'ok') !== 'weather')
            .map((idx, k) => ({ idx, label: `R${k + 1}` })),
          ...(shown.hasJumpoff ? [{ idx: publishedGridLen, label: 'JO' }] : []),
        ]
      : []
  // Dueling DZs ranks on the jump-number handicap (JPP), not the raw total.
  const showJpp = results.some(t => t.jpp != null)
  const photo = getEventPhoto(event.typeSlug)

  return (
    <>
      <Nav />
      <div className="wrap">
        <div className={styles.crumbs}>
          <Link to="/schedule">Schedule</Link> / {event.name}
        </div>
      </div>

      {/* Hero with banner photo backdrop */}
      <section className={styles.instanceHero}>
        <picture className={styles.heroBg}>
          <source
            media="(min-width: 768px)"
            type="image/webp"
            srcSet={`/img/${photo.base}__banner-16x9.webp`}
          />
          <source
            media="(min-width: 768px)"
            srcSet={`/img/${photo.base}__banner-16x9.jpg`}
          />
          <source
            type="image/webp"
            srcSet={`/img/${photo.base}__banner-16x9-mobile.webp`}
          />
          <img
            src={`/img/${photo.base}__banner-16x9-mobile.jpg`}
            alt={photo.alt}
            loading="eager"
            decoding="async"
          />
        </picture>
        <div className={styles.heroOverlay} aria-hidden="true" />
        <div className={`wrap ${styles.heroInner}`}>
          <EventBadge slug={event.typeSlug} size={110} />
          <div style={{ flex: 1 }}>
            <StatusPill status={event.status} evt={event} />
            <h1 className={styles.title}>{event.name}</h1>
            <div className={styles.metaRow}>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Date</div>
                <div className={styles.metaVal}>{formatDate(event.date)}</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Location</div>
                <div className={styles.metaVal}>{event.dropzone}</div>
              </div>
              <div className={styles.metaItem}>
                <div className={styles.metaLabel}>Format</div>
                <div className={styles.metaVal}>{eventType.format}</div>
              </div>
              {event.divisions.length > 0 && (
                <div className={styles.metaItem}>
                  <div className={styles.metaLabel}>Divisions</div>
                  <div className={styles.metaVal}>{event.divisions.join(' · ')}</div>
                </div>
              )}
            </div>
          </div>

          {/* CTA in hero */}
          <div className={styles.heroCta}>
            {isEventDay && !isComplete && (
              <a href="#scores" className="btn btn-primary">● Live Scores</a>
            )}
            {isOpen && (
              <a href={normalizeRegistrationUrl(event.furyRegistrationUrl)} target="_blank" rel="noreferrer" className="btn btn-primary">
                {event.registrationLabel ?? 'Sign Up'}
              </a>
            )}
            {isManualOpen && event.contactEmail && (
              <a href={`mailto:${event.contactEmail}`} className="btn btn-primary">
                Email to Register
              </a>
            )}
            {(isUpcoming || (isManualOpen && !event.contactEmail)) && (
              <button className="btn btn-ghost" onClick={() => setNotifyOpen(true)}>
                Notify Me When Reg Opens
              </button>
            )}
            {isClosed && (
              <span style={{ color: 'var(--sq-gray)', fontSize: 14 }}>Registration is closed.</span>
            )}
            {isComplete && (
              <span style={{ color: 'var(--sq-gray)', fontSize: 14 }}>This event is complete.</span>
            )}
            {isFinale && (
              <span className="pill pill-awards" style={{ fontSize: 13, padding: '8px 16px' }}>Season Finale</span>
            )}
          </div>
        </div>
      </section>

      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 64 }}>

        {/* About section */}
        <div className={styles.aboutGrid}>
          <div className={styles.aboutMain}>
            {event.oneLiner && (
              <p className={styles.oneLiner}>{event.oneLiner}</p>
            )}
            <p className={styles.longDesc}>{eventType.longDescription}</p>
          </div>

          <div className={styles.aboutSide}>
            <div className="card">
              <div className={styles.sideTitle}>Event Details</div>
              <dl className={styles.detailList}>
                <dt>Date</dt>
                <dd>{formatDate(event.date)}</dd>
                <dt>Location</dt>
                <dd>{event.dropzone}</dd>
                <dt>Format</dt>
                <dd>{eventType.format}</dd>
                {event.divisions.length > 0 && (
                  <>
                    <dt>Divisions</dt>
                    <dd>{event.divisions.join(', ')}</dd>
                  </>
                )}
              </dl>

              {isOpen && (
                <a href={normalizeRegistrationUrl(event.furyRegistrationUrl)} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
                  {event.registrationLabel ?? 'Sign Up'}
                </a>
              )}
              {isManualOpen && event.contactEmail && (
                <a href={`mailto:${event.contactEmail}`} className="btn btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: 16 }}>
                  Email to Register
                </a>
              )}
              {(isUpcoming || (isManualOpen && !event.contactEmail)) && (
                <button className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }} onClick={() => setNotifyOpen(true)}>
                  Notify Me When Reg Opens
                </button>
              )}
            </div>

            {/* Crazy 8s rulebook */}
            {event.typeSlug === 'crazy8s' && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className={styles.sideTitle}>How Scoring Works</div>
                <p style={{ color: '#cfcfcf', fontSize: 14, lineHeight: 1.6 }}>
                  Formations aren't points — combos are. Read the full rules before you plan your dives.
                </p>
                <Link to="/events/crazy8s/rules" className="btn btn-ghost" style={{ display: 'block', textAlign: 'center', marginTop: 12 }}>
                  Read the Rules
                </Link>
              </div>
            )}

            {/* Just Sign Up to Team Up */}
            {(isOpen || isManualOpen || isUpcoming) && event.typeSlug !== 'awards' && (
              <div className="card" style={{ marginTop: 16 }}>
                <div className={styles.sideTitle}>Just Sign Up to Team Up</div>
                <p style={{ color: '#cfcfcf', fontSize: 14, lineHeight: 1.6 }}>
                  No pre-formed team required. Register solo and we'll be in touch to sort your team. Register sooner for better chances.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Before scores exist: tell visitors this is where they'll show up */}
        {!isComplete && !isLive && !isFinale && (
          <div id="scores" className={styles.scoresAnchor}>
            <div className="section-title" style={{ marginTop: 48 }}>Scores</div>
            <div className="card" style={{ textAlign: 'center', color: 'var(--sq-gray)', padding: 32 }}>
              {isEventDay
                ? 'Live scores will appear here as soon as the first round is judged — check back, this page updates on its own.'
                : `Live scores will show here on ${formatDate(event.date)}, updated as the judges enter them.`}
            </div>
          </div>
        )}

        {/* Results — final for complete events, live (not final) on event day */}
        {(isComplete || isLive) && (
          <div id="scores" className={styles.scoresAnchor}>
            <div className="section-title" style={{ marginTop: 48 }}>{isLive ? 'Live Standings' : 'Results'}</div>
            {isLive && (
              <div className={styles.liveNote}>
                <span className={styles.liveDot} /> LIVE · NOT FINAL
                <span className={styles.liveMeta}>
                  Scores update as the judges enter them
                  {live?.updatedAt && ` · last update ${new Date(live.updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`}
                </span>
              </div>
            )}

            <div className={styles.divTabs}>
              {visibleDivisions.map(div => (
                <button
                  key={div}
                  className={`${styles.tab} ${activeDivision === div ? styles.tabActive : ''}`}
                  onClick={() => setActiveDivision(div)}
                >
                  {div}
                </button>
              ))}
            </div>

            {resultsLoading ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--sq-gray)', padding: 48 }}>
                Loading results…
              </div>
            ) : results.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: 'var(--sq-gray)', padding: 48 }}>
                {shown == null
                  ? 'Results not yet published for this event.'
                  : `No ${activeDivision} teams in this event.`}
              </div>
            ) : (
              <>
              <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table className="lb" style={{ minWidth: 320 + roundCols.length * 44 + (showJpp ? 60 : 0) }}>
                  <thead>
                    <tr>
                      <th style={{ width: 52 }}>#</th>
                      <th>Team</th>
                      {roundCols.map(c => (
                        <th key={c.idx} style={{ textAlign: 'center', width: 44 }}>{c.label}</th>
                      ))}
                      <th style={{ textAlign: 'right' }}>{roundCols.length > 0 ? 'Total' : 'Score'}</th>
                      {showJpp && <th style={{ textAlign: 'right' }} title="Points × 1000 ÷ team jump numbers">JPP</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(result => (
                      <tr key={result.teamId}>
                        <td className={`rank ${result.rank <= 3 ? `rank-${result.rank}` : ''}`}>{result.rank}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{result.teamName}</div>
                          <div style={{ color: 'var(--sq-gray)', fontSize: 12, marginTop: 2 }}>
                            {result.members.map(m => m.name).join(' · ')}
                          </div>
                        </td>
                        {roundCols.map(c => {
                          const pts = result.roundScores?.[c.idx] ?? 0
                          const busts = result.roundBusts?.[c.idx] ?? 0
                          return (
                            <td key={c.idx} style={{ textAlign: 'center', fontSize: 13, fontWeight: 600 }}>
                              {busts > 0 ? `${pts}(${busts})` : pts}
                            </td>
                          )
                        })}
                        <td className="pts">{result.rawScore}</td>
                        {showJpp && <td className="pts">{result.jpp != null ? result.jpp.toFixed(1) : '—'}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showJpp && (
                <p style={{ color: 'var(--sq-gray)', fontSize: 12, marginTop: 8 }}>
                  JPP = points × 1000 ÷ the team's total jump numbers — the handicap ranking.
                </p>
              )}
              {roundCols.some(c => c.label === 'JO') && (
                <p style={{ color: 'var(--sq-gray)', fontSize: 12, marginTop: 8 }}>
                  JO = jump-off round. Scores in parentheses are busts.
                </p>
              )}
              </>
            )}

            {/* Hop to season-wide views */}
            {isComplete && published != null && (
              <div
                style={{
                  marginTop: 24,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  justifyContent: 'center',
                }}
              >
                <Link to="/leaderboard" className="btn btn-primary">
                  Full Season Leaderboard
                </Link>
                <Link to="/leaderboard#individual" className="btn btn-ghost">
                  Individual Standings
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />

      {notifyOpen && (
        <NotifyMeModal eventName={event.name} onClose={() => setNotifyOpen(false)} />
      )}
    </>
  )
}
