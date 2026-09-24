# Architecture

How the system is put together and why. Read [SRS.md](./SRS.md) for what it has to do and
[AGENTS.md](../AGENTS.md) for how to work on it.

---

## 1. The stack, and why each piece

| Piece | Choice | Why this one |
|---|---|---|
| Framework | Next.js 16 (App Router) | Static pages for the public site and server rendering for the portal, in one codebase. Server components keep JavaScript off the phone. |
| CMS | Payload 3 | Runs inside the same Next.js app rather than as a second service to host and secure. Access control is declared per collection and per field, which is exactly what this project needs. |
| Database | Postgres 16 | Relational data (students, terms, clearances, results) with real constraints. Cheap to host and to back up on a VPS. |
| Files | S3-compatible (MinIO locally, Cloudflare R2 in production) | Two buckets: one public for site media, one private that nothing can read without a signed URL. |
| Styling | Tailwind CSS 4 with brand tokens | One brand file, no scattered hex values, tiny output. |
| Email / SMS | Nodemailer and an SMS interface | Mailpit locally so nothing reaches a real parent during development. |
| Tests | Vitest (unit), Playwright (e2e) | Access rules are pure functions, so they unit-test fast; the rest is checked in a real browser at 360 px. |

**Why not a VPS-only stack with a separate CMS?** A second service means a second thing to
patch, a second set of credentials and a second place for a misconfiguration to expose a
child's results. One application, one database, one storage account is less to get wrong.

## 2. How a request flows

```
Visitor ─▶ Cloudflare (WAF, CDN, TLS)
             │
             ▼
        Next.js app
             │
   ┌─────────┼──────────────────┬───────────────────────┐
   ▼         ▼                  ▼                       ▼
Public    Student portal    Payload admin          Route handlers
pages     (dynamic,         (/admin, staff         (private files,
(static,  noindex)          only)                  .ics, revalidation)
cached)      │                  │                       │
   └─────────┴──────────────────┴───────────────────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
             Postgres              Object storage
                              (public bucket + private bucket)
```

Public pages are generated at build time and rebuilt when an editor publishes, so a parent on
4G gets a cached page. Portal pages are never cached and never indexed.

## 3. Where the code lives

```
src/
  app/(site)/      public pages, static by default
  app/(portal)/    student portal, dynamic, noindex
  app/(payload)/   Payload admin and API (generated; do not hand-edit importMap.js)
  app/api/         route handlers: signed file delivery, ICS, revalidation
  collections/     one file per Payload collection
  globals/         site-wide editable settings
  access/          every access rule, unit-tested
  components/      ui | layout | home | content | seo | admin
  lib/             storage, notify, payments, rate-limit, audit, logger, env, validation
  seed/            seed content and the image manifest
scripts/           optimize-images, generate-image-guide, prepare-crest, seed, probe-requests
docs/              SRS, ARCHITECTURE, IMAGE_GUIDE, CONTENT_TODO, DEPLOYMENT-VPS
tests/unit|int|e2e/
```

## 4. The rules that hold it together

**Access control has one home.** Every rule lives in `src/access/` and nowhere else. Routes
and components call them; they never re-implement them. The rules are pure functions, so each
one is unit-tested including the cases where access must be refused. There are 56 such tests.

**Deny by default.** Every Payload `access` function starts from `false` and grants
deliberately. A new collection with no rule is unreadable, not public.

**Students and staff are separate collections.** A student session can never satisfy a staff
check, because it is not the same kind of user. This is a structural guarantee rather than a
condition someone has to remember to write.

**Private files are never URLs.** A report card or a restricted resource is fetched through a
route handler that re-checks the session, re-checks ownership, and then returns a signed URL
that expires in five minutes. The storage key never reaches the browser.

**Side effects sit behind interfaces.** Email, SMS, storage and payments each have one module
in `src/lib/` with a local adapter. Changing provider is a new file and a config change.

**Content lives in the CMS.** Components do not hardcode school facts. What the school has not
supplied shows as a bracketed placeholder and is listed in
[CONTENT_TODO.md](./CONTENT_TODO.md).

## 5. The report card gate

The one piece worth stating precisely, because getting it wrong exposes a child's results.

A report card is released only when **all three** hold:

1. the requester **owns** it,
2. the registrar has **released** that term's results, and the card itself is published,
3. the bursar has **cleared** that student for that term.

All three are decided server-side on every request by `evaluateReportCardAccess`, a pure
function with a test for each branch. Refusals for "not yours" and "does not exist" use
identical wording, so ids cannot be probed by comparing messages. Every attempt, allowed or
refused, is written to the audit log.

The registrar may fetch any card, for support. **The bursar may not** — the bursar decides
clearance and has no business reading results.

## 6. Local development

```bash
docker compose up -d   # postgres, minio, mailpit
pnpm install
pnpm images            # optimise assets/ into public/ derivatives
pnpm seed              # wipe and reseed local content
pnpm dev               # http://localhost:3000, admin at /admin
pnpm check             # lint + typecheck + unit + e2e
```

Services: MinIO console <http://localhost:9001>, Mailpit <http://localhost:8025>,
Postgres on port 5433.

The seed creates a staff account per role, three students (one cleared, one blocked, one in
S6), a released and an unreleased term, and enough news, events and library resources to click
through every screen. It refuses to run when `NODE_ENV=production`.

### Two notes about the local setup

- **Image optimiser and MinIO.** Next 16 refuses to fetch an image from a host that resolves
  to a private IP, which blocks SSRF through the optimiser. Media lives in MinIO on
  `localhost:9000` locally, so `dangerouslyAllowLocalIP` is switched on **in development
  only** in `next.config.ts`. In production the media host is a public domain and it stays off.
- **First request is slow.** `next dev` compiles each route on first request, and the Payload
  admin bundle is large. The Playwright timeouts are set generously for this reason; a warm
  run finishes in seconds.

## 7. Production (planned)

Two options, both documented in `DEPLOYMENT-VPS.md` when P7 begins:

- **Managed**: Vercel plus a managed Postgres plus Cloudflare R2. Least operational work,
  higher running cost.
- **VPS**: one server running the app, Postgres and Caddy in Docker, with Cloudflare in front
  and object storage in R2. Roughly a fifth of the running cost, but somebody has to patch the
  server and test the restores.

Whichever is chosen: Cloudflare in front for WAF and DDoS, TLS everywhere, database and
private-bucket backups with a **restore that has actually been tested**, and no secrets in the
repository.
