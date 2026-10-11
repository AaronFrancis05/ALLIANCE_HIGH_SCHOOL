/**
 * Proves the upload checks (SRS: upload safety), above all for holiday work: PDF and Word
 * only, ZIP folders only where the subject accepts them, and nothing inside a ZIP or Word
 * file that could run on a student's computer or overwhelm it.
 */

import { describe, expect, it } from 'vitest'
import { isAllowedType, normaliseMimeType, uploadProblem, type IncomingFile } from '../../src/lib/upload-safety'
import { isUnsafeEntryPath, readZipEntries, zipProblem } from '../../src/lib/zip-inspect'
import { makeDocx, makeZip } from '../helpers/zip'

const PDF_BYTES = Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\nxref\n%%EOF\n')
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function file(name: string, mimetype: string, data: Buffer): IncomingFile {
  return { name, mimetype, size: data.length, data }
}

describe('holiday work file types', () => {
  it('accepts a PDF and a Word file', () => {
    expect(uploadProblem(file('Maths holiday work.pdf', 'application/pdf', PDF_BYTES), 'holidayWork')).toBeNull()
    expect(uploadProblem(file('English holiday work.docx', DOCX, makeDocx()), 'holidayWork')).toBeNull()
  })

  it('refuses a ZIP folder for a subject that does not accept them', () => {
    const problem = uploadProblem(file('practicals.zip', 'application/zip', makeZip([{ name: 'task1.xlsx' }])), 'holidayWork')
    expect(problem).toEqual({ status: 415, message: 'Holiday work must be a PDF or a Word (.docx) file.' })
  })

  it('accepts an ICT ZIP folder, including the name Windows browsers send', () => {
    const zip = makeZip([{ name: 'Practical 1/' }, { name: 'Practical 1/budget.xlsx' }, { name: 'Practical 1/site.html' }])
    expect(uploadProblem(file('ICT practicals.zip', 'application/zip', zip), 'holidayWorkArchive')).toBeNull()
    expect(uploadProblem(file('ICT practicals.zip', 'application/x-zip-compressed', zip), 'holidayWorkArchive')).toBeNull()
  })

  it('refuses images and anything else as holiday work', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])
    expect(uploadProblem(file('photo.jpg', 'image/jpeg', jpeg), 'holidayWork')?.status).toBe(415)
    expect(uploadProblem(file('notes.txt', 'text/plain', Buffer.from('hello')), 'holidayWorkArchive')?.status).toBe(415)
  })

  it('refuses ZIP folders on the rest of the library', () => {
    const zip = makeZip([{ name: 'a.pdf' }])
    expect(uploadProblem(file('bundle.zip', 'application/zip', zip), 'document')?.status).toBe(415)
  })

  it('knows which stored types may be re-filed under which kind', () => {
    expect(isAllowedType('application/zip', 'holidayWorkArchive')).toBe(true)
    expect(isAllowedType('application/zip', 'holidayWork')).toBe(false)
    expect(isAllowedType('image/png', 'holidayWork')).toBe(false)
    expect(isAllowedType('application/pdf', 'document')).toBe(true)
  })
})

describe('names, declared types and bytes must agree', () => {
  it('refuses an extension that does not match the type (a disguised program)', () => {
    expect(uploadProblem(file('notes.pdf.exe', 'application/pdf', PDF_BYTES), 'holidayWork')?.status).toBe(415)
    expect(uploadProblem(file('notes.docx', 'application/pdf', PDF_BYTES), 'holidayWork')?.status).toBe(415)
  })

  it('refuses a file whose bytes are not the type it claims', () => {
    const script = Buffer.from('<script>alert(1)</script>')
    expect(uploadProblem(file('notes.pdf', 'application/pdf', script), 'holidayWork')).toEqual({
      status: 415,
      message: 'That file does not look like the type it claims to be.',
    })
  })

  it('refuses names with paths, hidden characters or no extension', () => {
    expect(uploadProblem(file('../../etc/passwd.pdf', 'application/pdf', PDF_BYTES), 'document')?.status).toBe(415)
    expect(uploadProblem(file('C:\\temp\\a.pdf', 'application/pdf', PDF_BYTES), 'document')?.status).toBe(415)
    expect(uploadProblem(file('notes\u0000.pdf', 'application/pdf', PDF_BYTES), 'document')?.status).toBe(415)
    expect(uploadProblem(file('notes', 'application/pdf', PDF_BYTES), 'document')?.status).toBe(415)
  })

  it('refuses an empty file and one over the cap', () => {
    expect(uploadProblem(file('empty.pdf', 'application/pdf', Buffer.alloc(0)), 'document')?.status).toBe(415)
    const big = { ...file('big.pdf', 'application/pdf', PDF_BYTES), size: 51 * 1024 * 1024 }
    expect(uploadProblem(big, 'holidayWork')?.status).toBe(413)
  })

  it('normalises browser aliases and parameters', () => {
    expect(normaliseMimeType('application/x-zip-compressed')).toBe('application/zip')
    expect(normaliseMimeType('Image/JPG')).toBe('image/jpeg')
    expect(normaliseMimeType('application/pdf; charset=binary')).toBe('application/pdf')
  })
})

describe('inside a ZIP folder', () => {
  it('lists the entries from the central directory', () => {
    const entries = readZipEntries(makeZip([{ name: 'a.txt' }, { name: 'b/c.html' }]))
    expect(entries?.map((entry) => entry.name)).toEqual(['a.txt', 'b/c.html'])
  })

  it('refuses programs, scripts, macro files and nested archives', () => {
    for (const name of ['setup.exe', 'run.bat', 'tool.ps1', 'virus.js', 'shortcut.lnk', 'book.xlsm', 'inner.zip', 'more.rar']) {
      expect(zipProblem(makeZip([{ name: 'fine.docx' }, { name: `folder/${name}` }]), 'archive'), name).toMatch(/cannot be uploaded/)
    }
  })

  it('refuses entries that would unpack outside the folder', () => {
    for (const name of ['../evil.txt', 'a/../../evil.txt', '/etc/passwd', 'C:/Windows/evil.txt', '..\\evil.txt']) {
      expect(isUnsafeEntryPath(name), name).toBe(true)
      expect(zipProblem(makeZip([{ name }]), 'archive'), name).toBe('The folder contains a file with an unsafe path.')
    }
    expect(isUnsafeEntryPath('Practical 1/..notes.txt')).toBe(false)
  })

  it('refuses password-protected entries', () => {
    expect(zipProblem(makeZip([{ name: 'secret.docx', flags: 1 }]), 'archive')).toBe(
      'Password-protected files cannot be uploaded.',
    )
  })

  it('refuses a zip bomb, by ratio and by total size', () => {
    const bomb = makeZip([{ name: 'huge.txt', data: Buffer.alloc(1000), declaredSize: 500 * 1024 * 1024 }])
    expect(zipProblem(bomb, 'archive')).toMatch(/unpacks to far more/)

    const many = makeZip(
      Array.from({ length: 5 }, (_, index) => ({
        name: `part${index}.bin.txt`,
        data: Buffer.alloc(1024 * 1024),
        declaredSize: 50 * 1024 * 1024,
      })),
    )
    expect(zipProblem(many, 'archive')).toMatch(/more than 200 MB/)
  })

  it('refuses a damaged or empty ZIP', () => {
    expect(zipProblem(Buffer.from([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]), 'archive')).toMatch(/damaged/)
    expect(zipProblem(makeZip([]), 'archive')).toMatch(/damaged/)
  })
})

describe('inside a Word file', () => {
  it('refuses macros, so a renamed .docm cannot get in', () => {
    const docm = makeDocx([{ name: 'word/vbaProject.bin' }])
    expect(uploadProblem(file('notes.docx', DOCX, docm), 'holidayWork')?.message).toMatch(/macros/)
  })

  it('refuses a ZIP renamed to .docx', () => {
    const zip = makeZip([{ name: 'readme.txt' }])
    expect(uploadProblem(file('notes.docx', DOCX, zip), 'holidayWork')?.message).toMatch(/not a real \.docx/)
  })

  it('allows the ordinary binary parts a Word file carries', () => {
    expect(zipProblem(makeDocx([{ name: 'word/printerSettings/printerSettings1.bin' }]), 'docx')).toBeNull()
  })
})
