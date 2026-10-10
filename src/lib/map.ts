/**
 * The Google Maps addresses for the contact page (FR-21).
 *
 * The map always shows something useful. Exact coordinates entered by the office win;
 * failing that, an embed link pasted from Google Maps; failing both, a search for the
 * school's name, which Google resolves to its own listing. None of these needs an API
 * key, and every embed is served from www.google.com, which the CSP allows (src/proxy.ts).
 */

export interface MapLocation {
  schoolName: string
  mapEmbedUrl?: string | null
  latitude?: number | null
  longitude?: number | null
}

const GOOGLE_MAPS = 'https://www.google.com/maps'

function hasCoordinates(location: MapLocation): location is MapLocation & {
  latitude: number
  longitude: number
} {
  return (
    typeof location.latitude === 'number' &&
    typeof location.longitude === 'number' &&
    Math.abs(location.latitude) <= 90 &&
    Math.abs(location.longitude) <= 180
  )
}

/** Only an https link to Google Maps may be framed; anything else falls back to search. */
function isGoogleEmbed(url: string | null | undefined): url is string {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && parsed.hostname === 'www.google.com' && parsed.pathname.startsWith('/maps')
  } catch {
    return false
  }
}

/** What Google is asked to find: the pin if we have one, otherwise the school by name. */
function searchQuery(location: MapLocation): string {
  if (hasCoordinates(location)) return `${location.latitude},${location.longitude}`
  return `${location.schoolName}, Nansana, Uganda`
}

export function mapEmbedUrl(location: MapLocation): string {
  if (!hasCoordinates(location) && isGoogleEmbed(location.mapEmbedUrl)) return location.mapEmbedUrl
  const params = new URLSearchParams({ q: searchQuery(location), z: '16', output: 'embed' })
  return `${GOOGLE_MAPS}?${params.toString()}`
}

/** Opens Google Maps with directions to the school from wherever the visitor is. */
export function mapDirectionsUrl(location: MapLocation): string {
  const params = new URLSearchParams({ api: '1', destination: searchQuery(location) })
  return `${GOOGLE_MAPS}/dir/?${params.toString()}`
}
