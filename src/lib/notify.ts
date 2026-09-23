/**
 * Email and SMS, behind one interface so no feature depends on a particular provider.
 *
 * Locally, email goes to Mailpit (http://localhost:8025) and SMS is written to the log,
 * so the whole admissions and password-reset flow can be tested without spending money
 * or sending anything to a real parent.
 */

import type { Payload } from 'payload'
import { env } from './env'
import { logger } from './logger'

export interface EmailMessage {
  to: string
  subject: string
  /** Plain text. Always provided: many parents read mail on feature phones. */
  text: string
  html?: string
}

export interface SmsMessage {
  to: string
  text: string
}

export interface Notifier {
  sendEmail(message: EmailMessage): Promise<void>
  sendSms(message: SmsMessage): Promise<void>
}

/** Ugandan numbers in the +2567XXXXXXXX form the gateways expect. */
export function normaliseUgandanPhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '')

  if (/^\+256\d{9}$/.test(digits)) return digits
  if (/^256\d{9}$/.test(digits)) return `+${digits}`
  if (/^0\d{9}$/.test(digits)) return `+256${digits.slice(1)}`
  if (/^\d{9}$/.test(digits)) return `+256${digits}`

  return null
}

class ConsoleSmsProvider {
  async send({ to, text }: SmsMessage): Promise<void> {
    // The number is partly masked even locally: logs get copied around.
    const masked = to.slice(0, 7) + '***' + to.slice(-2)
    logger.info('SMS (not actually sent, console provider)', { to: masked, text })
  }
}

class AfricasTalkingProvider {
  async send({ to, text }: SmsMessage): Promise<void> {
    const body = new URLSearchParams({
      username: env.sms.username,
      to,
      message: text,
      ...(env.sms.senderId ? { from: env.sms.senderId } : {}),
    })

    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        apiKey: env.sms.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    })

    if (!response.ok) {
      throw new Error(`SMS gateway returned ${response.status}`)
    }
  }
}

export function createNotifier(payload: Payload): Notifier {
  const sms = env.sms.provider === 'africastalking' ? new AfricasTalkingProvider() : new ConsoleSmsProvider()

  return {
    async sendEmail(message) {
      try {
        await payload.sendEmail({
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
        })
      } catch (error) {
        // A failed notification must not lose the applicant's submission.
        logger.error('Could not send email', { subject: message.subject, error })
      }
    },

    async sendSms(message) {
      const to = normaliseUgandanPhone(message.to)
      if (!to) {
        logger.warn('Skipped SMS: number could not be read', {})
        return
      }
      try {
        await sms.send({ to, text: message.text })
      } catch (error) {
        logger.error('Could not send SMS', { error })
      }
    },
  }
}
