/**
 * Proves sign-ins for one account are queued, so concurrent sessions cannot overwrite each other.
 */

import { describe, expect, it } from 'vitest'
import { withKeyLock } from '../../src/lib/key-lock'

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
