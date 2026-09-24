/**
 * Proves the storage key of a private upload never leaves the server through the API (FR-08).
 */

import { describe, expect, it } from 'vitest'
import { mustHideStorageKey, withoutStorageKey } from '../../src/access/private-files'

const student = { id: 9, collection: 'students', status: 'active' }
const editor = { id: 1, collection: 'users', role: 'editor', active: true }

describe('mustHideStorageKey', () => {
  it('hides the key from a student reading over REST or GraphQL', () => {
    expect(mustHideStorageKey('REST', student)).toBe(true)
    expect(mustHideStorageKey('GraphQL', student)).toBe(true)
  })

  it('hides the key from an anonymous API request', () => {
    expect(mustHideStorageKey('REST', null)).toBe(true)
  })

  it('hides the key from a deactivated staff account', () => {
    expect(mustHideStorageKey('REST', { ...editor, active: false })).toBe(true)
  })

  it('keeps the key for active staff, who manage the files in the admin panel', () => {
    expect(mustHideStorageKey('REST', editor)).toBe(false)
  })

  it('keeps the key for server-side reads, which sign the download URL', () => {
    expect(mustHideStorageKey('local', student)).toBe(false)
    expect(mustHideStorageKey('local', null)).toBe(false)
  })
})

describe('withoutStorageKey', () => {
  it('removes every field that names the object, and nothing else', () => {
    const doc = {
      id: 3,
      title: 'Physics past paper',
      filesize: 1263,
      prefix: 'resources',
      filename: 'physics.pdf',
      url: '',
      thumbnailURL: null,
    }

    expect(withoutStorageKey(doc)).toEqual({ id: 3, title: 'Physics past paper', filesize: 1263 })
  })

  it('does not change the document it was given', () => {
    const doc = { id: 3, filename: 'physics.pdf' }
    withoutStorageKey(doc)
    expect(doc.filename).toBe('physics.pdf')
  })
})
