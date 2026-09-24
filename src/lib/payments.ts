/**
 * Payments are deliberately not implemented.
 *
 * The school is not collecting money through the website for now, so the admissions
 * flow has no fee step. This interface exists so that adding Flutterwave, Pesapal or
 * SchoolPay later is a new file and a configuration change, not a rewrite of admissions.
 *
 * Whoever implements it: verify the webhook signature, then re-query the provider before
 * marking anything paid, and make the write idempotent on the provider reference (A08).
 */

export interface PaymentRequest {
  reference: string
  amount: number
  currency: 'UGX'
  description: string
  payer: { name: string; phone: string; email?: string }
  returnUrl: string
}

export interface PaymentSession {
  /** Where to send the payer to complete the payment. */
  checkoutUrl: string
  providerReference: string
}

export interface PaymentStatus {
  state: 'pending' | 'paid' | 'failed'
  amount?: number
  providerReference: string
}

export interface PaymentProvider {
  readonly name: string
  createSession(request: PaymentRequest): Promise<PaymentSession>
  /** Ask the provider directly. Never trust the webhook body alone. */
  verify(providerReference: string): Promise<PaymentStatus>
}

class PaymentsDisabledProvider implements PaymentProvider {
  readonly name = 'disabled'

  async createSession(): Promise<PaymentSession> {
    throw new Error(
      'Online payments are not enabled. Applications are accepted without an online fee; see src/lib/payments.ts.',
    )
  }

  async verify(): Promise<PaymentStatus> {
    throw new Error('Online payments are not enabled.')
  }
}

export const paymentsEnabled = false

export function getPaymentProvider(): PaymentProvider {
  return new PaymentsDisabledProvider()
}
