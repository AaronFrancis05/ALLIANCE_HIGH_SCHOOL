'use client'

/**
 * Sidebar panel on a staff account: whether its owner has accepted the invitation, and a
 * button for the super admin to send it again (FR-05).
 *
 * The button is only a convenience. The endpoint re-checks that the requester is the super
 * admin (canInviteStaff), whatever this component shows.
 */

import React, { useState } from 'react'
import { Button, toast, useAuth, useConfig, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { canInviteStaff } from '../../access/roles'

function formatDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null
  return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export function InvitationStatus() {
  const { id } = useDocumentInfo()
  const { user } = useAuth()
  const {
    config: {
      routes: { api },
    },
  } = useConfig()
  const invitedAt = useFormFields(([fields]) => fields.invitedAt?.value)
  const firstSignedInAt = useFormFields(([fields]) => fields.firstSignedInAt?.value)
  const [sending, setSending] = useState(false)
  const [sentAt, setSentAt] = useState<string | null>(null)

  if (!id) {
    return (
      <div className="ahsn-invite">
        <p className="ahsn-invite__title">Invitation</p>
        <p className="ahsn-invite__text">
          When you save, this person is emailed a link to choose their own password. You never
          need to know it.
        </p>
      </div>
    )
  }

  if (firstSignedInAt) {
    return (
      <div className="ahsn-invite ahsn-invite--done">
        <p className="ahsn-invite__title">Account set up</p>
        <p className="ahsn-invite__text">First signed in {formatDate(firstSignedInAt)}.</p>
      </div>
    )
  }

  // Accounts made before invitations existed were given a password directly.
  const legacy = !invitedAt && !sentAt

  async function resend() {
    setSending(true)
    try {
      const response = await fetch(`${api}/users/${id}/invite`, { method: 'POST', credentials: 'include' })
      const body = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) throw new Error(body.error ?? 'The invitation could not be sent.')
      setSentAt(new Date().toISOString())
      toast.success('Invitation sent.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The invitation could not be sent.')
    } finally {
      setSending(false)
    }
  }

  const lastSent = formatDate(sentAt ?? invitedAt)

  return (
    <div className={legacy ? 'ahsn-invite' : 'ahsn-invite ahsn-invite--pending'}>
      <p className="ahsn-invite__title">{legacy ? 'No invitation on record' : 'Invitation pending'}</p>
      <p className="ahsn-invite__text">
        {legacy
          ? 'This account was set up before invitations were used. Sending one lets its owner choose a new password.'
          : `${lastSent ? `Invited ${lastSent}. ` : ''}They have not signed in yet. The link lasts three days.`}
      </p>
      {canInviteStaff(user) ? (
        <Button buttonStyle="secondary" size="small" disabled={sending} onClick={resend}>
          {sending ? 'Sending…' : legacy ? 'Send invitation' : 'Send invitation again'}
        </Button>
      ) : null}
    </div>
  )
}
