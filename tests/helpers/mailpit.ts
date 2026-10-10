/**
 * Reads the mail the app sent locally. Mailpit catches everything; nothing reaches a real inbox.
 */

import type { APIRequestContext } from '@playwright/test'

const MAILPIT = process.env.MAILPIT_URL ?? 'http://localhost:8025'

export interface Mail {
  subject: string
  text: string
}

/** Every message sent to one address, oldest first. */
export async function mailFor(request: APIRequestContext, address: string): Promise<Mail[]> {
  const search = await request.get(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${address}"`)}`)
  const { messages } = (await search.json()) as { messages: { ID: string; Subject: string }[] }
  const mail: Mail[] = []
  for (const message of messages.reverse()) {
    const full = (await (await request.get(`${MAILPIT}/api/v1/message/${message.ID}`)).json()) as { Text: string }
    mail.push({ subject: message.Subject, text: full.Text })
  }
  return mail
}
