/**
 * The two staff doors (FR-05): the super admin signs in at /admin, every other staff member
 * at /staff. Shared by the Users collection's beforeLogin hook, which enforces it, and the
 * staff portal, which marks its own sign-ins and shows these refusals as written.
 */

/** Set on the request context by the staff portal's sign-in. */
export const STAFF_PORTAL_SIGN_IN = 'staffPortalSignIn'

/** Shown when someone signs in at the other door. Only reached with the right password. */
export const WRONG_DOOR = {
  staff: 'Staff sign in at the staff portal: /staff',
  superAdmin: 'The super admin signs in at /admin.',
} as const

export const SWITCHED_OFF = 'This account has been switched off. Please speak to the ICT office.'
