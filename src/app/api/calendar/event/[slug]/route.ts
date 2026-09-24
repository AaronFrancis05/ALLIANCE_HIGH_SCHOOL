/**
 * An event as a calendar file (FR-20): /api/calendar/event/<slug>.
 *
 * Only published events are served; a draft or unknown slug is a plain 404. The file is
 * public, so it may be cached briefly like the event page itself.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getPayloadClient } from '../../../../../lib/payload'
import { buildEventIcs } from '../../../../../lib/ics'
import { env } from '../../../../../lib/env'

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params
  const payload = await getPayloadClient()

  // Read as the public: the collection's own rule leaves only published events visible.
  const found = await payload.find({
    collection: 'events',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })
  const event = found.docs[0]
  if (!event?.slug) {
    return NextResponse.json({ error: 'No such event.' }, { status: 404 })
  }

  const host = new URL(env.siteUrl).host
  const body = buildEventIcs({
    uid: `event-${event.id}@${host}`,
    title: event.title,
    description: event.summary,
    location: event.location,
    url: `${env.siteUrl}/events/${event.slug}`,
    start: event.startDate,
    end: event.endDate,
  })

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.slug}.ics"`,
      'Cache-Control': 'public, max-age=600',
    },
  })
}
