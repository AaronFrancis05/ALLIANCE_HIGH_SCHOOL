import type { PayloadRequest } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { recordAudit } from '../../src/lib/audit'
import { logger } from '../../src/lib/logger'

vi.mock('../../src/lib/logger', () => ({ logger: { error: vi.fn() } }))

function request() {
  const create = vi.fn().mockResolvedValue({ id: 1 })
  const req = {
    headers: new Headers(),
    transactionID: 'login-transaction',
    payload: { create },
  } as unknown as PayloadRequest
  return { req, create }
}

const entry = { action: 'student.login' } as const

beforeEach(() => vi.clearAllMocks())

describe('recordAudit', () => {
  it('propagates an insert failure inside the caller transaction', async () => {
    const { req, create } = request()
    const error = new Error('insert failed')
    create.mockRejectedValue(error)

    await expect(recordAudit(req, entry, { inTransaction: true })).rejects.toBe(error)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ req }))
  })

  it.each([{}, { inTransaction: false }])(
    'logs and swallows a separate transaction failure (%j)',
    async (options) => {
      const { req, create } = request()
      const error = new Error('insert failed')
      create.mockRejectedValue(error)

      await expect(recordAudit(req, entry, options)).resolves.toBeUndefined()
      expect(create.mock.calls[0][0]).not.toHaveProperty('req')
      expect(logger.error).toHaveBeenCalledWith('Could not write audit entry', {
        action: entry.action,
        error,
      })
    },
  )

  it.each([true, false])(
    'writes successful audit entries (inTransaction: %s)',
    async (inTransaction) => {
      const { req, create } = request()
      await expect(recordAudit(req, entry, { inTransaction })).resolves.toBeUndefined()
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          collection: 'auditLogs',
          overrideAccess: true,
          data: expect.objectContaining({ action: 'student.login' }),
        }),
      )
      expect(logger.error).not.toHaveBeenCalled()
    },
  )
})
