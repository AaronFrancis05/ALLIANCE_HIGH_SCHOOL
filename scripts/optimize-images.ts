/**
 * Turns the images in `assets/` into optimised, descriptively named masters in
 * `public/photos/`, ready for the seed to upload into the CMS. This covers both the
 * school's own photographs and the generated stand-ins in `assets/generated/`.
 *
 *   pnpm images
 *
 * What it does per photo: applies the EXIF orientation, strips all metadata (including
 * GPS), limits the long edge to 2400 px, writes WebP, and records a tiny blurred
 * data URI so pages never flash an empty box while loading.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { imageManifest } from '../src/seed/image-manifest.js'

const ROOT = path.resolve(import.meta.dirname, '..')
const SOURCE_DIR = path.join(ROOT, 'assets')
const OUT_DIR = path.join(ROOT, 'public', 'photos')
const BLUR_FILE = path.join(ROOT, 'src', 'seed', 'blur-data.json')

const MAX_EDGE = 2400
const BLUR_WIDTH = 16

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })

  const blur: Record<string, string> = {}
  let written = 0
  let placeholders = 0
  const missing: string[] = []

  for (const entry of imageManifest) {
    if (!entry.source) continue
    const sourcePath = path.join(SOURCE_DIR, entry.source)

    try {
      await fs.access(sourcePath)
    } catch {
      missing.push(entry.source)
      continue
    }

    const outPath = path.join(OUT_DIR, `${entry.slug}.webp`)

    // rotate() with no argument applies the EXIF orientation, so portrait shots stay upright.
    const pipeline = sharp(sourcePath).rotate().resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })

    const info = await pipeline.clone().webp({ quality: 82 }).toFile(outPath)

    const blurBuffer = await pipeline.clone().resize({ width: BLUR_WIDTH }).webp({ quality: 40 }).toBuffer()
    blur[entry.slug] = `data:image/webp;base64,${blurBuffer.toString('base64')}`

    written += 1
    if (entry.kind === 'placeholder') placeholders += 1
    console.log(`  ${entry.slug}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`)
  }

  await fs.writeFile(BLUR_FILE, `${JSON.stringify(blur, null, 2)}\n`, 'utf8')

  console.log(
    `\n${written} image(s) optimised into public/photos/ ` +
      `(${written - placeholders} school photographs, ${placeholders} placeholders)`,
  )
  console.log(`Blur placeholders written to src/seed/blur-data.json`)

  if (missing.length) {
    console.warn(
      `\nMissing from assets/ (listed in the manifest but not on disk):\n  ${missing.join('\n  ')}`,
    )
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
