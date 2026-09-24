'use client'

/**
 * "Open document" in the admin panel (FR-17).
 *
 * Application documents have no public URL, so the admin panel cannot preview them itself.
 * This links to the delivery route, which re-checks that the viewer is on the admissions
 * team and then hands over a five-minute link.
 *
 * Used in two places: on a document's own page, where the document is the one being
 * edited, and in each row of an application's document list, where the id is the row's
 * `file` value.
 */

import React from 'react'
import type { UIFieldClientComponent } from 'payload'
import { useDocumentInfo, useFormFields } from '@payloadcms/ui'

function idOf(value: unknown): string | number | null {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  return null
}

export const OpenDocumentLink: UIFieldClientComponent = ({ path }) => {
  const { id: documentId, collectionSlug } = useDocumentInfo()
  // In an array row the path is "documents.0.open"; the sibling "file" holds the document.
  const siblingPath = path.includes('.') ? path.replace(/[^.]+$/, 'file') : null
  const rowValue = useFormFields(([fields]) => (siblingPath ? fields[siblingPath]?.value : undefined))

  const id = siblingPath ? idOf(rowValue) : collectionSlug === 'applicationDocuments' ? documentId : null
  if (id === null || id === undefined) return null

  return (
    <p style={{ margin: '0 0 1rem' }}>
      <a href={`/api/files/application-document/${id}`} target="_blank" rel="noopener noreferrer">
        Open document
      </a>{' '}
      <span style={{ opacity: 0.7 }}>(opens in a new tab; the link works for five minutes)</span>
    </p>
  )
}
