'use client'

import React from 'react'
import type { CheckboxFieldClient, DefaultCellComponentProps } from 'payload'

type BooleanCellProps = DefaultCellComponentProps<CheckboxFieldClient> & {
  on?: string
  off?: string
}

/**
 * A tick box shown as a labelled badge in admin list views, instead of Payload's raw
 * `true` / `false`. Each field can name its two states through `clientProps`, for example
 * `{ on: 'Released', off: 'Not released' }`; without them the badge reads Yes or No.
 */
export function BooleanCell({ cellData, on = 'Yes', off = 'No' }: BooleanCellProps) {
  const isOn = cellData === true
  return (
    <span className={`ahsn-badge ${isOn ? 'ahsn-badge--on' : 'ahsn-badge--off'}`}>
      <span className="ahsn-badge__dot" aria-hidden="true" />
      {isOn ? on : off}
    </span>
  )
}
