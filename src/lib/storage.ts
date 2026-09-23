/**
 * Object storage (MinIO locally, Cloudflare R2 in production).
 *
 * Two buckets: one public for website media, one private for report cards, restricted
 * library files and admission documents. Private objects are only ever handed out as a
 * signed URL that expires in five minutes (FR-08), and the key stays on the server.
 */

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { SIGNED_URL_TTL_SECONDS, env } from './env'

let client: S3Client | null = null

export function s3Client(): S3Client {
  if (client) return client

  client = new S3Client({
    endpoint: env.s3.endpoint,
    region: env.s3.region,
    forcePathStyle: env.s3.forcePathStyle,
    credentials: {
      accessKeyId: env.s3.accessKeyId,
      secretAccessKey: env.s3.secretAccessKey,
    },
  })

  return client
}

export interface SignedFileOptions {
  /** Name the browser should save the file as. */
  downloadName?: string
  /** Force a download instead of opening in the browser tab. */
  asAttachment?: boolean
  /** Seconds the link stays valid. Defaults to five minutes. */
  ttlSeconds?: number
}

/**
 * A short-lived link to a private object. Callers must have already decided that this
 * particular person may have this particular file.
 */
export async function signedPrivateUrl(key: string, options: SignedFileOptions = {}): Promise<string> {
  const { downloadName, asAttachment = false, ttlSeconds = SIGNED_URL_TTL_SECONDS } = options

  const disposition = downloadName
    ? `${asAttachment ? 'attachment' : 'inline'}; filename="${downloadName.replace(/"/g, '')}"`
    : undefined

  const command = new GetObjectCommand({
    Bucket: env.s3.privateBucket,
    Key: key,
    ResponseContentDisposition: disposition,
  })

  return getSignedUrl(s3Client(), command, { expiresIn: ttlSeconds })
}

/** Public URL for a file in the media bucket. */
export function publicMediaUrl(filename: string): string {
  return `${env.s3.mediaPublicUrl}/${filename}`
}
