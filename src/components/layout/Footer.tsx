/**
 * Footer: crest and short description, link columns from the CMS, contact block and
 * social links. Also the last chance to reassure a parent, so the address and phone
 * numbers are spelled out in full rather than hidden behind icons.
 */

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Youtube } from 'lucide-react'
import { CREST_SRC } from '../../lib/brand'

interface FooterProps {
  schoolName: string
  motto?: string | null
  description?: string | null
  columns: { heading: string; links?: { label: string; href: string }[] | null }[]
  phones: { label?: string | null; number: string }[]
  emails: { label?: string | null; address: string }[]
  address: { line1?: string | null; district?: string | null; country?: string | null; poBox?: string | null }
  social: { platform: string; url: string }[]
}

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
}

export function Footer({
  schoolName,
  motto,
  description,
  columns,
  phones,
  emails,
  address,
  social,
}: FooterProps) {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-ink-950 text-cream-200">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-3">
            <Image src={CREST_SRC} alt="" width={56} height={56} className="h-14 w-14 object-contain" />
            <div>
              <p className="font-display text-lg font-semibold text-white">{schoolName}</p>
              {motto ? <p className="text-xs tracking-[0.18em] text-gold-400 uppercase">{motto}</p> : null}
            </div>
          </div>
          {description ? <p className="mt-4 text-sm leading-relaxed text-cream-300">{description}</p> : null}

          {social.length ? (
            <div className="mt-5 flex gap-2">
              {social.map((entry) => {
                const Icon = socialIcons[entry.platform]
                return (
                  <a
                    key={entry.platform}
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-gold-500 hover:text-ink-950"
                  >
                    <span className="sr-only">{`${schoolName} on ${entry.platform}`}</span>
                    {Icon ? <Icon className="h-4 w-4" /> : <span aria-hidden>@</span>}
                  </a>
                )
              })}
            </div>
          ) : null}
        </div>

        {columns.slice(0, 2).map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h2 className="font-display text-base font-semibold text-white">{column.heading}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {column.links?.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-gold-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h2 className="font-display text-base font-semibold text-white">Get in touch</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
              <span>
                {[address.poBox, address.line1, address.district, address.country].filter(Boolean).join(', ')}
              </span>
            </li>
            {phones.map((phone) => (
              <li key={phone.number} className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                <a href={`tel:${phone.number.replace(/\s/g, '')}`} className="hover:text-gold-300">
                  {phone.number}
                  {phone.label ? <span className="text-cream-400"> ({phone.label})</span> : null}
                </a>
              </li>
            ))}
            {emails.map((email) => (
              <li key={email.address} className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                <a href={`mailto:${email.address}`} className="break-all hover:text-gold-300">
                  {email.address}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-site flex flex-col gap-2 py-5 text-xs text-cream-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {year} {schoolName}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-gold-300">
              Privacy notice
            </Link>
            <Link href="/contact" className="hover:text-gold-300">
              Contact
            </Link>
            {/*
              No visible sitemap link: sitemap.xml is for search engines, not visitors, and
              is advertised to them through robots.txt (see src/app/robots.ts).
            */}
          </div>
        </div>
      </div>
    </footer>
  )
}
