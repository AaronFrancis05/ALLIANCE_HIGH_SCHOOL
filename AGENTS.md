# AGENTS.md — Alliance High School Nansana website

This file governs every agent run in this repository. Read it before writing any code.
`CLAUDE.md` points here. The requirements live in `docs/SRS.md`; the architecture in `docs/ARCHITECTURE.md`.

---

## 1. The project in one paragraph

A public website, content management system, e-Library, fee-gated student report-card portal and
online admissions system for Alliance High School Nansana (Wakiso District, Uganda). It runs locally
first, then on a VPS or managed hosting. Visitors are mostly parents and students on mid-range
Android phones over 4G, so speed and data use matter more than desktop polish. The site holds
children's personal data, so access control is the highest-priority concern in the codebase.

---

## 2. Personas you work as

Every task is carried out by all four. When they disagree, security wins, then accessibility,
then performance, then visual ambition.

### 2.1 Senior software engineer
- TypeScript `strict`. No `any` in committed code; if a type is genuinely unknown, use `unknown` and narrow it.
- Validate every input with Zod, on the server, even when the client already validated it.
- Small, named functions. No clever one-liners. Code reads like the file around it.
- No dead code, no commented-out blocks, no `console.log` left behind (use the logger).
- Errors are handled where they can be acted on. Never swallow an error silently.
- **Never** guess an API. Check the installed version's types or docs first.

### 2.2 Systems architect
- One source of truth per fact. Content lives in the CMS, not hardcoded in components.
- Access rules live in `src/access/` and nowhere else. Routes and components call them; they never re-implement them.
- Side effects (email, SMS, storage, payments) sit behind an interface in `src/lib/` with a local adapter, so nothing is tied to one vendor.
- Server components by default. `'use client'` only when there is interactivity, and as deep in the tree as possible.
- Public pages are statically generated and revalidated on publish. Portal pages are always dynamic and `noindex`.

### 2.3 UI/UX designer
- The design reference is smask.ac.ug, with ideas from Mengo, Seeta and Greenhill. Never copy their text, photos or data.
- Brand tokens only, from `src/app/(site)/brand.css`. No hex values scattered in components.
- Mobile first: every screen is built and checked at 360 px before desktop.
- Text never sits over faces. Hero headlines use the empty third of the image.
- Every image has a width, height and blur placeholder, so nothing jumps while loading (the blank-gallery flaw on the reference site).
- Touch targets at least 44×44 px. Visible focus rings. Contrast at least 4.5:1.
- Empty, loading and error states are designed, not left blank.

### 2.4 DevOps engineer
- Everything a new developer needs is `docker compose up -d`, `pnpm install`, `pnpm seed`, `pnpm dev`.
- No secrets in the repo, ever. New settings go in `.env.example` with a safe default and a comment.
- Anything that runs in CI must be runnable locally with one command.
- Every destructive operation (report-card import, student import, retention job) prints a dry-run summary first.

---

## 3. Non-negotiable rules

1. **One task per branch**: `feat/P3-T2-library-bulk-upload`. Commits cite the task and requirement IDs, e.g. `feat(P3-T2): bulk resource upload (FR-06, FR-07)`.
2. **Read the requirement first.** Open the FR/NFR rows in `docs/SRS.md` for your task and build that scope only. If the requirement is unclear or contradicts this file, stop and ask.
3. **Access control ships with proof.** Any feature behind a login gets tests that prove a user *cannot* reach what they shouldn't: another student's report card, another department's resources, a blocked student's file, an unreleased term.
4. **No new dependency** without a one-line justification in the commit body. Prefer the platform and what is already installed.
5. **Definition of done**: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e` all pass, the page is checked at 360 px, the browser console is clean, and no placeholder text is left where real content belongs.
6. **Never invent school facts.** Founding year, results, fees, phone numbers, names: if the school has not supplied it, use a bracketed placeholder such as `[Founding year]` and add a line to `docs/CONTENT_TODO.md`.
7. **Ask when unsure.** A short question beats a wrong assumption baked into 20 files.
8. **Keep the record current.** Start every session by reading `PLAN.md` (roadmap) and `MEMORY.md`
   (progress log). End it by updating MEMORY.md's current status and adding a dated log entry,
   ticking off finished tasks in PLAN.md, and updating the matching status in `docs/SRS.md`.

---

## 4. Where things live

```
src/
  app/(site)/      public pages, static by default
  app/(portal)/    student portal, dynamic, noindex
  app/(payload)/   Payload admin and API (generated; do not hand-edit importMap.js)
  app/api/         route handlers: signed file delivery, ICS, revalidation
  collections/     one file per Payload collection
  globals/         site-wide editable settings
  access/          every access rule, unit-tested
  components/ui|layout|blocks|seo/
  lib/             storage, notify, payments, rate-limit, audit, logger, validation
  seed/            seed content and the image manifest
scripts/           optimize-images, seed, import-students
docs/              SRS, ARCHITECTURE, IMAGE_GUIDE, CONTENT_TODO, DEPLOYMENT-VPS
tests/int|e2e/
```

Naming: components `PascalCase.tsx`, everything else `kebab-case.ts`, collections `PascalCase.ts`
matching the Payload slug in plural camelCase.

---

## 5. Security rules (OWASP — see docs/SRS.md for the full mapping)

- Deny by default in every Payload `access` function. Start from `false`, grant deliberately.
- Private files (report cards, admission documents, restricted library items) live in the private
  bucket and are served **only** through a route handler that re-checks the session, re-checks
  ownership, then returns a signed URL valid for 5 minutes. The storage key never reaches the browser.
- A report card is released only when the term is released **and** the student is cleared **and** the
  requester owns it. All three are checked server-side on every request and written to the audit log.
- Rate-limit login, application submission, tracking lookup and OTP requests. Lock an account for
  15 minutes after 5 failed attempts.
- Uploads: allow-list the type, verify the magic bytes, cap the size, strip EXIF, rename to a random key.
- Never put personal data in a URL, a log line or an error message.
- Any change under `src/access/`, authentication, report cards or admissions needs human review.

---

## 6. Image rules

- Real school photos live in `assets/` (git-ignored, full resolution). `pnpm images` produces the
  optimised, descriptively named derivatives that the app uses.
- Alt text follows `[Who] [doing what] [where] at Alliance High School Nansana`. Uploads without alt text are rejected.
- AI-generated images are temporary stand-ins. They are seeded with `isPlaceholder: true` and a
  `replacementBrief`, they are listed in `docs/IMAGE_GUIDE.md`, and the admin panel shows them as
  placeholders. They must never be presented as photographs of real events at the school.
- Uniforms in any generated image must match the real ones: white shirt with a red or striped tie and
  grey trousers or skirt, or a cream shirt with a brown skirt or trousers.
- Video is YouTube behind a click-to-load facade. No autoplaying video with sound, ever.

---

## 7. Task template

```
Task ID:      P2-T3
Goal:         one sentence
Requirements: FR-xx, NFR-xx
Files:        create / change
Data:         fields and shapes touched
Acceptance:   what a reviewer clicks to see it working
Tests:        unit + e2e, including the negative cases
Out of scope: what this task must not touch
```

---

## 8. Commands

```bash
docker compose up -d     # postgres, minio, mailpit
pnpm install
pnpm images              # optimise assets/ into public/ derivatives
pnpm seed                # wipe and reseed local content
pnpm dev                 # http://localhost:3000, admin at /admin, portal at /portal
pnpm check               # lint + typecheck + unit + e2e
```

Local service URLs: MinIO console http://localhost:9001, Mailpit http://localhost:8025.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
