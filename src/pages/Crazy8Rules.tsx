import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Footer from '../components/Footer'
import styles from './Crazy8Rules.module.css'

// Rules copy lives here, not in the Google Doc — the site holds its own copy
// so the page stays readable if the doc moves or its sharing changes.
// Source doc: "Frikken Crazy 8 Rules" (Google Drive, FrikkenCrazy8s folder).

export default function Crazy8Rules() {
  return (
    <>
      <Nav />
      <div className="wrap" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div style={{ fontSize: 13, color: 'var(--sq-gray)', marginBottom: 16 }}>
          <Link to="/schedule" style={{ color: 'var(--sq-gray)' }}>Schedule</Link>
          {' / '}
          <Link to="/events/crazy8s/crazy8s-perris-2026" style={{ color: 'var(--sq-gray)' }}>Frikken Crazy 8's</Link>
          {' / Rules'}
        </div>

        <h1 className="display" style={{ fontSize: 'clamp(26px, 6vw, 46px)' }}>
          Frikken Crazy 8's — Rules
        </h1>

        <div className={styles.prose}>
          <h3>Objective</h3>
          <p>
            Score as many points as possible by performing designated formations and achieving
            specific combinations of points during each dive.
          </p>

          <h3>General Rules</h3>

          <h4>Formation Selection</h4>
          <ul>
            <li>Choose any formations from the provided menu.</li>
            <li>You must attempt at least three different formations in a dive.</li>
            <li>There must be two different formations attempted before you can score the same formation again.</li>
            <li>Separation between each point is required.</li>
          </ul>

          <h4>Point Declaration</h4>
          <ul>
            <li>Your video person will declare what formations were attempted when you submit your video.</li>
            <li>The primary purpose is to speed up and assist judging — it has no other effect.</li>
          </ul>

          <h4>Making Formations</h4>
          <ul>
            <li>You can mirror and engineer formations per standard 8-way rules.</li>
            <li>You can exit the plane in any formation you like.</li>
            <li>Working time is 50 seconds from exit.</li>
          </ul>

          <h3>Scoring</h3>

          <div className={styles.callout}>
            <strong>Formations are not points.</strong> If you do not have a valid scoring set,
            the formations individually have zero points. You will get a formation card for each
            full and partial point you complete. You will keep these until the end of the day,
            when they will be submitted for scoring.
          </div>

          <h4>Partial Points</h4>
          <ul>
            <li>You'll receive ¼ point if 4 people are in the formation.</li>
            <li>You'll receive ½ point if 6 people are in the formation.</li>
            <li>
              Partial points are worthless on their own but can be combined:
              <ul>
                <li>Combine four ¼ points to make 1 full point.</li>
                <li>Combine two ½ points to make 1 full point.</li>
              </ul>
            </li>
          </ul>

          <h4>Formation Combinations</h4>
          <ul>
            <li>Registered formations by themselves are not worth points.</li>
            <li>Specific combinations of formations are worth points. These special combinations are revealed throughout the meet.</li>
            <li>The order of the scoring combinations does not matter. As long as you have the required cards, you can cash them in for points.</li>
            <li>Scoring combinations will be revealed <strong>after</strong> rounds 1, 2, 3, and 4.</li>
          </ul>

          <h3>Cards & Tracking</h3>
          <ul>
            <li>
              You'll get a card for each successful formation (or partial formation). Remember,
              making a formation does not give you points — you must combine them in particular
              ways to get points.
            </li>
            <li>
              At the end of the meet, each team will send a captain to the judging table.
              Your team will exchange their cards for points.
            </li>
          </ul>

          <h3>Strategy</h3>
          <ul>
            <li>Plan your dives to include various formations to maximize your chances of hitting valuable combinations.</li>
            <li>Pay attention to the revealed combinations between rounds to adjust your strategy accordingly.</li>
            <li>All formations will be inside at least one scoring combination, with some formations being used twice.</li>
            <li>Trading is allowed. Ganging up on the front-runner is wise.</li>
            <li>Cards from previous years and Fresh Meet are valid.</li>
          </ul>

          <h3>Formation Clarifications</h3>
          <ul>
            <li><strong>Speedbody</strong> — in the diagram, the right hand is a shared grip on leg/arm. The left hand is free.</li>
            <li><strong>Deez Donuts</strong> — the two donuts are attached by the center open accordion grip.</li>
          </ul>

          <h3>Playthrough Example</h3>
          <div className={styles.callout}>
            <strong>Every combo and point value below is made up.</strong> The real scoring
            combinations are a surprise — they're revealed round by round at the meet and look
            nothing like these. This example only shows the flow of the game and some possible
            strategies.
          </div>
          <p className={styles.exampleNote}>
            The fictional Team SkyHigh is captained by Dana, who will pick the dives and make
            the strategy.
          </p>

          <div className={`card ${styles.roundCard}`}>
            <div className={styles.roundTitle}>Round 1</div>
            <p>
              <strong>Dana's plan:</strong> Dana was thinking about starting the competition with
              formations that are both easy to perform and likely to appear in valuable
              combinations later. She decides on Star, Open Accordion, Friendly, and Vulture.
            </p>
            <p>
              <strong>Jump results:</strong> Team SkyHigh completed three formations and was on the
              way to the last one — two Stars, one Open Accordion, one Friendly, and half of a
              Vulture (a bust).
            </p>
            <p><strong>Cards earned:</strong> 2 Star, 1 Open Accordion, 1 Friendly, ½ Vulture.</p>
            <p><strong>Revealed scoring combinations after round 1:</strong></p>
            <ul className={styles.combosList}>
              <li>Crank, Opposed Diamond — 1 point</li>
              <li>Star, Friendly, Flipflake — 3 points</li>
            </ul>
          </div>

          <div className={`card ${styles.roundCard}`}>
            <div className={styles.roundTitle}>Round 2</div>
            <p>
              <strong>Dana's plan:</strong> With the revealed combination of Star, Friendly, and
              Flipflake worth points, Dana sees an opportunity to capitalize on what they already
              have. They have two Star and one Friendly card, so adding Flipflake would complete
              this valuable combination. She also adds Starzip to meet the "at least three
              formations per dive" rule.
            </p>
            <p>
              <strong>Jump results:</strong> Team SkyHigh completes two Flipflakes, one Friendly,
              and one Starzip.
            </p>
            <p>
              <strong>Current cards:</strong> 2 Star, 2 Flipflake, 1 Open Accordion, 2 Friendly,
              1 Starzip, ½ Vulture.
            </p>
            <p><strong>Revealed combinations after round 2:</strong></p>
            <ul className={styles.combosList}>
              <li>Crank, Opposed Diamond — 1 point</li>
              <li>Star, Friendly, Flipflake — 3 points</li>
              <li>Helix, Vulture — 5 points</li>
              <li>Phalanx, Open Accordion, Double Rainbows — 7 points</li>
            </ul>
          </div>

          <div className={`card ${styles.roundCard}`}>
            <div className={styles.roundTitle}>Round 3</div>
            <p>
              <strong>Dana's plan:</strong> With the new combination revealed, Dana focuses on
              completing the second set of Star, Friendly, and Flipflake — she only needs one more
              Friendly! For the others, she notes that the Helix and Vulture might be too hard for
              her group. She has an Open Accordion though, and thinks that Double Rainbows and a
              Phalanx are worth a shot. She'll also end in a Star, just because it is easy to
              remember.
            </p>
            <p>
              <strong>Jump results:</strong> The team gets through Friendly, Phalanx (½ point),
              Double Rainbows, and Star (¼ point). There was a missing person on the Phalanx, and
              the Star was on the way to completion at 50 seconds.
            </p>
            <p>
              <strong>Current cards:</strong> 2 Star + ¼ Star, 2 Flipflake, 2 Friendly,
              1 Open Accordion, 1 Starzip, 1 Double Rainbows, ½ Phalanx, ½ Vulture.
            </p>
            <p><strong>Revealed combinations after round 3:</strong></p>
            <ul className={styles.combosList}>
              <li>Crank, Opposed Diamond — 1 point</li>
              <li>Star, Friendly, Flipflake — 3 points</li>
              <li>Helix, Vulture — 5 points</li>
              <li>Phalanx, Open Accordion, Double Rainbows — 7 points</li>
              <li>In Out, Deez Donuts — 7 points</li>
              <li>Compressed, Speedbody, Double Rainbows — 9 points</li>
            </ul>
          </div>

          <div className={`card ${styles.roundCard}`}>
            <div className={styles.roundTitle}>Round 4</div>
            <p>
              <strong>Dana's plan:</strong> Dana is thrilled she has two complete sets of Star,
              Friendly, and Flipflake. She is also very close to scoring Phalanx, Open Accordion,
              and Double Rainbows — they just need one half Phalanx. For the rest of the dive, she
              decides to take a chance on Deez Donuts, Satellite, and Vulture, thinking that she
              might strike it lucky in the end.
            </p>
            <p><strong>Jump results:</strong> Team SkyHigh makes one of each point in time.</p>
            <p>
              <strong>Current cards:</strong> 2 Star + ¼ Star, 2 Flipflake, 2 Friendly,
              1 Open Accordion, 1 Starzip, 1 Satellite, 1 Double Rainbows, 1 Deez Donuts,
              1½ Phalanx, 1½ Vulture.
            </p>
            <p><strong>Revealed combinations after round 4:</strong></p>
            <ul className={styles.combosList}>
              <li>Crank, Opposed Diamond — 1 point</li>
              <li>Star, Friendly, Flipflake — 3 points</li>
              <li>Helix, Vulture — 5 points</li>
              <li>Phalanx, Open Accordion, Double Rainbows — 7 points</li>
              <li>In Out, Deez Donuts — 7 points</li>
              <li>Compressed, Speedbody, Double Rainbows — 9 points</li>
              <li>Yeesh, Starzip — 9 points</li>
              <li>Satellite, Phalanx, Vulture — 14 points</li>
            </ul>
          </div>

          <div className={`card ${styles.roundCard}`}>
            <div className={styles.roundTitle}>Final Scoring Cash-Out</div>
            <p>Dana gathers the team and all of her cards. She is planning on cashing out:</p>
            <ul>
              <li>2 Stars, 2 Flipflakes, 2 Friendlies → 2 × 3 = 6 points</li>
              <li>1 Phalanx, 1 Open Accordion, 1 Double Rainbows → 7 points</li>
            </ul>
            <p>Making her meet total 13 points.</p>
            <p>However, one of her teammates stops her and points out they could instead turn in:</p>
            <ul>
              <li>2 Stars, 2 Flipflakes, 2 Friendlies → 2 × 3 = 6 points</li>
              <li>1 Satellite, 1 Phalanx, 1 Vulture → 14 points</li>
            </ul>
            <p>For a total of 20!</p>
            <p>
              Dana does so, and waits eagerly to see if they out-crafted and out-flew the
              other teams!
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
