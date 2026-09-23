/**
 * Runs work for the same key one at a time, inside this server process.
 *
 * Payload keeps each account's sessions as a list on the account and rewrites the whole list
 * on every sign-in. Two sign-ins for one student at the same moment both read the old list,
 * and whichever writes last silently drops the other's session, so that browser is signed
 * out on its next request. Queuing sign-ins per account closes that gap.
 *
 * The queue lives in memory, so it only covers one process. That matches the single-server
 * deployment; running several instances would need a shared lock instead.
 */

const tails = new Map<string, Promise<unknown>>()

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
