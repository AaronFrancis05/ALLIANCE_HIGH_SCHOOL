/**
 * A readable title from an uploaded file's name, so a head of department can bulk-upload a
 * folder of papers without typing each title (P3-T2). It can be edited afterwards.
 *
 *   "S4_Physics_Paper1_2024.pdf"  ->  "S4 Physics Paper1 2024"
 *   "chemistry-notes-term-2.docx" ->  "Chemistry notes term 2"
 */

export function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[a-z0-9]{1,5}$/i, '')
  const words = base
    .replace(/[_\-.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!words) return ''
  return words.charAt(0).toUpperCase() + words.slice(1)
}
