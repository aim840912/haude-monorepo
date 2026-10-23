/**
 * Pages that start with a full-bleed hero image: the header is transparent at the top
 * (white text over the photo) and <main> has no top padding.
 *
 * Match exact paths only. `pathname.includes('/farm-tours')` also matched
 * /farm-tours/<id>, which has no hero: in light mode the transparent header put white
 * nav text on a white page and the content slid under the header.
 */
const LOCALE = '(?:/[a-z]{2}(?:-[A-Z]{2})?)?'
const HERO_PATH = new RegExp(`^${LOCALE}(?:/|/farm-tours/?)?$`)

export function isHeroPath(pathname: string): boolean {
  return HERO_PATH.test(pathname)
}
