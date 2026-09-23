/**
 * Proves sign-ins for one account are queued, so concurrent sessions cannot overwrite each other.
 * The cross-server half is proved against a real Postgres in tests/int/key-lock.int.spec.ts.
 */

import { describe, expect, it } from 'vitest'
import {
  SHARED_LOCK_TIMEOUT,
  withAdvisoryLock,
  withKeyLock,
  type LockPool,
} from '../../src/lib/key-lock'

const tick = () => new Promise((resolve) => setTimeout(resolve, 5))

describe('withKeyLock', () => {
  it('runs work for the same key one at a time, in order', async () => {
    const events: string[] = []
    const job = (name: string) => async () => {
      events.push(`${name} start`)
      await tick()
      events.push(`${name} end`)
      return name
    }

    const results = await Promise.all([
      withKeyLock('student-a', job('first')),
      withKeyLock('student-a', job('second')),
      withKeyLock('student-a', job('third')),
    ])

    expect(results).toEqual(['first', 'second', 'third'])
    expect(events).toEqual([
      'first start',
      'first end',
      'second start',
      'second end',
      'third start',
      'third end',
    ])
  })

  it('lets different keys run side by side', async () => {
    const events: string[] = []
    const job = (name: string) => async () => {
      events.push(`${name} start`)
      await tick()
      events.push(`${name} end`)
    }

    await Promise.all([withKeyLock('student-a', job('a')), withKeyLock('student-b', job('b'))])

    expect(events.slice(0, 2).sort()).toEqual(['a start', 'b start'])
  })

  it('keeps the queue moving after a failure, and still reports it', async () => {
    const failing = withKeyLock('student-c', async () => {
      throw new Error('wrong password')
    })
    const next = withKeyLock('student-c', async () => 'signed in')

    await expect(failing).rejects.toThrow('wrong password')
    await expect(next).resolves.toBe('signed in')
  })
})

/** A stand-in pool that records the statements sent to it. */
function fakePool(options: { failOn?: string } = {}) {
  const statements: string[] = []
  const released: (Error | undefined)[] = []
  const pool: LockPool = {
    async connect() {
      return {
        async query(text: string) {
          statements.push(text)
          if (options.failOn && text.startsWith(options.failOn)) throw new Error(`${text} failed`)
        },
        release(error?: Error) {
          released.push(error)
        },
      }
    },
  }
  return { pool, statements, released }
}

describe('withAdvisoryLock', () => {
  it('takes a time-limited lock in a transaction, runs the work, then commits', async () => {
    const { pool, statements, released } = fakePool()

    await expect(withAdvisoryLock(pool, 'student-a', async () => 'signed in')).resolves.toBe(
      'signed in',
    )

    expect(statements).toEqual([
      'BEGIN',
      `SET LOCAL lock_timeout = '${SHARED_LOCK_TIMEOUT}'`,
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      'COMMIT',
    ])
    expect(released).toEqual([undefined])
  })

  it('rolls back, which frees the lock, when the work fails', async () => {
    const { pool, statements, released } = fakePool()

    await expect(
      withAdvisoryLock(pool, 'student-a', async () => {
        throw new Error('wrong password')
      }),
    ).rejects.toThrow('wrong password')

    expect(statements.at(-1)).toBe('ROLLBACK')
    expect(released).toEqual([undefined])
  })

  it('does not run the work when the lock cannot be taken in time', async () => {
    const { pool, released } = fakePool({ failOn: 'SELECT pg_advisory_xact_lock' })
    let ran = false

    await expect(
      withAdvisoryLock(pool, 'student-a', async () => {
        ran = true
      }),
    ).rejects.toThrow('failed')

    expect(ran).toBe(false)
    expect(released).toEqual([undefined])
  })

  it('destroys a connection that cannot roll back, so it cannot keep holding the lock', async () => {
    const { pool, released } = fakePool({ failOn: 'ROLLBACK' })

    await expect(
      withAdvisoryLock(pool, 'student-a', async () => {
        throw new Error('wrong password')
      }),
    ).rejects.toThrow('wrong password')

    expect(released[0]).toBeInstanceOf(Error)
  })
})
