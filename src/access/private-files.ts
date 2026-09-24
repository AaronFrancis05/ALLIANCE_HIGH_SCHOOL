/**
 * Keeps the storage key of a private upload on the server (FR-08).
 *
 * Payload returns an upload's `prefix`, `filename` and `url` with every read. For the
 * private collections (library files, report cards, admission documents) those name the
 * object in the private bucket, so they must not reach a browser, even for a row the
 * requester may read. This `afterRead` hook removes them from REST and GraphQL responses.
 *
 * It leaves local API reads alone: the download routes and server-rendered pages run on
 * the server and need the key to sign a URL. Active staff keep the fields too, since the
 * admin panel shows and replaces the file.
 */

import type { CollectionAfterReadHook } from 'payload'
import { isStaff, type StaffUser } from './roles'

export const PRIVATE_FILE_FIELDS = ['prefix', 'filename', 'url', 'thumbnailURL'] as const

/** True when this read must not include the storage key. */
export function mustHideStorageKey(payloadAPI: 'GraphQL' | 'local' | 'REST', user: unknown): boolean {
  if (payloadAPI === 'local') return false
  return !isStaff(user as StaffUser)
}

export function withoutStorageKey<T extends Record<string, unknown>>(doc: T): T {
  const copy: Record<string, unknown> = { ...doc }
  for (const field of PRIVATE_FILE_FIELDS) delete copy[field]
  return copy as T
}

export const hideStorageKey: CollectionAfterReadHook = ({ doc, req }) => {
  if (!mustHideStorageKey(req.payloadAPI, req.user)) return doc
  return withoutStorageKey(doc)
}
