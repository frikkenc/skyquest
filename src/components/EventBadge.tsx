import type { EventSlug } from '../types'
import styles from './EventBadge.module.css'

interface Props {
  slug: EventSlug
  size?: number
}

const BADGE_MAP: Record<EventSlug, { img?: string; filter?: string; label?: string; bg?: string }> = {
  'scsl':             { img: '/logos/scsl.png' },
  'poker-run':        { img: '/logos/dueling-dzs.png', filter: 'hue-rotate(40deg)' },
  'dueling-dzs':      { img: '/logos/dueling-dzs.png' },
  'crazy8s':          { img: '/logos/crazy8.png' },
  'ghost-nationals':  { img: '/logos/ghost-nationals.png' },
  'fury-classic-8way':{ img: '/logos/fury-classic-8.png' },
  'awards':           { label: '🏅', bg: 'var(--sq-yellow)' },
}

export default function EventBadge({ slug, size = 80 }: Props) {
  const b = BADGE_MAP[slug]
  const style: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: Math.round(size * 0.175),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: b.bg ?? 'transparent',
    border: b.bg ? '3px solid #fff' : 'none',
  }

  if (b.img) {
    return (
      <div style={style} className={styles.badge}>
        <img
          src={b.img}
          alt={slug}
          style={{ width: '88%', height: '88%', objectFit: 'contain', filter: b.filter }}
        />
      </div>
    )
  }

  return (
    <div style={style} className={styles.badge}>
      <span style={{ fontSize: size * 0.35 }}>{b.label}</span>
    </div>
  )
}
