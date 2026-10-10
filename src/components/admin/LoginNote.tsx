/**
 * Under the admin sign-in form: this page is for staff, and where students and new staff
 * should go instead.
 */

import React from 'react'

export function LoginNote() {
  return (
    <div className="ahsn-login-note">
      <p>
        <strong>Staff sign-in.</strong> New staff: use the link in your invitation email to choose
        a password first.
      </p>
      <p>
        Students: sign in at the <a href="/portal/sign-in">student portal</a>.
      </p>
    </div>
  )
}
