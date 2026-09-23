/**
 * The enquiry form's rules (FR-21), shared by the browser and the server.
 */

import { describe, expect, it } from 'vitest'
import { parseEnquiryForm, readEnquiryForm } from '../../src/lib/enquiry-schema'

function form(entries: Record<string, string>): FormData {
  const data = new FormData()
  for (const [name, value] of Object.entries(entries)) data.set(name, value)
  return data
}

const question = {
  form: 'contact',
  name: 'Test Parent',
  email: 'parent@example.test',
  phone: '',
  subject: 'Uniform',
  message: 'Where can we buy the school uniform?',
  website: '',
}

describe('parseEnquiryForm', () => {
  it('accepts a general question with an email address', () => {
    expect(parseEnquiryForm(form(question)).success).toBe(true)
  })

  it('accepts a telephone number instead of an email address', () => {
    expect(parseEnquiryForm(form({ ...question, email: '', phone: '0772 123456' })).success).toBe(true)
  })

  it('asks for some way to reply', () => {
    const result = parseEnquiryForm(form({ ...question, email: '', phone: '' }))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.email).toMatch(/so the office can reply/)
  })

  it('refuses a message stuffed with links', () => {
    const spam = 'Great deals http://a.example http://b.example www.c.example buy now'
    const result = parseEnquiryForm(form({ ...question, message: spam }))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.message).toMatch(/no more than 2 links/)
  })

  it('refuses a submission with the honeypot filled in', () => {
    expect(parseEnquiryForm(form({ ...question, website: 'http://spam.example' })).success).toBe(false)
  })

  it('asks a former student for the year they finished', () => {
    const result = parseEnquiryForm(form({ ...question, form: 'alumni', yearOfCompletion: 'long ago' }))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.yearOfCompletion).toMatch(/year you finished/)
    expect(parseEnquiryForm(form({ ...question, form: 'alumni', yearOfCompletion: '2015' })).success).toBe(true)
  })

  it('asks a job enquirer which post, and ignores fields from other topics', () => {
    const result = parseEnquiryForm(form({ ...question, form: 'careers', position: '' }))
    expect(result.success).toBe(false)
    const read = readEnquiryForm(form({ ...question, form: 'contact', position: 'Teacher', yearOfCompletion: '2015' }))
    expect(read).not.toHaveProperty('position')
    expect(read).not.toHaveProperty('yearOfCompletion')
  })

  it('refuses an unknown topic', () => {
    const result = parseEnquiryForm(form({ ...question, form: 'sales' }))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.form).toBe('Choose what your message is about')
  })
})
