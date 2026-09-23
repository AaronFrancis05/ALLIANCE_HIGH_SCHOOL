/**
 * The shared account lock, against a real Postgres (needs `docker compose up -d`).
 *
 * Advisory locks belong to a database connection, so two connections from one pool behave
 * exactly like two separate servers. The in-process queue is deliberately bypassed here:
 * only Postgres stands between the two jobs.
 */

import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { beforeAll, describe, expect, it } from 'vitest'
import { withAdvisoryLock, type LockPool } from '../../src/lib/key-lock'

let pool: LockPool

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

describe('withAdvisoryLock on Postgres', () => {
  beforeAll(async () => {
    const payload: Payload = await getPayload({ config: await config })
    pool = (payload.db as unknown as { pool: LockPool }).pool
  })

  it('makes two connections take turns on the same key', async () => {
    const events: string[] = []
    const job = (name: string) => async () => {
      events.push(`${name} start`)
      await pause(200)
      events.push(`${name} end`)
    }

    await Promise.all([
      withAdvisoryLock(pool, 'int-test:same', job('first')),
      withAdvisoryLock(pool, 'int-test:same', job('second')),
    ])

    // Whichever got the lock first finished before the other started.
    expect(events[1]).toMatch(/ end$/)
    expect(events[2]).toMatch(/ start$/)
  })

  it('lets different keys run side by side', async () => {
    const events: string[] = []
    const job = (name: string) => async () => {
      events.push(`${name} start`)
      await pause(200)
      events.push(`${name} end`)
    }

    await Promise.all([
      withAdvisoryLock(pool, 'int-test:a', job('a')),
      withAdvisoryLock(pool, 'int-test:b', job('b')),
    ])

    expect(events.slice(0, 2).sort()).toEqual(['a start', 'b start'])
  })

  it('frees the lock after a failure', async () => {
    await expect(
      withAdvisoryLock(pool, 'int-test:fail', async () => {
        throw new Error('wrong password')
      }),
    ).rejects.toThrow('wrong password')

    await expect(withAdvisoryLock(pool, 'int-test:fail', async () => 'signed in')).resolves.toBe(
      'signed in',
    )
  })
})
