'use client'

/**
 * Keeps the admin's built-in account panel out of the way (FR-05, FR-10).
 *
 * Payload always asks for a password when a staff or student account is created, and the
 * form will not submit without one. Here nobody types one: staff are invited and students
 * use first-time sign-in. So on a new account this fills the hidden password boxes with a
 * throwaway value. The server never keeps it: field access drops any password sent for
 * someone else, and the account gets one nobody knows (see the collections' hooks).
 *
 * For students it also keeps the hidden username equal to the admission number, which is
 * what they sign in with. The server sets it the same way, so this only satisfies the form.
 *
 * The CSS that hides the boxes is in custom.scss (.ahsn-account-form).
 */

import { useEffect } from 'react'
import { useDocumentInfo, useForm, useFormFields } from '@payloadcms/ui'

function throwawayPassword(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function AccountFormHelper() {
  const { id, collectionSlug } = useDocumentInfo()
  const { dispatchFields } = useForm()
  const admissionNo = useFormFields(([fields]) => fields.admissionNo?.value)

  useEffect(() => {
    // Lets the stylesheet hide the password boxes on this form only.
    document.body.classList.add('ahsn-account-form')
    return () => document.body.classList.remove('ahsn-account-form')
  }, [])

  useEffect(() => {
    if (id) return
    const value = throwawayPassword()
    dispatchFields({ type: 'UPDATE', path: 'password', value })
    dispatchFields({ type: 'UPDATE', path: 'confirm-password', value })
  }, [id, dispatchFields])

  useEffect(() => {
    if (collectionSlug !== 'students') return
    dispatchFields({ type: 'UPDATE', path: 'username', value: typeof admissionNo === 'string' ? admissionNo.trim() : '' })
  }, [admissionNo, collectionSlug, dispatchFields])

  return null
}
