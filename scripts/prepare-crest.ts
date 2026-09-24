/**
 * Cleans up the school's official crest for use on the website.
 *
 *   pnpm crest
 *
 * Input:  assets/brand/crest-original.png  (the school's own artwork, any size)
 * Output: public/brand/crest.png           transparent background, trimmed, 1024 px wide
 *         public/brand/crest-512.png       for social cards
 *         public/favicon-32.png, public/icon-192.png, public/icon-512.png, public/apple-touch-icon.png
 *
 * The crest itself is never altered: the script only removes the flat background colour
 * that surrounds it, trims the empty margin and resizes. If the school later supplies a
 * vector or transparent original, drop it in and run this again.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = path.resolve(import.meta.dirname, '..')
const BRAND_SOURCE_DIR = path.join(ROOT, 'assets', 'brand')
const BRAND_DIR = path.join(ROOT, 'public', 'brand')
const PUBLIC_DIR = path.join(ROOT, 'public')

/**
 * The school's artwork has arrived under different names and formats. Rather than make
 * whoever supplies it rename the file, the first of these that exists is used.
 */
const SOURCE_CANDIDATES = [
  'crest-original.png',
  'crest-original.jpg',
  'crest-original.jpeg',
  'originallogo.png',
  'originallogo.jpg',
  'originallogo.jpeg',
]

async function findSource(): Promise<string | null> {
  for (const name of SOURCE_CANDIDATES) {
    const candidate = path.join(BRAND_SOURCE_DIR, name)
    try {
      await fs.access(candidate)
      return candidate
    } catch {
      // Try the next name.
    }
  }
  return null
}

/** How far a pixel may differ from the background colour and still count as background. */
const TOLERANCE = 42
/** Pixels this close to the edge of the tolerance get partial alpha, so edges stay smooth. */
const FEATHER = 18

type Rgba = { r: number; g: number; b: number; a: number }

function colourDistance(a: Rgba, b: Rgba): number {
  // Weighted to human perception; good enough to separate a flat backdrop from artwork.
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db) / 3
}

/**
 * Removes the background by flooding inwards from the border, so any colour that also
 * appears inside the crest (the gold laurels, for instance) is left untouched.
 */
function removeBackground(data: Buffer, width: number, height: number): Buffer {
  const at = (x: number, y: number) => (y * width + x) * 4
  const pixel = (i: number): Rgba => ({ r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] })

  // The background colour is whatever occupies the corners.
  const corners = [at(0, 0), at(width - 1, 0), at(0, height - 1), at(width - 1, height - 1)].map(pixel)
  const background: Rgba = {
    r: Math.round(corners.reduce((s, c) => s + c.r, 0) / corners.length),
    g: Math.round(corners.reduce((s, c) => s + c.g, 0) / corners.length),
    b: Math.round(corners.reduce((s, c) => s + c.b, 0) / corners.length),
    a: 255,
  }

  const visited = new Uint8Array(width * height)
  const queue: number[] = []

  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const index = y * width + x
    if (visited[index]) return
    visited[index] = 1
    queue.push(index)
  }

  for (let x = 0; x < width; x++) {
    enqueue(x, 0)
    enqueue(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y)
    enqueue(width - 1, y)
  }

  let cleared = 0
  while (queue.length) {
    const index = queue.pop() as number
    const i = index * 4
    const distance = colourDistance(pixel(i), background)

    if (distance > TOLERANCE) continue

    if (distance > TOLERANCE - FEATHER) {
      // Near the boundary: fade out rather than cut, so edges do not look jagged.
      const ratio = (distance - (TOLERANCE - FEATHER)) / FEATHER
      data[i + 3] = Math.round(data[i + 3] * ratio)
    } else {
      data[i + 3] = 0
    }
    cleared += 1

    const x = index % width
    const y = Math.floor(index / width)
    enqueue(x + 1, y)
    enqueue(x - 1, y)
    enqueue(x, y + 1)
    enqueue(x, y - 1)
  }

  console.log(
    `  background colour rgb(${background.r}, ${background.g}, ${background.b}), ${cleared} pixels cleared`,
  )
  return data
}

async function main() {
  const SOURCE = await findSource()

  if (!SOURCE) {
    console.error(
      `Crest not found.\n\nSave the school's crest in:\n  ${BRAND_SOURCE_DIR}\n` +
        `as one of: ${SOURCE_CANDIDATES.join(', ')}\n\n` +
        `Use the largest copy available, then run "pnpm crest" again.`,
    )
    process.exit(1)
  }

  console.log(`  source file ${path.relative(ROOT, SOURCE)}`)
  await fs.mkdir(BRAND_DIR, { recursive: true })

  const input = sharp(SOURCE).ensureAlpha()
  const { data, info } = await input.raw().toBuffer({ resolveWithObject: true })
  console.log(`  source ${info.width}x${info.height}`)

  const cleaned = removeBackground(Buffer.from(data), info.width, info.height)

  const transparent = sharp(cleaned, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 1 }) // drop the now-empty margin
    .png()

  const trimmed = await transparent.toBuffer()
  const trimmedInfo = await sharp(trimmed).metadata()

  /*
   * The master is only as large as something actually consumes. 512 px is the biggest
   * icon we produce, so that is the floor; a larger original is kept up to 1024 px, but a
   * small one is never blown up past 512 because upscaling invents no detail and costs a
   * great deal of weight. (The school's current artwork is 204 px wide: upscaling it to
   * 1024 produced a 2.1 MB PNG of the same picture.)
   */
  const masterWidth = Math.max(512, Math.min(1024, trimmedInfo.width ?? 512))

  const master = path.join(BRAND_DIR, 'crest.png')
  await sharp(trimmed)
    .resize({ width: masterWidth, fit: 'inside', withoutEnlargement: false })
    // The crest is flat colour, so a palette PNG is visually identical and far smaller.
    .png({ compressionLevel: 9, palette: true })
    .toFile(master)

  const sizes: Array<[number, string]> = [
    [512, path.join(BRAND_DIR, 'crest-512.png')],
    [512, path.join(PUBLIC_DIR, 'icon-512.png')],
    [192, path.join(PUBLIC_DIR, 'icon-192.png')],
    [180, path.join(PUBLIC_DIR, 'apple-touch-icon.png')],
    [32, path.join(PUBLIC_DIR, 'favicon-32.png')],
  ]

  for (const [size, out] of sizes) {
    await sharp(master)
      .resize({
        width: size,
        height: size,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9, palette: true })
      .toFile(out)
  }

  const final = await sharp(master).metadata()
  console.log(`\nCrest ready: public/brand/crest.png (${final.width}x${final.height}, transparent)`)
  console.log('Icons written: favicon-32, apple-touch-icon, icon-192, icon-512')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
