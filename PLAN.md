# PLAN.md — the build plan

What we are building, the order we build it in, where we are now, and what comes next.

- **What it must do** (requirement IDs and their status): [docs/SRS.md](docs/SRS.md)
- **How it is put together:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- **How to work on it:** [AGENTS.md](AGENTS.md)
- **What has been done and what state it is in:** [MEMORY.md](MEMORY.md)

This file is the roadmap. Update it when a phase changes state, when a task is added or finished,
or when the plan itself changes. The requirement status column in `docs/SRS.md` is the detailed
record; the two must agree.

---

## 1. The goal

One website for Alliance High School Nansana (Wakiso, Uganda) that does four jobs:

1. **Tells the school's story** to parents choosing a school.
2. **Lets the office publish** news, events and photos without a developer.
3. **Serves students**: an e-Library (notes, past papers, textbooks) and their own report card,
   shown only when fees are cleared.
4. **Takes applications** online, with document uploads and progress tracking.

Design constraints: most visitors use mid-range Android phones on paid 4G data, so pages must be
light and fast. The site holds children's data, so **access control comes first**.

Out of scope for now: paying fees online, a full school management system, a mobile app.

## 2. The stack

| Piece | Choice |
|---|---|
| App | Next.js 16 (App Router) + Payload 3 CMS in the same app |
| Database | Postgres 16 (Docker locally, port 5433) |
| Files | S3-compatible: MinIO locally, Cloudflare R2 in production. One public and one private bucket |
| Styling | Tailwind CSS 4 with brand tokens in `src/app/(site)/brand.css` |
| Email | Nodemailer, with Mailpit locally |
| Tests | Vitest (unit, access rules) + Playwright (e2e at 360 px) |

## 3. The phases

| Phase | Scope | State |
|---|---|---|
| **P0** | Repository, Docker services, environment, brand, image pipeline | ✅ Done |
| **P1** | CMS core: collections, roles, media, design system, home page | ✅ Done |
| **P2** | Public site: about, academics, news, events, gallery, contact | 🟡 Mostly done: enquiry form, sub-pages and `.ics` outstanding |
| **P3** | e-Library: browse, filter, gated download | 🟡 Started: browse, filters, gated download and portal library done; bulk upload (P3-T2) not |
| **P4** | Student portal: sign-in, report cards, clearance messages | ✅ Done, except the bulk report-card import (FR-12) |
| **P5** | Admissions: form, documents, tracking, review | 🟡 Started: schema and form validation only |
| **P6** | SEO, performance and security hardening | 🟡 Started: structured data and security headers done |
| **P7** | Content from the school, training, deployment, launch | ⬜ Not started |

## 4. Work remaining, in order

Task IDs follow `P<phase>-T<number>`. IDs marked *(proposed)* have not been agreed yet. Confirm
them before you open a branch.

### Step 0: housekeeping (before any new feature)
- [x] Commit the current work. Everything since `064eda3 feat: initial commit` is uncommitted
      (71 changed or untracked paths). Split the commits by phase so the history can be read.
- [ ] Run `pnpm e2e` with the Docker services up and record the result in MEMORY.md.
- [ ] `package.json` has an `import:students` script, but `scripts/import-students.ts` does not exist.
      Write the script or remove the entry.

### P2: finish the public site
- [ ] **P2-T9** Contact, alumni and careers enquiry form: Zod on the server, rate-limited,
      spam-protected, saved to `FormSubmissions` (FR-21)
- [ ] Events: `.ics` download route under `src/app/api/` (FR-20)
- [ ] About sub-pages (leadership, staff). Blocked until the school supplies names and photos
      (see docs/CONTENT_TODO.md §3)

### P3: e-Library
- [x] **P3-T1** Browse and filter by subject, class, type and year (FR-06)
- [ ] **P3-T2** Bulk resource upload for heads of department (FR-06, FR-07)
- [x] **P3-T3** Gated download route for restricted resources: re-check the session, return a
      5-minute signed URL (FR-08)

### P4: portal remainder
- [ ] **P4-T?** *(proposed)* Report-card bulk import from a spreadsheet, with a dry-run summary (FR-12)

### P5: admissions
- [ ] **P5-T1** *(proposed)* Submit the application end to end, with the same schema in the browser and on the server (FR-16)
- [ ] **P5-T2** *(proposed)* Document uploads (PLE slip, birth certificate, photo): allow-listed type, magic-byte check, size cap, EXIF stripped (FR-17)
- [ ] **P5-T3** *(proposed)* Reference number and public tracking page, rate-limited (FR-18)
- [ ] **P5-T4** *(proposed)* Officer review workflow and family notification (FR-19)
- [ ] Retention job for applications and their documents, with a dry run (SRS §6)

### P6: hardening
- [ ] Site-wide search across pages, news and resources (FR-22)
- [ ] Performance budget check: LCP < 2.5 s, first load < 1 MB (NFR-01)
- [ ] Staff 2FA behind `STAFF_2FA_REQUIRED` (A07)
- [ ] `pnpm audit` in CI (A06). No CI exists yet

### P7: launch
- [ ] Collect everything in docs/CONTENT_TODO.md from the school
- [ ] Replace the 12 AI placeholder images (docs/IMAGE_GUIDE.md)
- [ ] Choose hosting (managed or VPS) and write `docs/DEPLOYMENT-VPS.md`
- [ ] Automated backups plus a restore that has actually been tested (NFR-07)
- [ ] Train the content editor, registrar, bursar and admissions officer
- [ ] Go live

## 5. Acceptance for every phase

`pnpm check` passes. Every page has been checked at 360 px with a clean browser console. No
placeholder text is left where real content belongs. Anything behind a login has a test proving
the wrong person is turned away.
