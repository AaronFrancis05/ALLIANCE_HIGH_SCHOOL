/**
 * Under the admin sign-in form: this door is for the super admin only, and where staff and
 * students sign in instead (FR-05). The Users beforeLogin hook enforces it.
 */

import React from 'react'

export function LoginNote() {
  return (
    <div className="ahsn-login-note">
      <p>
        <strong>Super admin sign-in.</strong> Staff: sign in at the <a href="/staff/sign-in">staff portal</a>.
      </p>
      <p>
        Students: sign in at the <a href="/portal/sign-in">student portal</a>.
      </p>
    </div>
  )
}
