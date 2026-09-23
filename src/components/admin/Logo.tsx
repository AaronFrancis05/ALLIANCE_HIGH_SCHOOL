/**
 * The school crest in the admin panel, on the login screen and in the sidebar.
 * Falls back to wordmark text until the official crest file is in place.
 */

import React from 'react'
import { CREST_SRC } from '../../lib/brand'

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={CREST_SRC} alt="" width={56} height={56} style={{ objectFit: 'contain' }} />
      <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
        Alliance High School Nansana
        <span style={{ display: 'block', fontSize: 12, fontWeight: 400, opacity: 0.7 }}>
          Website administration
        </span>
      </span>
    </div>
  )
}

export function Icon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={CREST_SRC} alt="" width={28} height={28} style={{ objectFit: 'contain' }} />
  )
}
