# MEMORY.md: progress log

The running record of what has been built, what state it is in, and what was decided along the
way. The roadmap is [PLAN.md](PLAN.md); requirement-level status is in [docs/SRS.md](docs/SRS.md).

**Rule for every session (human or agent):** read this file first. Before you finish, update
**Current status** and add a dated entry to the **Log**. Newest entries go at the top. Keep each
entry short: what changed, what was verified, what is left.

---

## Current status (as of 2026-09-23)

**Where we are:** P0, P1 and P4 are done. P2 is mostly done. P3 has browse, filters and gated download (P3-T1, P3-T3), bulk upload left; P5 and P6 have started. P7 has not started.
**Next up:** **P5-T1** (online application) or **P3-T2** (bulk upload for heads of department),
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
  P3-T3 is on `feat/P3-library-downloads`, and P3-T1 on `feat/P3-T1-library-filters`, each branched
  from the one before. None is merged or pushed.

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
- Library filters (P3-T1) and bulk upload (P3-T2) are not built.
- Signing out only deletes the cookie; the session row stays valid on the server until it expires (2 hours). Revoking it on sign-out would matter on shared phones.
- The per-account sign-in lock (`src/lib/key-lock.ts`) is in memory, so it only protects a single server process.
- There is no `.ics` route for events, no site search, and no admissions submit, upload or tracking flow.
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
