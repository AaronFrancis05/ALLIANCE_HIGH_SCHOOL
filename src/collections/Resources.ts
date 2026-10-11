/**
 * e-Library resources: notes, past papers, textbooks, schemes, holiday work and videos
 * (FR-06 to FR-09).
 *
 * Holiday work is the one kind a teacher may upload, and only for a subject they teach. It
 * accepts PDF and Word (.docx) files only, plus ZIP folders for subjects whose practicals
 * are handed out as folders (ICT; see "Accepts ZIP folders" on the subject).
 *
 * Files go to the private bucket and are never linked directly. The browser only ever
 * receives `/api/files/resource/<id>`, which re-checks access and issues a 5-minute
 * signed URL.
 */

import { APIError, ValidationError, type CollectionConfig, type PayloadRequest } from 'payload'
import {
  CLASS_LABELS,
  HOLIDAY_WORK,
  SCHOOL_CLASSES,
  canFileResource,
  readResources,
  writeResources,
} from '../access/resources'
import { departmentId, hasRole, hiddenUnless, subjectIds, type StaffUser } from '../access/roles'
import { assertAllowedUpload, isAllowedType, type UploadKind } from '../lib/upload-safety'
import { titleFromFilename } from '../lib/resource-title'
import { hideStorageKey } from '../access/private-files'
import { RESOURCE_TYPES } from '../lib/resource-filters'
import type { Subject } from '../payload-types'

/** A teacher and nothing more: the super admin passes every `hasRole` check. */
function isTeacherOnly(user: unknown): boolean {
  return (user as StaffUser | null)?.role === 'teacher' && hasRole(user as StaffUser, 'teacher')
}

async function loadSubject(req: PayloadRequest, subject: unknown): Promise<Subject | null> {
  const id = typeof subject === 'object' && subject !== null ? (subject as { id: unknown }).id : subject
  if (typeof id !== 'number' && typeof id !== 'string') return null
  try {
    return await req.payload.findByID({ collection: 'subjects', id, depth: 0, req })
  } catch {
    return null // an unknown subject is reported by the field's own validation
  }
}

/** Which upload rules apply: holiday work is narrower than the rest of the library. */
function uploadKindFor(type: unknown, subject: Subject | null): UploadKind {
  if (type !== HOLIDAY_WORK) return 'document'
  return subject?.acceptsArchives ? 'holidayWorkArchive' : 'holidayWork'
}

function optionValue(option: string | { value: string }): string {
  return typeof option === 'string' ? option : option.value
}

const REFUSED = {
  teacher: 'Teachers can only add holiday work, and only for the subjects they teach.',
  other: 'Heads of department can only add resources to their own department.',
}

export const Resources: CollectionConfig = {
  slug: 'resources',
  labels: { singular: 'Resource', plural: 'e-Library' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'subject', 'classes', 'visibility', 'downloads'],
    group: 'e-Library',
    hidden: hiddenUnless('editor', 'registrar', 'hod', 'teacher'),
    description: 'Notes, past papers, textbooks and schemes of work for students.',
  },
  access: {
    read: readResources,
    create: writeResources,
    update: writeResources,
    delete: ({ req }) => hasRole(req.user as StaffUser, 'superAdmin', 'registrar'),
  },
  upload: {
    // Stored in the private bucket; see payload.config.ts.
    mimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // ZIP folders are for holiday work in subjects that accept them; the hook refuses
      // them everywhere else.
      'application/zip',
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    disableLocalStorage: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: { description: 'Leave empty to use the file name, which helps when uploading many at once.' },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: { description: 'One or two lines so students know what is inside.' },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: ({ user }) => (isTeacherOnly(user) ? HOLIDAY_WORK : 'notes'),
      options: [...RESOURCE_TYPES],
      // Teachers are offered holiday work only; the hook enforces it on the server.
      filterOptions: ({ options, req }) =>
        isTeacherOnly(req.user) ? options.filter((option) => optionValue(option) === HOLIDAY_WORK) : options,
      index: true,
      admin: {
        description:
          'Holiday work takes PDF or Word (.docx) files only, and ZIP folders for subjects that accept them (ICT practicals).',
      },
    },
    {
      name: 'department',
      type: 'relationship',
      relationTo: 'departments',
      required: true,
      index: true,
      admin: {
        description:
          'Heads of Department may only add resources to their own department. For a teacher this is filled from the subject.',
      },
      defaultValue: ({ user }) => departmentId(user as StaffUser) ?? undefined,
    },
    {
      name: 'subject',
      type: 'relationship',
      relationTo: 'subjects',
      required: true,
      index: true,
      // A teacher is offered only the subjects they teach; the hook enforces it on the server.
      filterOptions: ({ req }) => (isTeacherOnly(req.user) ? { id: { in: subjectIds(req.user as StaffUser) } } : true),
    },
    {
      name: 'classes',
      type: 'select',
      hasMany: true,
      required: true,
      options: SCHOOL_CLASSES.map((value) => ({ label: CLASS_LABELS[value], value })),
      admin: { description: 'Which classes this is for.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'year', type: 'number', min: 1990, max: 2100, admin: { width: '50%' } },
        {
          name: 'term',
          type: 'select',
          options: [
            { label: 'Term 1', value: '1' },
            { label: 'Term 2', value: '2' },
            { label: 'Term 3', value: '3' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'visibility',
      type: 'select',
      required: true,
      defaultValue: 'students',
      options: [
        { label: 'Public: anyone on the website', value: 'public' },
        { label: 'Signed-in students', value: 'students' },
        { label: 'Only the classes listed above', value: 'classes' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'externalUrl',
      type: 'text',
      admin: {
        description: 'Use instead of a file for a YouTube lesson or an external link.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return true
        return /^https:\/\//.test(value) ? true : 'Links must start with https://'
      },
    },
    {
      name: 'downloads',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true, position: 'sidebar', description: 'Times this has been opened.' },
      access: { update: () => false },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true, position: 'sidebar' },
      access: { update: () => false },
    },
  ],
  hooks: {
    afterRead: [hideStorageKey],
    beforeValidate: [
      async ({ req, data, operation, originalDoc }) => {
        const type = data?.type ?? originalDoc?.type
        const subjectRef = data?.subject ?? originalDoc?.subject
        const subject = type === HOLIDAY_WORK ? await loadSubject(req, subjectRef) : null
        const kind = uploadKindFor(type, subject)
        const changesFiling = data?.type !== undefined || data?.subject !== undefined

        if (req.file) {
          await assertAllowedUpload(req.file, kind)
        } else if (originalDoc?.mimeType && changesFiling && !isAllowedType(originalDoc.mimeType, kind)) {
          // Re-filing must not smuggle a stored file past the rules, such as a ZIP moved
          // out of ICT or a photo turned into holiday work.
          throw new APIError('The stored file is not allowed for this type and subject. Upload a new file.', 415, undefined, true)
        }

        // A teacher's holiday work is filed under its subject's department.
        let department = data?.department ?? originalDoc?.department
        if (isTeacherOnly(req.user) && subject) department = subject.department

        // FR-07: a head of department files only under their own department, and a teacher
        // only holiday work for their own subjects, on create and on every update that
        // touches the filing, so a resource can never be moved to where they may not file.
        if (req.user?.collection === 'users') {
          const touches = operation === 'create' || changesFiling || data?.department !== undefined
          if (touches && !canFileResource(req.user, { department, subject: subjectRef, type })) {
            throw new APIError(isTeacherOnly(req.user) ? REFUSED.teacher : REFUSED.other, 403, undefined, true)
          }
        }

        const title = data?.title?.trim() || titleFromFilename(req.file?.name ?? originalDoc?.filename ?? '')
        if (!title) throw new ValidationError({ errors: [{ message: 'Give the resource a title.', path: 'title' }] })

        const filed = department === undefined ? { ...data, title } : { ...data, title, department }
        if (operation === 'create' && req.user?.collection === 'users') {
          return { ...filed, uploadedBy: req.user.id }
        }
        return filed
      },
    ],
  },
}
