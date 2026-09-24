/**
 * The tracking lookup (FR-18): how a reference and a phone number are read and compared.
 */

import { describe, expect, it } from 'vitest'
import { samePhone, trackingLookupSchema } from '../../src/lib/application-tracking'
import { APPLICATION_STATUSES, STATUS_FOR_FAMILY } from '../../src/lib/application-status'

describe('trackingLookupSchema', () => {
  it('accepts the reference however the family types it', () => {
    for (const typed of ['AHSN-7Q4K2P', 'ahsn-7q4k2p', ' AHSN-7Q4K2P ', '7Q4K2P', 'AHSN7Q4K2P']) {
      const parsed = trackingLookupSchema.safeParse({ trackingCode: typed, guardianPhone: '0772123456' })
      expect(parsed.success && parsed.data.trackingCode).toBe('AHSN-7Q4K2P')
    }
  })

  it('refuses something that cannot be a reference', () => {
    const parsed = trackingLookupSchema.safeParse({ trackingCode: 'AHSN-1', guardianPhone: '0772123456' })
    expect(parsed.success).toBe(false)
  })
})

describe('samePhone', () => {
  it('matches the ways one Ugandan number is written', () => {
    expect(samePhone('0772 123456', '+256772123456')).toBe(true)
    expect(samePhone('256 772 123 456', '0772-123-456')).toBe(true)
  })

  it('refuses a different number', () => {
    expect(samePhone('0772 123456', '0772 123457')).toBe(false)
  })

  it('refuses a fragment, so a short guess cannot match', () => {
    expect(samePhone('123456', '0772 123456')).toBe(false)
    expect(samePhone('', '')).toBe(false)
  })
})

describe('family wording', () => {
  it('explains every status the admissions office can set', () => {
    for (const status of APPLICATION_STATUSES) {
      expect(STATUS_FOR_FAMILY[status.value].explanation.length).toBeGreaterThan(20)
    }
  })
})
