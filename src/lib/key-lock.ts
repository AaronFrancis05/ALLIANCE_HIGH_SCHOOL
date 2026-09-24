/**
 * Runs work for the same key one at a time, across every server process.
 *
 * Payload keeps each account's sessions as a list on the account and rewrites the whole list
 * on every sign-in and sign-out. Two of those for one student at the same moment both read
 * the old list, and whichever writes last silently drops the other's change: a new session
 * vanishes, or a revoked one comes back. Queuing that work per account closes the gap.
 *
 * Two layers:
 *   - an in-memory queue per key, so one process never holds more than one database
 *     connection waiting on the same account;
 *   - a Postgres advisory lock, so separate processes or servers sharing the database also
 *     take turns. Postgres releases it when the transaction ends or the connection drops,
 *     so a crashed server cannot leave an account locked.
 */

const tails = new Map<string, Promise<unknown>>()

/** How long to wait for another server to finish with the same account before giving up. */
export const SHARED_LOCK_TIMEOUT = '10s'

/** Queues work per key inside this process. */
export async function withKeyLock<T>(key: string, work: () => Promise<T>): Promise<T> {
  const previous = tails.get(key) ?? Promise.resolve()

  // Wait for whatever was queued before, whether it succeeded or not.
  const run = previous.then(work, work)
  const tail = run.catch(() => undefined)
  tails.set(key, tail)

  try {
    return await run
  } finally {
    // Only the last job in the queue may remove it, or a later job would lose its place.
    if (tails.get(key) === tail) tails.delete(key)
  }
}

/** The parts of a node-postgres pool this module uses, so it is not tied to the driver. */
export interface LockConnection {
  query(text: string, values?: unknown[]): Promise<unknown>
  /** Passing an error destroys the connection instead of returning it to the pool. */
  release(error?: Error): void
}

export interface LockPool {
  connect(): Promise<LockConnection>
}

/**
 * Holds a Postgres advisory lock on `key` while `work` runs.
 *
 * The lock is taken inside a transaction on its own connection, and `work` runs on other
 * connections, so it never shares this transaction. Throws if the lock is not free within
 * SHARED_LOCK_TIMEOUT, rather than leaving a sign-in hanging.
 */
export async function withAdvisoryLock<T>(
  pool: LockPool,
  key: string,
  work: () => Promise<T>,
): Promise<T> {
  const connection = await pool.connect()
  let broken: Error | undefined

  try {
    await connection.query('BEGIN')
    try {
      await connection.query(`SET LOCAL lock_timeout = '${SHARED_LOCK_TIMEOUT}'`)
      await connection.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [key])
      const result = await work()
      await connection.query('COMMIT')
      return result
    } catch (error) {
      await connection.query('ROLLBACK').catch((rollbackError: unknown) => {
        // A connection that cannot roll back may still hold the lock; drop it to free it.
        broken = rollbackError instanceof Error ? rollbackError : new Error('rollback failed')
      })
      throw error
    }
  } finally {
    connection.release(broken)
  }
}

/** Queues work per key in this process, then across processes through Postgres. */
export async function withSharedKeyLock<T>(
  pool: LockPool,
  key: string,
  work: () => Promise<T>,
): Promise<T> {
  return withKeyLock(key, () => withAdvisoryLock(pool, key, work))
}
