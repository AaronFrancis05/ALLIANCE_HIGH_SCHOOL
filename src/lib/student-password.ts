/**
 * The rule for a student's portal password. Shared by the first-time sign-in form in the
 * browser (a hint only) and the server action (the check that counts).
 */

export const MIN_PASSWORD_LENGTH = 8

/** At least eight characters with a letter and a number: memorable on a phone, not trivial. */
export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  if (password.length > 200) return 'That password is too long.'
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return 'Use at least one letter and one number.'
  return null
}
