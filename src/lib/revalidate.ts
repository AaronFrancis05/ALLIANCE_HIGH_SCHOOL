/**
 * Rebuilds the affected static pages when an editor publishes (NFR-02).
 *
 * The public site is statically generated, so without this a published post would not
 * appear until the next build. Publishing must show up within a few seconds (P1-T6).
 */

import type { CollectionAfterChangeHook, GlobalAfterChangeHook } from 'payload'
import { revalidatePath } from 'next/cache'
import { logger } from './logger'

type Doc = Record<string, unknown>

type PathsFor = (args: { doc: Doc; previousDoc?: Doc }) => string[]

/**
 * Collections and globals declare separate hook types, but the work is identical, so the
 * logic lives here once and each kind gets a thin, correctly typed wrapper below.
 */
function revalidate(pathsFor: PathsFor, doc: Doc, previousDoc?: Doc): void {
  // Nothing to revalidate while a draft is being autosaved.
  if (doc?._status === 'draft' && previousDoc?._status !== 'published') return

  // Scripts such as the seed run outside a request, where there are no cached pages
  // to clear. Skip quietly rather than warning on every row.
  if (process.env.NEXT_RUNTIME === undefined) return

  try {
    const paths = new Set(pathsFor({ doc, previousDoc }))

    // If the slug changed, the old address needs clearing too.
    if (previousDoc?.slug && previousDoc.slug !== doc?.slug) {
      pathsFor({ doc: previousDoc }).forEach((path) => paths.add(path))
    }

    for (const path of paths) revalidatePath(path)
    logger.debug('Revalidated paths after change', { paths: [...paths] })
  } catch (error) {
    // A failed revalidation must never block the editor's save.
    logger.warn('Could not revalidate after change', { error })
  }
}

export function revalidateAfterChange(pathsFor: PathsFor): CollectionAfterChangeHook {
  return async ({ doc, previousDoc }) => {
    revalidate(pathsFor, doc as Doc, previousDoc as Doc)
    return doc
  }
}

export function revalidateGlobalAfterChange(pathsFor: PathsFor): GlobalAfterChangeHook {
  return async ({ doc, previousDoc }) => {
    revalidate(pathsFor, doc as Doc, previousDoc as Doc)
    return doc
  }
}
