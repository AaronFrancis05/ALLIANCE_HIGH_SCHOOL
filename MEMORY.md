# MEMORY.md: progress log

The running record of what has been built, what state it is in, and what was decided along the
way. The roadmap is [PLAN.md](PLAN.md); requirement-level status is in [docs/SRS.md](docs/SRS.md).

**Rule for every session (human or agent):** read this file first. Before you finish, update
**Current status** and add a dated entry to the **Log**. Newest entries go at the top. Keep each
entry short: what changed, what was verified, what is left.

---

## Current status (as of 2026-10-12)

**Where we are:** P0–P4 done; P2 now done (P2-T11 leadership/staff, P2-T12 careers); P3 done; P5 done (P5-T1 to P5-T5). P6 hardening and P7 launch remain.
**Latest:** 2026-10-11 staff portal and multi-role staff (FR-05) on `feat/P6-staff-portal-roles`, merged into `dev`: the super admin is an account type and signs in at /admin only; every other staff member signs in at /staff and holds any number of roles; registrar merged into secretary, admissions into bursar. **Production database**: `holiday_work` and `staff_accounts_roles_add` are applied (2026-10-11); `staff_accounts_roles_drop` is **pending on purpose** and must run only after `main` deploys this code (`pnpm payload migrate`, answer yes to the dev-mode prompt: the old 2026-10-01 `dev` row is harmless). Holiday work (P3-T4) committed on `feat/P3-T4-holiday-work`, also merged.
**Documentation:** PR #10 component JSDoc now attaches to all four touched function declarations; local coverage verification is 4/4. Hosted coverage rerun pending.
**Next up:** student bulk import (CSV, dry run; fills the `import:students` loose end), P6 site-wide search and performance budget, or P4-T bulk report-card import (FR-12). Contact details in docs/CONTENT_TODO.md deliberately left until launch (school owner's call, 2026-09-23).

### Health checks
| Check | Result | When |
|---|---|---|
| `pnpm typecheck` | ✅ passes | 2026-10-11 |
| `pnpm test` (unit) | ✅ 274 / 274 pass | 2026-10-11 |
| `pnpm lint` | ✅ passes | 2026-10-11 |
| `pnpm e2e` | ✅ careers 2/2, about 3/3, enquiry 3/3 (reused dev server) | 2026-09-24 |
| 360 px visual check | ✅ /careers and /careers/[slug]: no sideways scroll, console clean | 2026-09-24 |

### Git
- `main` holds only `064eda3 feat: initial commit`. P0 to P4 is on `feat/P0-P4-foundation-and-portal`;
  P3-T3 is on `feat/P3-library-downloads`, P3-T1 on `feat/P3-T1-library-filters`, the session fixes on
  `fix/P4-session-hardening`, and P5-T1 on `feat/P5-T1-online-application`, each branched from the
  one before. None is merged or pushed.

---

## What exists

### Accomplished
- **Services and tooling**: Docker Compose (Postgres, MinIO, Mailpit), `.env.example`, image
  pipeline (`pnpm images`, `pnpm crest`, `pnpm images:guide`), seed script (`pnpm seed`, which refuses
  to run in production).
- **Brand**: the genuine school crest, favicons and brand tokens. 16 real school photos optimised with blur placeholders.
- **CMS (Payload)**: 21 collections (pages, posts, albums, videos, events, downloads, resources,
  departments, subjects, staff profiles, testimonials, students, academic terms, report cards,
  fee clearances, applications, application documents, form submissions, audit logs, categories,
  media, users) and 4 globals (site settings, navigation, home page, admissions).
- **Access control**: `src/access/` (roles, resources, report cards). Every rule denies by
  default and has unit tests, including the refusal cases.
- **Public site** (`src/app/(site)/`): home, about, academics, student life, admissions, fees, news
  (list and detail), events (list and detail), gallery (list and album), resources (listing),
  contact, privacy, 404, plus `robots.ts` and `sitemap.ts`.
- **Student portal** (`src/app/(portal)/`): sign-in by admission number, dashboard, results page.
  Report-card file route `src/app/api/files/report-card/[id]` enforces the three-part gate (owns
  it + term released + fees cleared), returns a 5-minute signed URL, and writes an audit entry.
- **Libraries** (`src/lib/`): storage (signed URLs), audit, rate-limit, logger with redaction, notify,
  payments seam, session, upload safety, admissions Zod schema, revalidate-on-publish.
- **SEO and security**: JSON-LD structured data, security headers in `src/proxy.ts`.
- **Docs**: SRS, ARCHITECTURE, IMAGE_GUIDE, CONTENT_TODO.

### Known gaps and loose ends
- `TURNSTILE_*` settings exist in `.env.example` and `env.ts` but nothing uses them; the enquiry and application forms rely on a honeypot and rate limits (and a link cap for enquiries).
- Rate limits (`src/lib/rate-limit.ts`) are still in memory per process. Fine for one VPS; several servers would need a shared store.
- There is no site search. Admissions has no document upload, tracking page or family notification yet (P5-T2 to P5-T4).
- The header's "Apply now" link (Navigation global) still points to `/admissions`, which now links on to `/admissions/apply`.
- The `import:students` script points to a file that does not exist: `scripts/import-students.ts`.
- There is no `docs/DEPLOYMENT-VPS.md` and no CI pipeline.
- There are 6 AI placeholder images left (lab practical, football, MDD, dining hall, dormitory, prize-giving), and many school facts are still placeholders (docs/CONTENT_TODO.md).

---

## Decisions (and why)
- **Nobody types a password for someone else** (school owner's call, 2026-10-10). Only the super admin adds staff; each gets an emailed invitation (Payload reset token, 72 h) to choose their own. Students are created by the registrar without one and set it through first-time sign-in, with a 6-digit code emailed to the student's and guardians' addresses on the record. Admission numbers are typed in the school's own format; there is no generated pattern.
- **The admin menu shows each role only its sections** (`hiddenUnless` in `src/access/roles.ts`). Hidden sections also 404 by URL, but access functions still decide every read and write.
- **Family notifications: email now, SMS built but off** (the school owner's call, 2026-09-23). `NOTIFY_SMS_ENABLED=false` until the school has an Africa's Talking account; each SMS costs money. Messages carry the reference and stage only, never the child's name.
- **Applications are kept 12 months after their last status change**, whatever the outcome, then deleted with their documents (the school owner's call, 2026-09-23).
- **Payload inside Next.js**, not a separate CMS, so there is one app, one database and one place to secure.
- **Students and staff are separate collections**, so a student session can never pass a staff check.
- **The bursar cannot read report cards.** The bursar only sets clearance.
- **"Not yours" and "does not exist" get identical refusal messages**, so report-card IDs cannot be probed.
- **Private files are never URLs**. They are served only through a route handler with a 5-minute signed URL.
- **Unconfirmed school facts are bracketed placeholders**, listed in docs/CONTENT_TODO.md.

---

## Log

### 2026-10-12 (motion refinement, hero autoplay)
- Owner asked to remove the gold chalk underline under headings: `.chalk-underline` is gone from motion.css, SectionHeading, Welcome and the home page. Motion toned down: reveal travel 0.75rem over 600 ms with an expo ease-out, the PageHeader zoom-settle is 1.04 over 2.4 s, the card hover lift is 2 px, and the button press scales to 0.98.
- Home hero now advances every 7 s. The timer is the active dot's CSS progress bar (`.hero-progress`); `animationend` moves to the next slide, so pausing the animation pauses the carousel. It holds while a mouse is over it, while the tab is hidden, or after the new pause button is pressed (WCAG 2.2.2). There is no autoplay under reduced motion. The active slide's photo pushes in slowly (`.hero-photo`) and its copy fades up (`.hero-copy`). The active index only changes once the track settles (120 ms debounce).
- Verified: lint, typecheck (apart from a stale `.next/dev/types` entry for a deleted route), unit 274/274. **Not checked in a browser or by e2e**: `.env` points at production. Check the next Vercel preview at 360 px.

### 2026-10-12 (real photos replace 4 placeholders, merged into `dev`)
- Nine new school photos in `assets/`; six used (1779, 1738, 1739, 1825, 1838, 1847). Placeholders replaced: campus aerial → tree-lined avenue (home hero slide 3), assembly → students in uniform, computer lab → real lab, main gate → administration block (Contact header). Gallery "Around the campus" and "In the classroom" gain the new photos. 1823/1824/1846 are near-duplicates, left out.
- Still placeholders (no matching photo): chemistry practical, football, MDD, dining hall, dormitory, prize-giving. Main-gate photo still wanted for Google Business Profile (CONTENT_TODO §4).
- Verified: typecheck, lint on changed files, unit 274/274. **Not done**: production upload. `scripts/_oneoff-real-photos.ts` (dry run by default, `--apply` to write, needs `NODE_ENV=production` so Payload does not push schema) uploads the six through Payload and rewires home/posts/albums from the old placeholder ids. Delete it after use. The Contact page shows a plain header in production until it has run.

### 2026-10-12 (motion pass, `feat/ui-motion`, merged into `dev`)
- New `src/app/(site)/motion.css` (imported by brand.css) and `components/layout/MotionReveal.tsx` (mounted in the site, portal and staff layouts). No new dependency. Only `opacity` and `transform` animate, and everything sits behind `prefers-reduced-motion: no-preference`.
- Scroll reveal: `data-reveal` elements (SectionHeading, Card, home cards, post cards, gallery tiles, stats) rise in, staggered 80 ms. Nothing is hidden until the script sets `html[data-motion]`, and anything on screen at that moment is shown at once, so there is no flicker and no-JS visitors see everything.
- School touches: (chalk underline later removed, see above); the hero and PageHeader photos settle from a slight zoom (`.motion-settle`) while the title, lead and buttons rise in; cards lift on mouse hover (`.motion-lift`); buttons press (`.motion-press`); menus drop in (`.motion-drop`).
- Verified: lint, typecheck, unit 274/274; a static harness compiled from the real brand.css, checked in Chromium at 360 px and 1280 px (no sideways scroll, console clean, reduced motion leaves everything visible). **Not checked on the real pages or by e2e**: `.env` points at production. Check the next Vercel preview.

### 2026-10-12 (PR #10 docstring coverage)
- Moved the existing `BooleanCell` and `Header` JSDoc directly above their functions. `TopBar` and `booleanCell` were already documented.
- Verified with the TypeScript parser: attached documentation increased from 2/4 to 4/4; executable code is unchanged. Focused ESLint passed. Full application tests and browser checks were not run for this documentation-only change; hosted coverage rerun remains pending.

### 2026-10-12 (admin panel design pass)
- `src/app/(payload)/custom.scss`: fixed the sidebar bug where every group heading showed a gold bar (`.nav-group__indicator` is the chevron, not the active marker). List views now show the table as a card with uppercase headers, hover rows and maroon title links; there's a branded search bar, filter pills and pagination, and an empty state with a dashed panel. Edit views get a Playfair title, a maroon-to-cream rule under the header, a cream sidebar and a cream auth panel.
- New `components/admin/BooleanCell.tsx` plus `fields/boolean-cell.ts`: listed checkboxes read as badges ("Released / Not released", "Current", "Active / Deactivated", "Handled / New", and so on) instead of raw `true` / `false`. The import map was regenerated offline.
- Verified: typecheck, lint, unit 274/274. **Not yet looked at in a browser**: the local `.env` points at production, so check /admin on the next Vercel preview (desktop and 360 px).

### 2026-10-11 (P6 staff portal and multi-role staff, FR-05)
- **Model**: `users.accountType` (`staff` | `superAdmin`) plus `users.roles` (multi-select: `editor` Content Manager, `secretary` School Secretary, `bursar`, `hod`, `teacher`). `hasRole` is true for the super admin or any held role, so permissions add up. `registrar` merged into `secretary` (students, terms, report cards, resources); `admissions` merged into `bursar` (fees plus applications, documents, enquiries; still never report cards). Staff with no role pass `staffOnly` only and are refused the admin screens (`canUseAdminScreens`). All in `src/access/roles.ts`; collections swept to the new names; `filesOnlyHolidayWork` replaces the old teacher-only check; HOD + teacher rights now combine.
- **Two doors**: Users `beforeLogin` refuses non-super-admins unless the sign-in came through the staff portal (`STAFF_PORTAL_SIGN_IN` context), and refuses the super admin at the staff portal; also refuses deactivated accounts (previously only their access was cut). Checked after the password, so it reveals nothing to someone without it.
- **Staff portal** `src/app/(staff)/staff/`: sign-in, sign-out (revokes the session), forgot / reset password (invitations now link to `/staff/reset/<token>`, the super admin's to `/admin/reset/<token>`), profile (name, password change that re-checks the current password and signs out other devices), directory, and a home page with a card per role linking into the admin. Shared session-cookie helpers in `src/lib/session-cookie.ts`; role shortcuts in `src/lib/role-guide.ts` (also used by the admin Welcome panel). Links in the top bar and footer; `/staff` noindex, no-store, nonce CSP like `/portal`. Admin sidebar gets "Back to the staff portal" for staff.
- **Production incident (fixed)**: `payload migrate` reads migration files from the folder, not `index.ts`, so trying to hold back the drop by editing the index failed and all three ran at 22:12. `users.role` was restored within about three minutes in one transaction (original role per account, drop row deleted from `payload_migrations`); Vercel showed no runtime errors. To hold a migration back, move its files out of `src/migrations` instead.
- **Migrations**: `20261011_182041_staff_accounts_roles_add` (new columns, copies each `role` across with the merges) and `20261011_182129_staff_accounts_roles_drop` (drops `role`). Generated in two halves to avoid drizzle's interactive rename prompt. **Production order**: `holiday_work` and `..._add` can run before `main` deploys (old code keeps working); `..._drop` only after.
- Verified: lint, typecheck, unit 274/274 (new: additive roles, forged `superAdmin` in roles, two doors, HOD+teacher, invite links). e2e specs updated to sign staff in at /staff but **not run**: `.env` points at the production database and Docker is unavailable. 360 px check not done for the same reason (`pnpm dev` would push schema to production).
- Needs human review (AGENTS.md section 5): access rules, authentication, report cards and admissions all changed.

### 2026-10-11 (P3-T4 holiday work and upload hardening)
- **Holiday work** (FR-06a): a new resource type (`holidayWork`). Teachers get a `subjects` field (only the super admin sets it) and may create or edit holiday work only for those subjects (`writeResources`, `canFileResource` in `src/access/resources.ts`); the admin form offers them only that type and their subjects, and files it under the subject's department. HODs and editors keep their rules.
- **File rules**: holiday work takes PDF or .docx only; ZIP only when the subject has "Accepts ZIP folders" ticked (the migration ticks code `ICT`). ZIPs are refused everywhere else in the library. Re-filing an existing resource cannot smuggle a stored file past these rules.
- **Upload hardening for every collection**: file names go through a Zod schema (no paths, control characters or missing extension); the extension must match the declared type, which must match the bytes; Windows' `application/x-zip-compressed` is treated as ZIP. `src/lib/zip-inspect.ts` reads the central directory of every ZIP and .docx: unsafe paths, executables/scripts, macro files, nested archives, encryption, more than 1000 entries, more than 200 MB unpacked or a ratio above 200:1 are refused; a .docx with `vbaProject.bin` or no `word/document.xml` is refused.
- **URL params**: the three file routes and the calendar route validate `[id]` / `[slug]` with Zod (`src/lib/validation.ts`) before any query or audit entry.
- **Security fix**: a staff member could change their own `department` from their profile (no field access), so a HOD could move themselves into another department's shelf. Now super-admin only. Needs human review (AGENTS.md section 5).
- `/portal/library` shows a "Holiday work" section by subject above the shelf; the shelf leaves holiday work out unless filtered by that type. Cards show the format (PDF / Word / ZIP folder).
- Migration `20261011_174938_holiday_work` (enum value, `subjects.accepts_archives`, `users_rels`). **Not applied anywhere yet.**
- Verified: typecheck, lint, unit 257/257 (34 new). **Not run**: e2e and the 360 px check, because `.env` points at the production Supabase database and Docker is not available, and the e2e web server would write to that database.

### 2026-10-11 (admissions apply-online buttons)
- `/admissions` showed "Apply online" only in the closing banner. Added it under the three steps and first in the Requirements button row, both linking to `/admissions/apply` and shown only while `applicationsOpen` is on (FR-16).
- Validation: `pnpm lint` and `pnpm typecheck` pass. Not checked at 360 px in a browser.

### 2026-10-11 (review fixes)

- Verified all seven supplied findings against current code and fixed them. Added service-worker and audit regression tests.
- Validation: `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass (222 tests, including 19 new regression cases). Seed-command removal and padding-merge smoke checks pass. E2E and 360 px application checks blocked by absent local configuration and seeded fixtures; the seed implementation remains intentionally untracked.

### 2026-10-11 (branded error and offline pages)
- **Why**: production `/portal/sign-in` showed Next's unbranded "This page couldn't load". The app had a branded 404 but no error boundary.
- `src/components/layout/ErrorContent.tsx` is the shared body. It tells "offline" (retries by itself when the connection returns) apart from "failed on our side" (shows the error digest as a reference for the office, never the message). It is used by `src/app/(site)/error.tsx` and `src/app/(portal)/error.tsx` (both inside their header and footer) and by `src/app/global-error.tsx` (own document, for when a layout itself fails, e.g. the portal session lookup).
- **Offline**: `public/sw.js` (registered in production only by `ServiceWorkerRegister` in the site and portal layouts). It is network-first for page loads, serves the cached `public/offline.html` only when the fetch fails outright, and stores nothing else, so portal data is never cached. Raise its `CACHE_VERSION` when offline.html or the crest changes.
- Verified: typecheck, lint, unit 203/203; at 360 px the offline page, the error page online and offline (temporary throwing route, since removed): no sideways scroll. **Not run**: e2e; the service worker only registers in a production build, so check it on the next deploy (DevTools > Application > Service workers, then go offline and reload).

### 2026-10-11 (nobody changes their own role, the super admin included)
- `fieldSuperAdminOnOthers` (src/access/roles.ts) guards the staff `role` and `active` fields on update: only a super admin, and never on their own account. On their own account page, Role and Active are read-only. Another super admin can still demote or deactivate them. `deleteOtherStaff` stops a super admin from deleting their own account. So the access-checked paths can never leave the school with no active super admin.
- Verified: lint, typecheck, unit tests (new cases in tests/unit/access-accounts.spec.ts). **Not run**: e2e and the 360 px check. Needs human review (change under `src/access/`).

### 2026-10-11 (student sign-in hung on production; show-password button)
- **Bug**: portal sign-in on production never finished (Vercel log: `POST /portal/sign-in` "Task timed out after 300 seconds"). Not a password or first-time problem: the seeded test students have `AllianceDev1!` and `portalSetUp: true`. At peak a sign-in held three connections (advisory lock, Payload's login transaction, and the `afterLogin` audit write in its own transaction) against a production pool of 3, and node-postgres waits for a free connection forever.
- **Fix**: `recordAudit(..., { inTransaction: true })` writes the Students `afterLogin` entry inside the login transaction (peak is now 2); the duplicate `student.login` entry in `signInAction` is gone; the pool has `connectionTimeoutMillis: 10_000`, so starvation fails in seconds instead of hanging.
- **Show password**: `src/components/portal/PasswordInput.tsx` (eye button, `aria-pressed`, 48 px target) on the sign-in form and both first-time password boxes.
- **Seed code untracked** (owner's call): `scripts/seed.ts` and `src/app/api/admin/seed/` are git-ignored and removed from the index; they stay on the owner's machine. Fresh clones have no `pnpm seed`, and the next deploy has no seed route. The password is still in git history and in the e2e tests, so the accounts must still be rotated.
- Verified: typecheck, lint, unit 203/203. **Not run**: e2e and the 360 px check (Docker down; the only other DB is production). Check sign-in on production after deploy.

### 2026-10-10 (production logs: EMAXCONNSESSION again, Nodemailer ECONNREFUSED)
- Production (`ac0b41e`, already has the pool cap of 3) still hit the Supabase **session pooler's** 15-client cap on /admin and /admin/login. The error itself names the pooler's `pool_size: 15`, so the limit is the pooler, not Postgres. (The Supabase account connected to Claude, project `llxxcnrdrkshqddxkyxr`, is **not** the app's database: it has no Payload tables. The production DB lives in another account.) Suspended Vercel instances keep their connections because the idle timeout cannot fire while frozen.
- Fix: `onInit` in `src/payload.config.ts` calls `attachDatabasePool` from `@vercel/functions` (new dependency, Vercel's own helper for this), which releases idle connections before suspension. No-op off Vercel.
- Nodemailer tried `127.0.0.1:587` on every `/api/users/me`: Vercel's `SMTP_HOST` is a loopback value. `env.email.configured` now rejects a loopback host on Vercel (Payload then logs mail to the console) and `skipVerify` is on for Vercel. Local Mailpit unchanged.
- Verified: lint, typecheck, unit 196/196. e2e not run: Docker is down and the tests write data, so they were not pointed at the production DB.
- **Still to do on Vercel**: `DATABASE_URL` to the transaction pooler (port 6543); set a real `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS`, or staff invitation emails will not be delivered.

### 2026-10-10 (P4-T5: invitations, role-scoped admin, first-time sign-in)
- **Staff invitations** (FR-05): `src/lib/staff-invite.ts`. A new staff account gets an unusable random password and an invitation email linking to `/admin/reset/<token>`; `invitedAt` and `firstSignedInAt` track it, and the sidebar panel `InvitationStatus` offers "Send invitation again" (`POST /api/users/:id/invite`, super admin only via `canInviteStaff`). A virtual `password` field with access rules means a password typed for someone else is dropped, and the super admin cannot change another person's password; staff change only their own.
- **Gotcha**: Payload's auth panel always demands a password on a new document (`requirePassword: !id`), whatever the field access says. `AccountFormHelper` hides the boxes on create (CSS in custom.scss), fills them with a throwaway value the server discards, and keeps a student's hidden username equal to the admission number.
- **Role-scoped admin**: every collection and global has `admin.hidden: hiddenUnless(...)` mirroring its write roles. Media delete is now editor-only (was any staff).
- **Students** (FR-10): rules moved to `src/access/students.ts`. Fixed: a student could PATCH their own record (admission number, class, names) through the API; updates are now registrar-only. `mustChangePassword` (never enforced) replaced by `portalSetUp`; unticking it resets the password and signs out every device.
- **First-time sign-in**: `/portal/first-time` (`src/lib/student-setup.ts`, actions in `portal/first-time/actions.ts`). Same answer whether or not the number exists; codes HMAC-hashed, 15 min, 5 tries, one per minute, one email per address. Sign-in page has a "First-time sign-in" button.
- **Admin design**: `custom.scss` (brand tokens repeated, since the admin does not load brand.css), welcome panel with role shortcuts (`Welcome.tsx`), sign-in note, unfinished 2FA box hidden.
- **Migration** `20261010_095523_invites_first_signin`: new columns; `portal_set_up` backfilled from `NOT must_change_password`.
- Also: portal layout declares its favicon (it 404'd on /favicon.ico).

### 2026-10-10 (grid backgrounds)
- Two CSS-only patterns in `brand.css`, faded at the edges: `.pattern-grid` (fine maroon-tinted lines, light sections) and `.pattern-plus` (cream crosshairs on faint lines, dark sections). `Section` takes `pattern` and picks the variant from its tone.
- Applied to: home "Why choose us", the stats strip, the closing call to action, and inner-page headers that have no photo.
- Gotcha: `cn` runs tailwind-merge, which treats any `bg-*` class as a background colour and drops the real one. That is why the classes are `pattern-*`, not `bg-grid`.
- Verified: typecheck, lint; screenshots at 360 px and 1366 px, no sideways scroll, console clean. Not committed.

### 2026-10-10 (branded 404 for unknown URLs, map on the contact page, production DB pool)
- **404**: unknown URLs showed Next's bare page because the app has three root layouts. Added `src/app/global-not-found.tsx` (flag `experimental.globalNotFound`), with the crest header, no CMS read. Both 404s share `src/components/layout/NotFoundContent.tsx`; e-Library added to its suggestions.
- **Map**: the contact page's map only rendered when `mapEmbedUrl` was set, and production had none. `src/lib/map.ts` now always gives one: coordinates if entered, else a pasted Google Maps link (https www.google.com/maps only), else a search for the school's name. Map sits right under the contact cards with a "Get directions" button; the empty "Where we are" card falls back to Nansana, Wakiso District, Uganda. Unit tests: `tests/unit/map.spec.ts`.
- **Production 500s** (e.g. /resources, digest 885424223): Vercel logs showed `EMAXCONNSESSION`, the Supabase session pooler's 15-client cap, on /, /events, /admissions, /contact too. Pool now capped at `DATABASE_POOL_MAX` (default 3 in production) with a 10 s idle timeout. **Still to do on Vercel**: switch `DATABASE_URL` to the transaction pooler (port 6543), the real fix for serverless.
- Verified: typecheck, lint, unit 162/162. Not deployed.

### 2026-10-10 (search appearance, like an established school's Google result)
- **Goal**: the result St Mary's College Kisubi and Greenhill Academy get: name and crest above the link, a short description, sitelinks, a knowledge panel. Their data was not used, only the structure.
- **Code**: `WebSiteJsonLd` on the home page (site name above the address); home title is the school name alone, with an admissions-focused description and its own canonical; 192 px favicon declared (Google needs multiples of 48 px); crest as default `og:image`; `HighSchool` data now lists a real campus photo first and a `hasMap` link once coordinates are set.
- **Bug fixed**: the layout set `canonical: '/'` site-wide, so any page without its own canonical (the 404) claimed to be the home page. Removed; the home page sets it.
- **docs/SEO.md** (was referenced but missing): what the code supplies, and what the school must do itself: Google Business Profile (the right-hand panel: hours, Directions, photos), Search Console with the sitemap, and Wikidata for "Founded" and "Colours". CONTENT_TODO gains the gate's map coordinates.
- Verified: lint, typecheck, unit 156/156; `frontend.e2e.spec.ts` 7/7 (two new: home name/site-name/favicon/og:image; inner canonical and none on the 404), including the 360 px check, against local Docker services.
- **Note for testing**: `.env` now points at a remote Supabase pooler (`connection_limit=1`), where a page takes 2 to 10 minutes to render. Run tests against the local stack instead: `set -a; . ./.env.example; set +a; pnpm dev --port 3002`, then `PLAYWRIGHT_BASE_URL=http://localhost:3002 pnpm e2e`.
- Not in scope, noticed: an unknown URL renders Next's default 404 page, not `src/app/(site)/not-found.tsx`. (Fixed the same day.)

### 2026-10-08 (nav section links, failing Vercel builds)
- **Nav**: items with a drop-down were a `<button>`, so About, Academics, Admissions, Student life and News never routed, and hover lived on the button alone, so moving into the panel closed it. `src/components/layout/Header.tsx`: the label is now a link, a chevron button (`aria-label="<Item> pages"`) toggles the panel, and mouse-only pointer hover covers the whole item. Verified on a local production build (hover into panel, label and child links route, touch tap on chevron, 360 px drawer with no overflow) and live.
- **Builds failing on Vercel** (`cbbefa6` and the nav branch): prerendering ran out of Supabase session-pooler clients (EMAXCONNSESSION, limit 15), since each build worker opens its own pool. `next.config.ts` now uses one worker, four pages at a time, two retries; `main` and `dev` then built together without failing. Worth considering: point `DATABASE_URL` on Vercel at the transaction pooler (port 6543), which is meant for serverless. The runtime pool was left at its default because `withAdvisoryLock` holds one connection while sign-in work needs another.
- No Docker on this machine; the local production build reads the production database (production mode, no schema push).
- **Lint clean**: unused code removed from the seed route, `any` replaced by `Payload`, `src/migrations/` added to the generated-files lint ignore list. `pnpm lint` and `pnpm typecheck` pass; unit 156/156.
- **OPEN SECURITY ITEM (owner chose to leave it for now, 2026-10-08)**: `src/app/api/admin/seed/route.ts` gives the six seeded staff accounts (including super admin `admin@alliancehigh.sc.ug`) and three sample students the hard-coded password `DEV_PASSWORD`, and the GitHub repo is public. If the seed ran on production, those accounts are open to anyone. Fix before launch: rotate those passwords, make the route read the password from an env var (or remove the route; it also wipes every collection). The route itself refuses requests without `SEED_SECRET` (401).

### 2026-10-07 (CSP blocked all JavaScript on the public site)
- **Symptom on Vercel**: nav dropdowns, hero carousel and lazy images dead. Cause: `src/proxy.ts` sent a nonce + `'strict-dynamic'` policy on every page, but public pages are statically generated, so their scripts carry no nonce and the browser blocked every chunk (seen in headless Chromium). The nonce was also never passed to Next on the request, so it could not have worked on dynamic pages either.
- **Fix**: public pages get `script-src 'self' 'unsafe-inline'` (Next's documented policy for static pages); `/portal` and `/admin` keep nonce + `'strict-dynamic'`, now set on the request too so Next stamps it. Unit test `tests/unit/proxy-csp.spec.ts`.
- Merged to `dev` and `main` (fast-forward); verified live: no console errors, 18/18 images load after scrolling, nav dropdowns open, `/admin/login` loads.
- **Missing R2 media fixed (2026-10-08)**: four placeholder files had records in the database but no object in the bucket (chemistry lab, dining hall, football match, main gate), because the Vercel seed (`src/app/api/admin/seed/route.ts`) creates media entries without uploading files. Uploaded them from `public/photos/` to `media/` in the `ahsn` bucket; all 34 R2 images across the main pages now return 200. A future re-seed on Vercel can leave files missing again. Lint has 9 errors, already on main, in `src/app/api/admin/seed/route.ts` and a migration.
- Not run: e2e and a local production build (Docker was not running).

### 2026-09-24 (P2-T12 Careers)
- **Vacancies collection** (`vacancies`, drafts, `publishedOrStaff`, editor-only writes) with title, slug, summary, employment (fullTime/partTime/contract), closingDate (dayOnly), body and howToApply. Revalidates `/careers` and `/careers/[slug]`.
- **/careers** lists only open posts (closingDate absent or ≥ start of today in Kampala, UTC+3); empty state when none. **/careers/[slug]** stays up after closing and shows “This post has closed” with no form; drafts are 404; closed posts are `noindex` and omitted from sitemap. Open posts show preset enquiry form (`careers` topic, position filled).
- **EnquiryForm preset** (`preset?: Record<string,string>`) so a vacancy can start the form on careers with the post name; values still come from server state on error.
- **Kampala day logic** in `src/lib/vacancies.ts` (`closesAt`, `isVacancyOpen`, `openVacancyCutoff`) unit-tested; sitemap adds only open vacancies.
- **Menus**: Careers added as top-level nav and footer link; About dropdown keeps Leadership/Our staff.
- Verified: typecheck, lint, unit 4/4; careers e2e 2/2 (open/closed/draft, preset); 360 px no scroll, console clean.

### 2026-09-24 (P2-T11 About sub-pages)
- **/about/leadership** (Director and Founder, then the Head Teacher featured, then the administration) and **/about/staff** (heads of subject split O-Level / A-Level, teaching and support staff), all from the Staff directory, so the office edits them in the CMS. A bracketed placeholder name shows as "Name to be confirmed"; a missing photo shows a silhouette. New `director` group and `level` field on staff profiles.
- **Content from the school owner**: leadership names with honorifics, and the printed heads-of-subject list (29 posts, names exactly as printed; spellings such as "Ngororano Vicent" and "Tulyakira Justus Byamuto" should be checked against the school's records). The home page welcome now names Mrs. Ainesaasi Oliver. Still placeholders: the Deputy Head Teacher, teaching and support staff, all photographs.
- Menus: About now has Leadership and Our staff; Admissions has Apply online and Track an application.
- Verified: typecheck, lint, about e2e 3/3; 360 px screenshots of both pages, no sideways scroll, console clean.

### 2026-09-23 (P2-T10 calendar)
- **Add to calendar** on every event page: `/api/calendar/event/[slug]` serves an RFC 5545 file (escaped text, 75-octet folding, UTC times, stable UID so a second download updates the entry). Published events only; drafts and unknown slugs are a plain 404. No end time is invented when an event has none.
- Verified: unit 148/148; calendar e2e 2/2 (real download from a seeded event; draft refused).

### 2026-09-23 (P2-T9)
- **Enquiry form** on `/contact#enquiry` (FR-21): a general question, visit request, alumni registration or job enquiry. Shared schema in `src/lib/enquiry-schema.ts` (browser and server), needs an email or a phone, at most 2 links, honeypot; the server rate-limits (5 per 10 min), saves to Enquiries with `overrideAccess` (public create stays denied) and emails the first address in School details. Works without JavaScript.
- Verified: unit 144/144; enquiry e2e 3/3 (saved and readable by the editor, one copy in Mailpit, public read and create get 403, no-JS server check for the alumni year).

### 2026-09-23 (P3-T2, and an FR-07 security fix)
- **Security bug found and fixed (FR-07)**: a head of department could create a resource in *another* department (proved: HOD Sciences got 201 filing under "Vocational and Creative"), and could move their own resource out by update. `writeResources` returns a `where` filter, which Payload cannot apply to a create. New rule `canFileInDepartment` in `src/access/resources.ts` (unit-tested) is enforced in the Resources `beforeValidate` hook on create and on every update that touches the department; refusals are a 403 with a plain message.
- **Bulk upload** uses the admin's built-in Bulk Upload drawer (one create per file, so the same rule applies). An empty title is now filled from the file name (`src/lib/resource-title.ts`), so a folder of papers needs no typing; the department defaults to the head's own.
- Verified: unit 136/136; `tests/e2e/library-bulk.e2e.spec.ts` (REST refusals for create and move; the real drawer files two papers titled from their names).

### 2026-09-23 (P5-T5 retention)
- `pnpm retention` (dry run) / `pnpm retention --apply`: deletes applications 12 months after their last status change, with their documents, plus documents left unlinked for over a day. Reports references and counts only. Logic in `src/lib/retention.ts`; audited as `retention.applied`.
- Verified against real Postgres and MinIO (`tests/int/retention.int.spec.ts`): the dry run deletes nothing; `--apply` removes exactly the old application, its document (the file leaves the bucket too) and the orphan, and keeps the fresh one.
- Left for launch: a weekly cron on the server.

### 2026-09-23 (P5-T4)
- **Review workflow** (FR-19): allowed steps live in `src/lib/application-status.ts` (`NEXT_STATUSES`); `canChangeApplicationStatus` in `src/access/admissions.ts` lets the admissions team take them and only the super admin reverse a decision. Every change is stamped into `history` and `statusChangedAt` (both locked against hand edits).
- **Notifications**: `src/lib/application-notify.ts` builds the messages; the family gets an email with the reference when the application arrives and at every stage change. SMS goes through the existing notifier only when `NOTIFY_SMS_ENABLED=true`.
- Verified: unit 131/131; review e2e 3/3 (skipping review refused, decision final, editor gets 403, three emails read back from Mailpit, none naming the child).

### 2026-09-23 (P5-T3)
- **Tracking page** `/admissions/track` (FR-18): reference plus the guardian's phone number, both required; a wrong half and an unknown reference get the identical message. Rate-limited (10/min), a POST so nothing lands in a URL, and it shows no name (shared phones): stage, class, date submitted, interview date.
- Family wording for each status now lives in `src/lib/application-status.ts` (also the status list, moved out of the collection), ready for P5-T4 notifications. Phone numbers match however they are written (0772…, +256 772…).
- `tests/helpers/application.ts` creates applications through the local API, so tests do not spend the form's rate limit.
- Verified: unit 123/123; tracking e2e 2/2.

### 2026-09-23 (P5-T2)
- **Documents with the application** (FR-17): birth certificate and photo for everyone, result slip for S1/S5. They are sent with the form, so the server attaches them itself; no document id ever comes from the browser. `src/lib/application-documents.ts` (shared with the browser) checks presence, declared type and the 5 MB cap; `src/lib/document-intake.ts` checks magic bytes, refuses incomplete PDFs, re-encodes photos with sharp (EXIF and GPS gone, auto-rotated, max 2000 px) and gives every file a random name. Stored files are deleted again if the application cannot be saved.
- **New delivery route** `/api/files/application-document/[id]`: until now officers had no way to open these files (private files carry no URL). Rule `canOpenApplicationDocument` in `src/access/admissions.ts` (unit-tested), five-minute signed link, every opening and refusal audited. An "Open document" link sits in the admin panel.
- **Config**: server actions accept 16 MB; `proxyClientMaxBodySize` is 52 MB. That second one fixes a latent bug: the proxy buffered bodies only to 10 MB, so staff uploads above 10 MB (the cap is 50 MB) would have arrived cut off.
- Verified: unit 117/117 (EXIF strip, fake-photo refusal, truncated PDF, access rule), admissions e2e (officer opens the photo and it has no EXIF; public and student get 404, no signed link).

### 2026-09-23 (P5-T1)
- **Online application** (FR-16) at `/admissions/apply`: one form for Senior One, Senior Five and transfer applicants. `src/lib/application-form.ts` turns the posted form into the schema's shape; the browser and the server action both run it and then `applicationSchema`, so they cannot disagree. Works without JavaScript: sections switch with CSS `:has(:checked)`, and server errors come back with the typed answers kept.
- The server works out the PLE aggregate from the four grades; it never trusts a posted aggregate. The submission is rate-limited (5/min), has a honeypot, respects the applications-open switch, writes with `overrideAccess` (public create stays denied), audits `application.submitted` and returns an `AHSN-XXXXXX` reference.
- Removed `documentIds` from the schema: nothing checked who owned those files. Added `pleYear` and `uceYear` to Applications. The admissions page now links to the form when applications are open; the page is in the sitemap and revalidates with the admissions global.
- Tests: 10 parser unit tests; e2e proves a submission reaches the admissions officer, is refused (403) to the public and to a student, that public API create is refused, and that the server refuses an incomplete form with JavaScript off.

### 2026-09-23 (portal session hardening)
- **Sign-out now revokes the session on the server** (FR-10): `signOutAction` runs Payload's `logoutOperation`, which removes that session from the student's record, then deletes the cookie. A new e2e test replays a copied cookie after sign-out and is refused; run against the old code, the same test got into `/portal/results`. Sign-outs are audited as `student.logout`.
- **The per-account lock now works across servers**: `withSharedKeyLock` in `src/lib/key-lock.ts` adds a Postgres advisory lock (transaction-scoped, 10 s timeout) under the in-process queue. Sign-in and sign-out share the lock, since both rewrite the session list. Proved against real Postgres in `tests/int/key-lock.int.spec.ts`. No new dependency: it uses Payload's own pool.
- Verified: typecheck, lint, unit tests, portal e2e 10/10, lock integration test.

### 2026-09-23 (P3-T1 and two fixes)
- **Filters** (FR-06): subject, class, type and year on `/resources` and `/portal/library`, as a plain GET form. Query values are Zod-validated in `src/lib/resource-filters.ts`; the filter only narrows, since Payload ANDs it with `readResources`. Subject and year options come from the visible shelf, so no restricted subject is revealed. `/resources` is now rendered per request (it reads the query string).
- **Storage key hidden from the API** (FR-08): `src/access/private-files.ts` strips `prefix`, `filename`, `url` from REST and GraphQL reads of resources, report cards and admission documents for anyone but active staff. Local API reads keep them for the download routes.
- **Fixed a sign-in race**: Payload rewrites a student's session list on each sign-in, so simultaneous sign-ins dropped all but one session (proved: 3 concurrent logins, 1 valid token). The portal sign-in now queues per admission number. This was also why two e2e tests failed intermittently.

### 2026-09-23 (P3-T3)
- Built `/api/files/resource/[id]`: reads as the requester, re-checks with `canOpenResource`, 5-minute signed URL, audits restricted downloads and refusals, counts downloads.
- Added `/portal/library` and a shared `ResourceCard`; the public `/resources` page now offers downloads of public items.
- **Fixed a P4 bug**: the report-card route signed the bare filename, but the storage plugin files objects under `<collection>/`, so every real report-card download 404'd at MinIO. Both routes now use `privateObjectKey()`. The portal e2e test now fetches the file, so this cannot regress silently.
- Verified: `pnpm check` ✅ (62 unit, 20 e2e), 360 px screenshots checked.

### 2026-09-23
- Created PLAN.md (roadmap) and filled in MEMORY.md (this file) from an audit of the repo against docs/SRS.md.
- Verified: typecheck ✅, unit tests 56/56 ✅, lint ✅. E2E was not run.
- Found: all work since the initial commit is uncommitted, and the `import:students` script target is missing.

### Before 2026-09-23 (reconstructed, no session notes were kept)
- P0 and P1 built: services, brand, image pipeline, collections, roles, media, home page.
- P2 public pages built, except the enquiry form and sub-pages.
- P4 student portal and the report-card gate built, with tests.
- P3, P5 and P6 foundations laid: access rules, storage, admissions schema, structured data, headers.
