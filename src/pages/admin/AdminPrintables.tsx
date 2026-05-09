import { useState } from 'react'
import type { TeamAssignment, TeamRegistration, EventInstance } from '../../types'
import {
  buildRegMap, openPrint,
  manifestSlipsHtml, checkInListHtml, paymentStatusHtml, teamsManifestHtml,
} from '../../utils/printHtml'
import styles from './AdminPrintables.module.css'

interface Props {
  event: EventInstance
  assignments: TeamAssignment[]
  registrations: TeamRegistration[]
}

export default function PrintablesTab({ event, assignments, registrations }: Props) {
  const [copied, setCopied] = useState<string | null>(null)
  const regById = buildRegMap(registrations)
  const teams = assignments.filter(a => a.eventId === event.id)

  function shareUrl(type: string) {
    return `${window.location.origin}/print/${event.id}/${type}`
  }

  function mailtoLink(title: string, type: string) {
    const url = shareUrl(type)
    const subject = encodeURIComponent(`${event.name} — ${title}`)
    const body = encodeURIComponent(`Print-ready ${title.toLowerCase()} for ${event.name}:\n\n${url}\n\nOpen the link and use Ctrl+P / ⌘P to print or save as PDF.`)
    return `mailto:?subject=${subject}&body=${body}`
  }

  function copyLink(type: string) {
    navigator.clipboard.writeText(shareUrl(type))
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const prints = [
    {
      id: 'slips',
      icon: '✂',
      title: 'Manifest Slips',
      sub: '2-up cut-outs • one slip per team',
      action: () => openPrint(manifestSlipsHtml(teams, regById, event)),
      disabled: teams.length === 0,
    },
    {
      id: 'checkin',
      icon: '☑',
      title: 'Check-In List',
      sub: 'Alphabetical • checkbox per person',
      action: () => openPrint(checkInListHtml(registrations, event)),
      disabled: registrations.length === 0,
    },
    {
      id: 'payment',
      icon: '$',
      title: 'Payment Status',
      sub: 'Owes vs paid • collect day-of',
      action: () => openPrint(paymentStatusHtml(registrations, event)),
      disabled: registrations.length === 0,
    },
    {
      id: 'teams',
      icon: '⚑',
      title: 'Teams Manifest',
      sub: 'All teams with PAID / OWES',
      action: () => openPrint(teamsManifestHtml(teams, regById, event)),
      disabled: teams.length === 0,
    },
  ]

  return (
    <div className={styles.container}>
      <p className={styles.hint}>
        Print opens a ready-to-print page in a new tab. Share copies a link anyone can open and print, or paste into an email.
      </p>
      <div className={styles.grid}>
        {prints.map(p => (
          <div key={p.id} className={`${styles.card} ${p.disabled ? styles.cardDisabled : ''}`}>
            <span className={styles.icon}>{p.icon}</span>
            <div className={styles.cardText}>
              <div className={styles.cardTitle}>{p.title}</div>
              <div className={styles.cardSub}>{p.sub}</div>
            </div>
            <div className={styles.cardActions}>
              <button
                className={styles.printBtn}
                onClick={p.action}
                disabled={p.disabled}
              >
                → Print
              </button>
              <button
                className={`${styles.shareBtn} ${copied === p.id ? styles.shareBtnCopied : ''}`}
                onClick={() => copyLink(p.id)}
                disabled={p.disabled}
                title="Copy shareable link"
              >
                {copied === p.id ? '✓ Copied' : '⎘ Copy link'}
              </button>
              <a
                className={`${styles.emailBtn} ${p.disabled ? styles.emailBtnDisabled : ''}`}
                href={p.disabled ? undefined : mailtoLink(p.title, p.id)}
              >
                ✉ Email
              </a>
            </div>
          </div>
        ))}
      </div>
      {teams.length === 0 && (
        <p className={styles.noTeams}>No team assignments yet — use the Teaming tab to build teams first.</p>
      )}
    </div>
  )
}
