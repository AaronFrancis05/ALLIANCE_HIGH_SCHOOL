import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  // AGENTS.md in this repository is written by hand; Next must not rewrite it.
  agentRules: false,

  experimental: {
    // The application form posts up to three 5 MB documents (FR-17), plus multipart overhead.
    // This applies to every server action; each one still validates its own input.
    serverActions: { bodySizeLimit: '16mb' },
    // The app has three root layouts, so a URL that matches no route needs its own branded
    // page: src/app/global-not-found.tsx.
    globalNotFound: true,
    // src/proxy.ts runs on every route, and Next buffers request bodies through it only up
    // to this size; anything larger arrives cut off. It must cover the largest upload any
    // collection accepts: 50 MB for staff documents (src/lib/upload-safety.ts).
    proxyClientMaxBodySize: '52mb',
    // Prerendering reads the CMS, and every build worker opens its own database pool.
    // The hosted Postgres pooler allows 15 clients, so the default three workers with
    // eight pages each ran out of connections and failed the build (EMAXCONNSESSION),
    // more often when two branches built at once. One worker, a few pages at a time.
    cpus: 1,
    staticGenerationMaxConcurrency: 4,
    staticGenerationRetryCount: 2,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    // Next 16 refuses to fetch an image from a host that resolves to a private IP, which
    // is the right default: it blocks SSRF through the optimizer. Locally the media lives
    // in MinIO on localhost:9000, so the check has to be relaxed in development only.
    // In production the media host is a public domain and this stays off.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    localPatterns: [
      { pathname: '/api/media/file/**' },
      { pathname: '/brand/**' },
      { pathname: '/photos/**' },
    ],
    remotePatterns: [
      // MinIO locally
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/alliance-media/**' },
      // Cloudflare R2 public bucket (production)
      { protocol: 'https', hostname: 'pub-fc9cfd9d0cd0415c99aea43bf4cd64b9.r2.dev', pathname: '/**' },
      // YouTube poster images for the video facade.
      { protocol: 'https', hostname: 'i.ytimg.com', pathname: '/**' },
    ],
  },

  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },

  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
