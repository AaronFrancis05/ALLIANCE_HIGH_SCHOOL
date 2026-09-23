# MEMORY.md: progress log

The running record of what has been built, what state it is in, and what was decided along the
way. The roadmap is [PLAN.md](PLAN.md); requirement-level status is in [docs/SRS.md](docs/SRS.md).

**Rule for every session (human or agent):** read this file first. Before you finish, update
**Current status** and add a dated entry to the **Log**. Newest entries go at the top. Keep each
entry short: what changed, what was verified, what is left.

---

## Current status (as of 2026-09-23)

**Where we are:** P0, P1 and P4 are done. P2 is mostly done. P3 has browse, filters and gated download (P3-T1, P3-T3), bulk upload left. P5 has the online form (P5-T1); P6 has started. P7 has not started.
**Next up:** **P5-T2** (document uploads) then **P5-T3** (tracking page), or **P3-T2** (bulk upload),
plus the `import:students` loose end. Contact details in docs/CONTENT_TODO.md are deliberately
left until launch (the school owner's call, 2026-09-23).

### Health checks
| Check | Result | When |
|---|---|---|
| `pnpm typecheck` | ✅ passes | 2026-09-23 |
| `pnpm test` (unit) | ✅ 62 / 62 pass | 2026-09-23 |
| `pnpm lint` | ✅ passes | 2026-09-23 |
| `pnpm e2e` | ✅ 20 / 20 pass (public 5, admin 3, portal 7, library 5) | 2026-09-23 |
| 360 px visual check | ✅ /resources and /portal/library: no sideways scroll, console clean | 2026-09-23 |

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
- The contact page says the enquiry form "is being finished" (P2-T9 not built).
- Library bulk upload (P3-T2) is not built.
- Rate limits (`src/lib/rate-limit.ts`) are still in memory per process. Fine for one VPS; several servers would need a shared store.
- There is no `.ics` route for events and no site search. Admissions has no document upload, tracking page or family notification yet (P5-T2 to P5-T4).
- The header's "Apply now" link (Navigation global) still points to `/admissions`, which now links on to `/admissions/apply`.
- The `import:students` script points to a file that does not exist: `scripts/import-students.ts`.
- There is no `docs/DEPLOYMENT-VPS.md` and no CI pipeline.
- There are 12 AI placeholder images, and many school facts are still placeholders (docs/CONTENT_TODO.md).

---

## Decisions (and why)
- **Payload inside Next.js**, not a separate CMS, so there is one app, one database and one place to secure.
- **Students and staff are separate collections**, so a student session can never pass a staff check.
- **The bursar cannot read report cards.** The bursar only sets clearance.
- **"Not yours" and "does not exist" get identical refusal messages**, so report-card IDs cannot be probed.
- **Private files are never URLs**. They are served only through a route handler with a 5-minute signed URL.
- **Unconfirmed school facts are bracketed placeholders**, listed in docs/CONTENT_TODO.md.

---

## Log

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
