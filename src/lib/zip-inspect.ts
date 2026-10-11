/**
 * Looks inside a ZIP container before it is stored: ZIP folders of ICT practicals, and Word
 * (.docx) files, which are ZIP containers too.
 *
 * The leading bytes only prove a file is *a* ZIP. This reads the central directory (the
 * index at the end of every ZIP) and refuses the tricks a ZIP can carry:
 *   - entries that climb out of the folder when unpacked (`../`, `/etc`, `C:\`),
 *   - programs and scripts that run when a student double-clicks them,
 *   - archives inside the archive, which hide content from these checks,
 *   - password-protected entries, which cannot be checked at all,
 *   - "zip bombs" that unpack to far more than they weigh,
 *   - and, for Word files, macros (a renamed .docm) or a missing document body.
 *
 * Nothing is unpacked: the directory alone says what the archive holds and how big each
 * entry claims to be. No dependency is needed for that.
 */

const EOCD_SIGNATURE = 0x06054b50
const CENTRAL_SIGNATURE = 0x02014b50
const EOCD_MIN_LENGTH = 22
const MAX_COMMENT_LENGTH = 0xffff

export const ZIP_LIMITS = {
  maxEntries: 1000,
  maxTotalUncompressedBytes: 200 * 1024 * 1024,
  /** Ordinary files compress at most around 20:1; bombs reach 1000:1 and beyond. */
  maxCompressionRatio: 200,
  /** Small entries may compress very well (a blank sheet) without being a threat. */
  ratioCheckFromBytes: 1024 * 1024,
} as const

/** Extensions that run code on a student's computer, or hide content as a nested archive. */
const BLOCKED_EXTENSIONS = new Set([
  // Windows programs, installers and scripts
  'exe', 'com', 'bat', 'cmd', 'msi', 'msp', 'scr', 'pif', 'cpl', 'dll', 'sys', 'drv', 'ocx',
  'vbs', 'vbe', 'js', 'jse', 'wsf', 'wsh', 'ps1', 'psm1', 'hta', 'lnk', 'url', 'reg', 'inf',
  'gadget', 'application', 'appref-ms',
  // Other platforms
  'jar', 'sh', 'bash', 'command', 'apk', 'app', 'dmg', 'pkg', 'deb', 'rpm', 'elf', 'bin', 'run',
  // Office files that may carry macros
  'docm', 'dotm', 'xlsm', 'xltm', 'xlam', 'pptm', 'potm', 'ppam', 'ppsm', 'sldm',
  // Archives and disk images inside the archive
  'zip', 'rar', '7z', 'gz', 'tgz', 'tar', 'bz2', 'xz', 'cab', 'iso', 'img', 'vhd', 'vhdx',
])

export interface ZipEntry {
  name: string
  compressedSize: number
  uncompressedSize: number
  encrypted: boolean
}

export type ZipPurpose = 'archive' | 'docx'

function findEndOfCentralDirectory(data: Buffer): number {
  const earliest = Math.max(0, data.length - EOCD_MIN_LENGTH - MAX_COMMENT_LENGTH)
  for (let offset = data.length - EOCD_MIN_LENGTH; offset >= earliest; offset -= 1) {
    if (data.readUInt32LE(offset) === EOCD_SIGNATURE) return offset
  }
  return -1
}

/** The entries listed in a ZIP's central directory, or null when it cannot be read. */
export function readZipEntries(data: Buffer): ZipEntry[] | null {
  if (data.length < EOCD_MIN_LENGTH) return null

  const eocd = findEndOfCentralDirectory(data)
  if (eocd < 0) return null

  const entryCount = data.readUInt16LE(eocd + 10)
  const directorySize = data.readUInt32LE(eocd + 12)
  const directoryOffset = data.readUInt32LE(eocd + 16)

  // ZIP64 marks these fields as 0xFFFF / 0xFFFFFFFF. A file under our 50 MB cap never
  // needs ZIP64, so such a file is refused rather than parsed.
  if (entryCount === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff) return null
  if (directoryOffset + directorySize > eocd) return null

  const entries: ZipEntry[] = []
  let cursor = directoryOffset

  for (let index = 0; index < entryCount; index += 1) {
    if (cursor + 46 > eocd || data.readUInt32LE(cursor) !== CENTRAL_SIGNATURE) return null

    const flags = data.readUInt16LE(cursor + 8)
    const compressedSize = data.readUInt32LE(cursor + 20)
    const uncompressedSize = data.readUInt32LE(cursor + 24)
    const nameLength = data.readUInt16LE(cursor + 28)
    const extraLength = data.readUInt16LE(cursor + 30)
    const commentLength = data.readUInt16LE(cursor + 32)

    const nameEnd = cursor + 46 + nameLength
    if (nameEnd > eocd) return null
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) return null

    entries.push({
      name: data.toString('utf8', cursor + 46, nameEnd),
      compressedSize,
      uncompressedSize,
      encrypted: (flags & 0x1) === 0x1,
    })

    cursor = nameEnd + extraLength + commentLength
  }

  return entries
}

function extensionOf(entryName: string): string {
  const base = entryName.split('/').pop() ?? ''
  const dot = base.lastIndexOf('.')
  return dot > 0 ? base.slice(dot + 1).toLowerCase() : ''
}

/** True when unpacking this entry could write outside the folder it is unpacked into. */
export function isUnsafeEntryPath(entryName: string): boolean {
  if (entryName.length === 0 || entryName.includes('\u0000')) return true
  if (entryName.includes('\\')) return true // Windows separators: `..\..\` and drive paths
  if (entryName.startsWith('/') || /^[A-Za-z]:/.test(entryName)) return true
  return entryName.split('/').some((segment) => segment === '..')
}

function entryProblem(entry: ZipEntry, purpose: ZipPurpose): string | null {
  if (isUnsafeEntryPath(entry.name)) return 'The folder contains a file with an unsafe path.'
  if (entry.encrypted) return 'Password-protected files cannot be uploaded.'

  const isFolder = entry.name.endsWith('/')
  if (!isFolder && BLOCKED_EXTENSIONS.has(extensionOf(entry.name))) {
    // A Word file legitimately carries `.bin` parts (embedded objects, printer settings);
    // its macro part is caught separately below.
    const allowedInsideWord = purpose === 'docx' && extensionOf(entry.name) === 'bin'
    if (!allowedInsideWord) {
      const base = (entry.name.split('/').pop() ?? '').slice(0, 80)
      return `"${base}" cannot be uploaded: programs, scripts, macro files and archives inside a folder are not allowed.`
    }
  }

  if (
    entry.uncompressedSize >= ZIP_LIMITS.ratioCheckFromBytes &&
    entry.uncompressedSize > entry.compressedSize * ZIP_LIMITS.maxCompressionRatio
  ) {
    return 'The folder unpacks to far more than its size, so it cannot be uploaded.'
  }
  return null
}

/** Why this ZIP container may not be stored, or null when it may. */
export function zipProblem(data: Buffer, purpose: ZipPurpose): string | null {
  const unreadable = purpose === 'docx' ? 'That Word file is damaged or not a real .docx file.' : 'That ZIP folder is damaged or cannot be read.'

  const entries = readZipEntries(data)
  if (!entries || entries.length === 0) return unreadable
  if (entries.length > ZIP_LIMITS.maxEntries) {
    return `The folder holds more than ${ZIP_LIMITS.maxEntries} files. Split it into smaller folders.`
  }

  let total = 0
  for (const entry of entries) {
    const problem = entryProblem(entry, purpose)
    if (problem) return problem
    total += entry.uncompressedSize
  }

  if (total > ZIP_LIMITS.maxTotalUncompressedBytes) {
    return 'The folder unpacks to more than 200 MB. Split it into smaller folders.'
  }

  if (purpose === 'docx') {
    const names = new Set(entries.map((entry) => entry.name))
    if (!names.has('[Content_Types].xml') || !names.has('word/document.xml')) return unreadable
    if (entries.some((entry) => entry.name.toLowerCase().endsWith('vbaproject.bin'))) {
      return 'That Word file contains macros, which cannot be uploaded. Save it as a plain .docx and try again.'
    }
  }

  return null
}
