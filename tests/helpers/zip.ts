/**
 * Builds small ZIP files in memory for tests, so no fixture files or dependency are needed.
 * Entries are stored uncompressed; `declaredSize` lets a test lie about the unpacked size,
 * the way a zip bomb does.
 */

export interface TestZipEntry {
  name: string
  data?: Buffer
  /** Set bit 0 to mark the entry as password-protected. */
  flags?: number
  /** Unpacked size written to the central directory, instead of the real length. */
  declaredSize?: number
}

export function makeZip(entries: TestZipEntry[]): Buffer {
  const locals: Buffer[] = []
  const centrals: Buffer[] = []
  let offset = 0

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const data = entry.data ?? Buffer.from(`contents of ${entry.name}`)
    const flags = entry.flags ?? 0

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(flags, 6)
    local.writeUInt32LE(data.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(name.length, 26)
    locals.push(local, name, data)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(flags, 8)
    central.writeUInt32LE(data.length, 20)
    central.writeUInt32LE(entry.declaredSize ?? data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt32LE(offset, 42)
    centrals.push(central, name)

    offset += local.length + name.length + data.length
  }

  const directory = Buffer.concat(centrals)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(directory.length, 12)
  end.writeUInt32LE(offset, 16)

  return Buffer.concat([...locals, directory, end])
}

/** The smallest ZIP that passes as a Word document. */
export function makeDocx(extra: TestZipEntry[] = []): Buffer {
  return makeZip([
    { name: '[Content_Types].xml' },
    { name: '_rels/.rels' },
    { name: 'word/document.xml' },
    ...extra,
  ])
}
