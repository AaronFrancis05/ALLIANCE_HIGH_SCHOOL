/**
 * Thin bar above the header with the school's phone numbers, email and portal links,
 * as on the Seeta site. Hidden on phones, where the space is better spent.
 */

import React from 'react'
import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'

interface TopBarProps {
  phones: { label?: string | null; number: string }[]
  email?: string | null
}

export function TopBar({ phones, email }: TopBarProps) {
  if (!phones.length && !email) return null

  return (
    <div className="hidden bg-ink-950 text-cream-100 lg:block">
      <div className="container-site flex items-center justify-between gap-6 py-2 text-xs">
        <div className="flex items-center gap-5">
          {phones.slice(0, 3).map((phone) => (
            <a
              key={phone.number}
              href={`tel:${phone.number.replace(/\s/g, '')}`}
              className="flex items-center gap-1.5 hover:text-gold-300"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              <span>
                {phone.label ? <span className="text-cream-300">{phone.label}: </span> : null}
                {phone.number}
              </span>
            </a>
          ))}
          {email ? (
            <a href={`mailto:${email}`} className="flex items-center gap-1.5 hover:text-gold-300">
              <Mail className="h-3.5 w-3.5" aria-hidden />
              {email}
            </a>
          ) : null}
        </div>

        {/* Application tracking is added here when P5 builds it. */}
        <div className="flex items-center gap-4">
          <Link href="/resources" className="hover:text-gold-300">
            e-Library
          </Link>
          <Link href="/portal" className="hover:text-gold-300">
            Student portal
          </Link>
        </div>
      </div>
    </div>
  )
}
