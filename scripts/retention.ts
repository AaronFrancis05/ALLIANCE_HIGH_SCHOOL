/**
 * Deletes applications, and their documents, twelve months after their last status change
 * (SRS section 6). See src/lib/retention.ts for the rule.
 *
 *   pnpm retention          dry run: lists what would be deleted, deletes nothing
 *   pnpm retention --apply  deletes it
 *
 * Meant to run on a schedule in production (for example weekly, from cron). Always run the
 * dry run first when changing anything about it.
 */

import dotenv from 'dotenv'

dotenv.config()

const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config.js')
const { APPLICATION_RETENTION_MONTHS, runApplicationRetention } = await import('../src/lib/retention.js')

const apply = process.argv.includes('--apply')
const payload = await getPayload({ config })
const report = await runApplicationRetention(payload, { apply })

const heading = apply ? 'Retention: deleted' : 'Retention dry run: would delete'
console.log(`\n${heading} (last status change before ${report.cutoff.slice(0, 10)}, ${APPLICATION_RETENTION_MONTHS} months)\n`)
console.log(`  Applications: ${report.applications.length}`)
for (const [status, count] of Object.entries(report.byStatus)) console.log(`    ${status}: ${count}`)
console.log(`  Their documents: ${report.documents}`)
console.log(`  Documents left without an application: ${report.orphanedDocuments}`)
if (report.applications.length) {
  console.log('\n  References:')
  for (const application of report.applications) {
    console.log(`    ${application.trackingCode}  ${application.status}  last changed ${application.lastChange.slice(0, 10)}`)
  }
}
console.log(apply ? '\nDone.\n' : '\nNothing was deleted. Run `pnpm retention --apply` to delete.\n')
process.exit(0)
