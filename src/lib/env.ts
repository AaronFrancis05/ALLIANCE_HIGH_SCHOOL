/**
 * Typed access to environment variables.
 *
 * Anything read from `process.env` goes through here, so a missing setting fails loudly
 * at startup instead of surfacing as `undefined` halfway through a request.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. See .env.example.`)
  }
  return value
}

function optional(name: string, fallback = ''): string {
  return process.env[name] ?? fallback
}

function flag(name: string, fallback = false): boolean {
  const value = process.env[name]
  if (value === undefined) return fallback
  return value === 'true' || value === '1'
}

export const env = {
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test' || flag('PLAYWRIGHT'),

  siteUrl: optional('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000').replace(/\/$/, ''),
  databaseUrl: () => required('DATABASE_URL'),
  payloadSecret: () => required('PAYLOAD_SECRET'),

  s3: {
    endpoint: optional('S3_ENDPOINT', 'http://localhost:9000'),
    region: optional('S3_REGION', 'auto'),
    accessKeyId: optional('S3_ACCESS_KEY_ID'),
    secretAccessKey: optional('S3_SECRET_ACCESS_KEY'),
    mediaBucket: optional('S3_MEDIA_BUCKET', 'alliance-media'),
    privateBucket: optional('S3_PRIVATE_BUCKET', 'alliance-private'),
    mediaPublicUrl: optional('S3_MEDIA_PUBLIC_URL', 'http://localhost:9000/alliance-media').replace(
      /\/$/,
      '',
    ),
    forcePathStyle: flag('S3_FORCE_PATH_STYLE', true),
  },

  email: {
    host: optional('SMTP_HOST', 'localhost'),
    port: Number(optional('SMTP_PORT', '1025')),
    user: optional('SMTP_USER'),
    pass: optional('SMTP_PASS'),
    fromAddress: optional('EMAIL_FROM_ADDRESS', 'noreply@alliancehigh.sc.ug'),
    fromName: optional('EMAIL_FROM_NAME', 'Alliance High School Nansana'),
  },

  sms: {
    provider: optional('SMS_PROVIDER', 'console') as 'console' | 'africastalking',
    username: optional('AT_USERNAME'),
    apiKey: optional('AT_API_KEY'),
    senderId: optional('AT_SENDER_ID'),
    /** Families are told about their application by SMS only when this is on (FR-19). */
    familyNotifications: flag('NOTIFY_SMS_ENABLED', false),
  },

  turnstile: {
    enabled: flag('TURNSTILE_ENABLED', false),
    siteKey: optional('NEXT_PUBLIC_TURNSTILE_SITE_KEY'),
    secretKey: optional('TURNSTILE_SECRET_KEY'),
  },

  /** Staff two-factor is mandatory except in automated tests. */
  staff2faRequired: flag('STAFF_2FA_REQUIRED', true) && !flag('PLAYWRIGHT'),
} as const

/** How long a signed URL for a private file stays valid. Kept short on purpose (FR-08). */
export const SIGNED_URL_TTL_SECONDS = 5 * 60
