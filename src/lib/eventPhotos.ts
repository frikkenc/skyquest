/**
 * Banner photo per event type — used as the visual backdrop on event detail pages.
 *
 * Returns a base name (no extension); render with `<picture>` + responsive sources:
 *   /img/{base}__banner-16x9.webp           (desktop)
 *   /img/{base}__banner-16x9.jpg
 *   /img/{base}__banner-16x9-mobile.webp    (mobile)
 *   /img/{base}__banner-16x9-mobile.jpg
 *
 * If a type doesn't have a specific photo yet, fall back to a generic sky-action shot.
 */
export const EVENT_PHOTO_BY_TYPE: Record<string, { base: string; alt: string }> = {
  // SCSL 4-way meets — clean 4-way over the Perris airfield
  'scsl': {
    base: '09_banner_5way_star',
    alt: '4-way formation skydive over Skydive Perris',
  },
  // Frikken Crazy 8s — 8-way mid-build
  'crazy8s': {
    base: '02_banner_8way_tight',
    alt: '8-way formation skydive over Skydive Perris',
  },
  // Fury Classic 8-way — formed 8-way, similar feel
  'fury-classic-8way': {
    base: '01_hero_8way_aerial',
    alt: '8-way formation skydive in freefall',
  },
  // Ghost Nationals — fly the actual Nationals draw, 4-way feel
  'ghost-nationals': {
    base: '06_hero_4way_clouds',
    alt: '4-way formation skydive in clouds',
  },
  // Poker Run — colorful action with clouds (no Poker Run-specific photo yet)
  'poker-run': {
    base: '06_hero_4way_clouds',
    alt: 'Formation skydive in clouds over Southern California',
  },
  // Dueling DZs — solo + group with SoCal hills (cross-DZ vibe)
  'dueling-dzs': {
    base: '07_hero_solo_clouds',
    alt: 'Skydivers in freefall with the SoCal hills below',
  },
  // Awards Show — Christy's Bombshelter awards-night photo
  'awards': {
    base: '11_awards_bombshelter_christy',
    alt: 'SkyQuest awards night at the Bombshelter',
  },
}

export function getEventPhoto(typeSlug: string) {
  return EVENT_PHOTO_BY_TYPE[typeSlug] ?? EVENT_PHOTO_BY_TYPE['scsl']
}
