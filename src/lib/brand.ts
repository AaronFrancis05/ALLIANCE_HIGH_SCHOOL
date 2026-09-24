/**
 * Brand asset paths, in one place.
 *
 * The crest carries a version in its URL. Browsers cache an image at a fixed path hard,
 * so when the artwork is replaced an old copy can otherwise sit in a visitor's cache for
 * weeks — which is exactly what happened when the redrawn crest was replaced with the
 * school's own. Raise `CREST_VERSION` whenever `pnpm crest` produces new artwork, and
 * every visitor fetches it again.
 */

const CREST_VERSION = 2

/** The crest, for use in `next/image` and plain `<img>` alike. */
export const CREST_SRC = `/brand/crest.png?v=${CREST_VERSION}`

/** Square version, used for social cards and structured data. */
export const CREST_SQUARE_SRC = `/brand/crest-512.png?v=${CREST_VERSION}`
