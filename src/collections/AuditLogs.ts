/**
 * Append-only record of sensitive actions (FR-23).
 *
 * Nobody can edit or delete an entry through the API or the admin panel, including the
 * super admin: a log that can be rewritten is not a log.
 */

import type { CollectionConfig } from 'payload'
import { denyAll, roles } from '../access/roles'

export const AuditLogs: CollectionConfig = {
  slug: 'auditLogs',
  labels: { singular: 'Audit entry', plural: 'Audit log' },
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['createdAt', 'action', 'actorLabel', 'targetType', 'ip'],
    group: 'Administration',
    description: 'Logins, permission changes, fee clearance changes and report card access.',
  },
  access: {
    read: roles('superAdmin'),
    // Entries are written by hooks with overrideAccess, never by a request.
    create: denyAll,
    update: denyAll,
    delete: denyAll,
  },
  timestamps: true,
  fields: [
    { name: 'action', type: 'text', required: true, index: true },
    {
      name: 'actorType',
      type: 'select',
      options: ['users', 'students', 'anonymous', 'system'],
      required: true,
    },
    { name: 'actorId', type: 'text', index: true },
    { name: 'actorLabel', type: 'text' },
    { name: 'targetType', type: 'text' },
    { name: 'targetId', type: 'text', index: true },
    { name: 'detail', type: 'text' },
    { name: 'ip', type: 'text' },
    { name: 'userAgent', type: 'text' },
  ],
}
