/**
 * The application form parser (FR-16). The browser and the server both run this, so these
 * tests are the proof that the two check an application the same way.
 */

import { describe, expect, it } from 'vitest'
import { parseApplicationForm, readApplicationForm } from '../../src/lib/application-form'

/** Fifteen years ago, safely inside the accepted age range. */
const DATE_OF_BIRTH = `${new Date().getFullYear() - 15}-03-14`

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [name, value] of Object.entries(entries)) data.set(name, value)
  return data
}

const base = {
  firstName: 'Test',
  lastName: 'Applicant',
  gender: 'female',
  dateOfBirth: DATE_OF_BIRTH,
  formerSchool: 'Example Primary School',
  guardianName: 'Test Guardian',
  guardianPhone: '0700 000000',
  guardianEmail: '',
  residence: 'boarding',
  consent: 'on',
  website: '',
}

const seniorOne = {
  ...base,
  applicantType: 's1',
  pleIndexNumber: '001234/056',
  pleYear: '',
  'pleGrades.mathematics': 'D1',
  'pleGrades.english': 'D2',
  'pleGrades.science': 'C3',
  'pleGrades.sst': 'D2',
}

describe('parseApplicationForm', () => {
  it('accepts a complete Senior One application', () => {
    const result = parseApplicationForm(form(seniorOne))
    expect(result.success).toBe(true)
  })

  it('works the PLE aggregate out from the grades, ignoring any aggregate that was posted', () => {
    const result = parseApplicationForm(form({ ...seniorOne, pleAggregate: '4' }))
    expect(result.success && result.data.applicantType === 's1' && result.data.pleAggregate).toBe(8)
  })

  it('treats a blank optional year as not given, not as zero', () => {
    const result = parseApplicationForm(form(seniorOne))
    expect(result.success && result.data.applicantType === 's1' && result.data.pleYear).toBeUndefined()
  })

  it('reports each problem against the name of the field it belongs to', () => {
    const result = parseApplicationForm(
      form({ ...seniorOne, firstName: '', 'pleGrades.english': '', guardianPhone: 'call me' }),
    )
    expect(result.success).toBe(false)
    if (result.success) return
    expect(Object.keys(result.errors)).toEqual(
      expect.arrayContaining(['firstName', 'pleGrades.english', 'guardianPhone']),
    )
    expect(result.errors).not.toHaveProperty('pleAggregate')
  })

  it('asks for missing grades rather than complaining about the aggregate', () => {
    const result = parseApplicationForm(
      form({ ...seniorOne, 'pleGrades.english': '', 'pleGrades.science': '', 'pleGrades.sst': '' }),
    )
    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors['pleGrades.mathematics']).toBeUndefined()
    expect(result.errors['pleGrades.english']).toBe('Select a grade')
  })

  it('asks for the applicant type when none is chosen', () => {
    const { applicantType: _omitted, ...rest } = seniorOne
    const result = parseApplicationForm(form(rest))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.applicantType).toMatch(/applying for/)
  })

  it('refuses an application without consent', () => {
    const { consent: _omitted, ...rest } = seniorOne
    const result = parseApplicationForm(form(rest))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.consent).toBe('Please confirm the details are correct')
  })

  it('never shows a family a raw validation message', () => {
    const result = parseApplicationForm(form({ applicantType: 's1' }))
    expect(result.success).toBe(false)
    if (result.success) return
    for (const message of Object.values(result.errors)) {
      expect(message).not.toMatch(/invalid|expected|received|required/i)
    }
  })

  it('refuses a submission with the honeypot filled in', () => {
    const result = parseApplicationForm(form({ ...seniorOne, website: 'http://spam.example' }))
    expect(result.success).toBe(false)
  })

  it('reads only the section for the chosen applicant type', () => {
    const read = readApplicationForm(form({ ...seniorOne, applicantType: 'transfer', combination: 'PCM' }))
    expect(read).not.toHaveProperty('pleGrades')
    expect(read).not.toHaveProperty('combination')
    expect(read).toHaveProperty('reasonForTransfer')
  })

  it('ignores blank UCE rows and needs at least six subjects', () => {
    const rows: Record<string, string> = {}
    ;['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology'].forEach((subject, row) => {
      rows[`uceResults.${row}.subject`] = subject
      rows[`uceResults.${row}.grade`] = 'B'
    })
    const s5 = { ...base, applicantType: 's5', uceIndexNumber: 'U0001/501', combination: 'PCM', ...rows }

    const fiveSubjects = parseApplicationForm(form(s5))
    expect(fiveSubjects.success).toBe(false)
    if (!fiveSubjects.success) expect(fiveSubjects.errors.uceResults).toMatch(/six subjects/)

    const sixSubjects = parseApplicationForm(
      form({ ...s5, 'uceResults.7.subject': 'Geography', 'uceResults.7.grade': 'C' }),
    )
    expect(sixSubjects.success).toBe(true)
    if (sixSubjects.success && sixSubjects.data.applicantType === 's5') {
      expect(sixSubjects.data.uceResults).toHaveLength(6)
    }
  })

  it('accepts a transfer into an allowed class and refuses one into Senior One', () => {
    const transfer = {
      ...base,
      applicantType: 'transfer',
      classSought: 'S3',
      currentClass: 'Senior Two',
      reasonForTransfer: 'The family is moving to Nansana.',
    }
    expect(parseApplicationForm(form(transfer)).success).toBe(true)

    const intoSeniorOne = parseApplicationForm(form({ ...transfer, classSought: 'S1' }))
    expect(intoSeniorOne.success).toBe(false)
    if (!intoSeniorOne.success) expect(intoSeniorOne.errors).toHaveProperty('classSought')
  })
})
