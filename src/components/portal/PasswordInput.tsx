'use client'

/**
 * A password box with a show/hide button, so a student typing on a phone can check what
 * they entered. The password is shown only in this browser; nothing else changes.
 */

import React, { useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { twMerge } from 'tailwind-merge'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { id: string }

export function PasswordInput({ id, className, ...inputProps }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input {...inputProps} id={id} type={visible ? 'text' : 'password'} className={twMerge(className, 'pr-12')} />
      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        aria-controls={id}
        aria-pressed={visible}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 mt-1.5 flex w-12 items-center justify-center rounded-r-lg text-ink-600 hover:text-maroon-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-maroon-600"
      >
        {visible ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
      </button>
    </div>
  )
}
