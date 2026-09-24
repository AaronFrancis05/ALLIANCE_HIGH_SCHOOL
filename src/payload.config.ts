/**
 * Payload configuration: collections, globals, storage, email and the admin panel.
 *
 * Two storage buckets are configured. Media is public and served straight from the
 * bucket URL; everything else (report cards, library files, admission documents) is
 * private and only reachable through a signed URL issued by a route handler.
 */

import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Students } from './collections/Students'
import { Media } from './collections/Media'
import { Posts } from './collections/Posts'
import { Categories } from './collections/Categories'
import { Events } from './collections/Events'
import { Vacancies } from './collections/Vacancies'
import { Albums } from './collections/Albums'
import { Videos } from './collections/Videos'
import { Pages } from './collections/Pages'
import { StaffProfiles } from './collections/StaffProfiles'
import { Testimonials } from './collections/Testimonials'
import { Downloads } from './collections/Downloads'
import { Departments } from './collections/Departments'
import { Subjects } from './collections/Subjects'
import { Resources } from './collections/Resources'
import { AcademicTerms } from './collections/AcademicTerms'
import { FeeClearances } from './collections/FeeClearances'
import { ReportCards } from './collections/ReportCards'
import { Applications } from './collections/Applications'
import { ApplicationDocuments } from './collections/ApplicationDocuments'
import { FormSubmissions } from './collections/FormSubmissions'
import { AuditLogs } from './collections/AuditLogs'

import { SiteSettings } from './globals/SiteSettings'
import { Navigation } from './globals/Navigation'
import { AdmissionsSettings } from './globals/Admissions'
import { HomePage } from './globals/HomePage'

import { env } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/** Collections whose files must never be publicly readable. */
const PRIVATE_UPLOAD_COLLECTIONS = ['resources', 'reportCards', 'applicationDocuments'] as const

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' | Alliance High School Nansana',
      icons: [{ rel: 'icon', url: '/favicon-32.png' }],
    },
    components: {
      graphics: {
        Logo: '/components/admin/Logo#Logo',
        Icon: '/components/admin/Logo#Icon',
      },
    },
  },

  collections: [
    // Content
    Pages,
    Posts,
    Categories,
    Events,
    Albums,
    Videos,
    Media,
    StaffProfiles,
    Testimonials,
    Downloads,
    Vacancies,
    // Academics and library
    Departments,
    Subjects,
    Resources,
    // Results
    AcademicTerms,
    FeeClearances,
    ReportCards,
    // Admissions
    Applications,
    ApplicationDocuments,
    // People and administration
    Users,
    Students,
    FormSubmissions,
    AuditLogs,
  ],

  globals: [SiteSettings, HomePage, Navigation, AdmissionsSettings],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || '',

  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },

  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
  }),

  sharp,

  email: nodemailerAdapter({
    defaultFromAddress: env.email.fromAddress,
    defaultFromName: env.email.fromName,
    transportOptions: {
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      auth: env.email.user ? { user: env.email.user, pass: env.email.pass } : undefined,
      // Mailpit accepts anything; production uses real credentials.
      ignoreTLS: !env.isProduction,
    },
  }),

  plugins: [
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
          generateFileURL: ({ filename }) => `${env.s3.mediaPublicUrl}/media/${filename}`,
        },
        downloads: {
          prefix: 'downloads',
          generateFileURL: ({ filename }) => `${env.s3.mediaPublicUrl}/downloads/${filename}`,
        },
      },
      bucket: env.s3.mediaBucket,
      config: {
        endpoint: env.s3.endpoint,
        region: env.s3.region,
        forcePathStyle: env.s3.forcePathStyle,
        credentials: {
          accessKeyId: env.s3.accessKeyId,
          secretAccessKey: env.s3.secretAccessKey,
        },
      },
    }),

    s3Storage({
      collections: Object.fromEntries(
        PRIVATE_UPLOAD_COLLECTIONS.map((slug) => [
          slug,
          {
            prefix: slug,
            // No public URL: these are only ever served through a signed link.
            generateFileURL: () => '',
            disablePayloadAccessControl: true,
          },
        ]),
      ),
      bucket: env.s3.privateBucket,
      config: {
        endpoint: env.s3.endpoint,
        region: env.s3.region,
        forcePathStyle: env.s3.forcePathStyle,
        credentials: {
          accessKeyId: env.s3.accessKeyId,
          secretAccessKey: env.s3.secretAccessKey,
        },
      },
    }),
  ],
})
