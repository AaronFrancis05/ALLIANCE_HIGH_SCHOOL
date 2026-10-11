/**
 * Proves the shared Zod checks on values from outside: ids and slugs in URLs reach a query
 * only when they have the right shape.
 */

import { describe, expect, it } from 'vitest'
import { fileExtension, parseRecordId, parseSlug, uploadFilenameSchema } from '../../src/lib/validation'

describe('parseRecordId', () => {
  it('accepts a positive whole number', () => {
    expect(parseRecordId('42')).toBe(42)
  })

  it('refuses everything else, including injection attempts', () => {
    for (const value of ['', '0', '-1', '1.5', 'abc', '1 OR 1=1', "1'; DROP TABLE users;--", '1e400', '<script>', undefined]) {
      expect(parseRecordId(value), String(value)).toBeNull()
    }
  })
})

describe('parseSlug', () => {
  it('accepts the slugs the slug field produces', () => {
    expect(parseSlug('sports-day-2026')).toBe('sports-day-2026')
    expect(parseSlug('-trailing-')).toBe('-trailing-')
  })

  it('refuses anything else', () => {
    for (const value of ['', 'Sports-Day', 'a b', '../admin', 'a"><script>', "x' OR '1'='1", 'a'.repeat(201)]) {
      expect(parseSlug(value), value).toBeNull()
    }
  })
})

describe('uploadFilenameSchema', () => {
  it('accepts an ordinary name with an extension', () => {
    expect(uploadFilenameSchema.safeParse('S4 Physics holiday work (2026).pdf').success).toBe(true)
  })

  it('refuses paths, hidden characters and missing extensions', () => {
    for (const value of ['a/b.pdf', 'a\b.pdf', 'tab\there.pdf', 'noext', '.p']) {
      expect(uploadFilenameSchema.safeParse(value).success, value).toBe(false)
    }
  })

  it('reads the extension in lower case', () => {
    expect(fileExtension('Notes.PDF')).toBe('pdf')
    expect(fileExtension('archive.tar.gz')).toBe('gz')
    expect(fileExtension('none')).toBe('')
  })
})
