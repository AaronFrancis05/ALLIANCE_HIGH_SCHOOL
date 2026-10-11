/**
 * Audit trail (FR-23).
 *
 * Records who did what, when and from where, for logins, permission changes, fee
 * clearance changes and every report-card access attempt.
 *
 * Failures in a separate audit transaction are logged and swallowed. Failures inside the
 * caller's transaction are rethrown so the caller can roll back the operation.
 */

import type { PayloadRequest } from 'payload'
import { logger } from './logger'

export type AuditAction =
  | 'staff.login'
  | 'staff.login-failed'
  | 'staff.role-changed'
  | 'staff.invited'
  | 'staff.logout'
  | 'staff.password-changed'
  | 'staff.password-reset'
  | 'staff.reset-requested'
  | 'student.setup-code-sent'
  | 'student.setup-refused'
  | 'student.setup-completed'
  | 'student.portal-reset'
  | 'student.login'
  | 'student.login-failed'
  | 'student.logout'
  | 'student.password-changed'
  | 'clearance.changed'
  | 'clearance.imported'
  | 'reportcard.downloaded'
  | 'reportcard.refused'
  | 'reportcard.uploaded'
  | 'reportcard.term-released'
  | 'resource.downloaded'
  | 'resource.refused'
  | 'application.submitted'
  | 'application.status-changed'
  | 'application.document-opened'
  | 'application.document-refused'
  | 'retention.applied'

export interface AuditEntry {
  action: AuditAction
  targetType?: string
  targetId?: string
  /** Short human-readable context. Never put personal data or file keys here. */
  detail?: string
}

/** First address in X-Forwarded-For, or the direct peer. */
function clientIp(req: PayloadRequest): string {
  const forwarded = req.headers?.get?.('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers?.get?.('x-real-ip') ?? 'unknown'
}

export interface AuditOptions {
  /**
   * Write the entry inside the caller's database transaction instead of a new one. Use it
   * from hooks that run while a lock already holds a connection (sign-in), so the entry does
   * not need a connection of its own. The entry is then rolled back with the operation.
   */
  inTransaction?: boolean
}

export async function recordAudit(
  req: PayloadRequest,
  entry: AuditEntry,
  options: AuditOptions = {},
): Promise<void> {
  try {
    const actor = req.user
    await req.payload.create({
      collection: 'auditLogs',
      data: {
        action: entry.action,
        actorType: actor?.collection ?? 'anonymous',
        actorId: actor ? String(actor.id) : null,
        actorLabel: actor ? ((actor as { name?: string; admissionNo?: string }).name ?? (actor as { admissionNo?: string }).admissionNo ?? null) : null,
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        detail: entry.detail ?? null,
        ip: clientIp(req),
        userAgent: req.headers?.get?.('user-agent')?.slice(0, 255) ?? null,
      },
      // The log is written on behalf of the system, not the signed-in user.
      overrideAccess: true,
      ...(options.inTransaction ? { req } : {}),
    })
  } catch (error) {
    if (options.inTransaction) throw error
    logger.error('Could not write audit entry', { action: entry.action, error })
  }
}
