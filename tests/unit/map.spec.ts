import { describe, expect, it } from 'vitest'
import { mapDirectionsUrl, mapEmbedUrl } from '../../src/lib/map'

const schoolName = 'Alliance High School Nansana'

describe('mapEmbedUrl', () => {
  it('searches for the school by name when nothing has been entered', () => {
    const url = new URL(mapEmbedUrl({ schoolName }))
    expect(url.origin).toBe('https://www.google.com')
    expect(url.searchParams.get('q')).toBe('Alliance High School Nansana, Nansana, Uganda')
    expect(url.searchParams.get('output')).toBe('embed')
  })

  it('pins the exact coordinates when the office has entered them', () => {
    const url = new URL(mapEmbedUrl({ schoolName, latitude: 0.3651, longitude: 32.5277 }))
    expect(url.searchParams.get('q')).toBe('0.3651,32.5277')
  })

  it('uses a pasted Google Maps embed link', () => {
    const pasted = 'https://www.google.com/maps/embed?pb=!1m18'
    expect(mapEmbedUrl({ schoolName, mapEmbedUrl: pasted })).toBe(pasted)
  })

  it('refuses to frame a link that is not Google Maps', () => {
    for (const bad of ['https://evil.example/maps', 'http://www.google.com/maps/embed', 'javascript:alert(1)']) {
      expect(new URL(mapEmbedUrl({ schoolName, mapEmbedUrl: bad })).searchParams.get('q')).toContain(
        schoolName,
      )
    }
  })

  it('ignores coordinates that cannot exist', () => {
    const url = new URL(mapEmbedUrl({ schoolName, latitude: 200, longitude: 32.5 }))
    expect(url.searchParams.get('q')).toContain(schoolName)
  })
})

describe('mapDirectionsUrl', () => {
  it('asks Google for directions to the school', () => {
    const url = new URL(mapDirectionsUrl({ schoolName }))
    expect(url.pathname).toBe('/maps/dir/')
    expect(url.searchParams.get('destination')).toContain(schoolName)
  })
})
