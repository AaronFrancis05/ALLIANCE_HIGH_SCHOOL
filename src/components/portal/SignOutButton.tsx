'use client'

/**
 * Sign out. A form post rather than a link, so it cannot be triggered by a stray GET.
 */

import React from 'react'
import { useFormStatus } from 'react-dom'
import { LogOut } from 'lucide-react'
import { signOutAction } from '../../app/(portal)/portal/actions'

function Button() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap text-cream-200 hover:bg-maroon-700 hover:text-white disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button />
    </form>
  )
}
