/**
 * Self-heal a known typo in registration URLs.
 *
 * `registration.furycoaching.com` does not resolve (NXDOMAIN — caused a dead
 * top-nav SIGN UP link on the live site). The working host is
 * `register.furycoaching.com`. If event data ever ships the typo (Firestore
 * eventConfig override, stale Fury record, hand-entered admin URL, etc.),
 * rewrite at render time so the CTA never dies.
 */
export function normalizeRegistrationUrl(url: string | undefined): string | undefined {
  if (!url) return url
  return url.replace('://registration.furycoaching.com', '://register.furycoaching.com')
}
