# Software Requirements Specification

**Alliance High School Nansana — website, CMS, e-Library, student portal and admissions**

This is the contract for the build. Every task names the requirement IDs it implements, and
every requirement below is either built, partly built or not started — the status column is
kept honest, because agents pick work from it.

Read this with [AGENTS.md](../AGENTS.md) (how to work) and
[ARCHITECTURE.md](./ARCHITECTURE.md) (how it is put together).

---

## 1. Purpose and scope

The school needs one address on the internet that does four jobs:

1. **Tells the school's story** to parents choosing a secondary school.
2. **Lets the office publish** news, events and photographs without a developer.
3. **Serves students**: notes, past papers and textbooks, plus their own termly report card.
4. **Takes applications** from families who want to join.

Out of scope for now: fee payment through the site, a full school management system
(timetabling, payroll, attendance), and a mobile app. `src/lib/payments.ts` keeps the seam
open for payments without committing to a provider.

## 2. The people who use it

| Actor | Who they are | What matters to them |
|---|---|---|
| Prospective parent | Choosing a school, often on a phone, on paid data | Fast pages, clear fees, easy to contact the school |
| Current parent | Checking dates and their child's results | Term dates, report cards, announcements |
| Student | Senior One to Senior Six | Notes, past papers, their own report card |
| Content editor | A teacher with other duties | An admin panel that does not need training |
| Registrar / DOS | Owns results | Import report cards, release a term |
| Bursar | Owns fee clearance | Mark a student cleared or blocked |
| Admissions officer | Owns applications | Review, decide, notify |
| ICT administrator | Keeps it running | Accounts, backups, audit trail |

**Constraint that shapes everything:** most visitors are on mid-range Android phones on 4G,
paying for data. Speed and weight beat desktop polish, every time.

## 3. Functional requirements

Status: **Built** = working and tested · **Partial** = some of it works · **Planned** = not started.

### Public website and CMS

| ID | Requirement | Status |
|---|---|---|
| FR-01 | Editors create and edit pages, news posts and gallery albums from an admin panel, with drafts and version history. | Built |
| FR-02 | Images and files are uploaded through the CMS; every image has alt text and a blur placeholder, and publishing rebuilds the affected pages within seconds. | Built |
| FR-03 | Videos are embedded from YouTube behind a click-to-load facade, so no visitor pays for video they did not ask for. | Built |
| FR-04 | News posts carry a category, a publish date and an author, and can be scheduled. | Built |
| FR-05 | Staff accounts have roles, and every access rule starts from "no" and grants deliberately. | Built |

### e-Library / resources

| ID | Requirement | Status |
|---|---|---|
| FR-06 | Students find resources by subject, class, type (notes, past paper, textbook, scheme) and year. | Partial |
| FR-07 | A head of department manages their own department's resources and no other. | Built |
| FR-08 | A restricted file is served only through a route that re-checks the session and returns a signed URL valid for five minutes; the storage key never reaches the browser. | Built |
| FR-09 | A resource records its subject, class list, visibility, file size and page count, so a student knows what they are downloading before they spend data. | Built |

### Accounts

| ID | Requirement | Status |
|---|---|---|
| FR-10 | Students sign in with their admission number; students are a separate collection from staff, so a student session can never satisfy a staff check. | Built |
| FR-11 | Staff accounts lock for 15 minutes after five failed attempts. | Built |
| FR-12 | The registrar imports report cards in bulk from a spreadsheet, with a dry-run summary before anything is written. | Planned |

### Report cards — the sensitive part

| ID | Requirement | Status |
|---|---|---|
| FR-13 | Results belong to a term, and a term is released by the registrar as a deliberate act. | Built |
| FR-14 | The bursar records fee clearance per student per term. The bursar cannot read report cards. | Built |
| FR-15 | A student may open a report card only when **all three** hold: they own it, the term is released, and they are cleared. Checked server-side on every request. | Built |

### Admissions

| ID | Requirement | Status |
|---|---|---|
| FR-16 | A family applies online in one form, validated identically in the browser and on the server. | Partial |
| FR-17 | An applicant uploads required documents (PLE slip, birth certificate, photograph), type- and size-checked. | Planned |
| FR-18 | Each application gets a reference the family can use to track progress. | Partial |
| FR-19 | The admissions officer moves an application through submitted → under review → offered / not offered, and the family is notified. | Partial |

### Around the school

| ID | Requirement | Status |
|---|---|---|
| FR-20 | Events have dates and a location, and can be added to a phone calendar (.ics). | Partial |
| FR-21 | Contact, alumni and careers enquiries are captured, rate-limited and spam-protected. | Partial |
| FR-22 | Site-wide search across pages, news and resources. | Planned |
| FR-23 | Sensitive actions — sign-in, report card access, clearance changes, releases — are written to an append-only audit log. | Built |
| FR-24 | Every page carries a title, description, canonical URL, Open Graph tags and structured data; the school appears as an organisation Google can understand. | Built |

## 4. Non-functional requirements

| ID | Requirement | How it is met |
|---|---|---|
| NFR-01 | A parent on 4G sees the home page quickly: Largest Contentful Paint under 2.5 s, and the page weighs under 1 MB on first load. | Static generation, AVIF/WebP, one priority image, system-loaded fonts |
| NFR-02 | Publishing shows on the live site within seconds, without a rebuild. | `revalidatePath` on every publish hook |
| NFR-03 | The site works at 360 px wide with no horizontal scrolling. | Mobile-first CSS; proved by an e2e test |
| NFR-04 | Contrast at least 4.5:1, visible focus rings, touch targets at least 44×44 px, keyboard reachable. | Brand tokens, e2e checks |
| NFR-05 | Personal data never appears in a URL, a log line or an error message. | Logger redaction; generic error messages |
| NFR-06 | The whole system runs locally with `docker compose up -d`, `pnpm install`, `pnpm seed`, `pnpm dev`. | Compose file with Postgres, MinIO and Mailpit |
| NFR-07 | Backups of the database and private files are automated, and restoring is a documented, tested procedure. | Planned — see DEPLOYMENT-VPS.md |

## 5. Security requirements (OWASP Top 10)

| OWASP | Risk here | What we do |
|---|---|---|
| A01 Broken access control | A student reads another student's results | Every rule lives in `src/access/`, is unit-tested including negative cases, and is re-checked server-side on every request |
| A02 Cryptographic failures | Report cards readable from a public bucket | Private files live in a separate, non-public bucket; five-minute signed URLs only |
| A03 Injection | Hostile input in forms | Zod on the server for every input; Payload's query layer is parameterised |
| A04 Insecure design | Results released by accident | Release is a deliberate act with three independent conditions, all audited |
| A05 Security misconfiguration | Debug surface in production | Security headers set in `proxy.ts`; GraphQL playground disabled outside development |
| A06 Vulnerable components | Stale dependencies | Pinned versions; `pnpm audit` in CI |
| A07 Authentication failures | Brute-forced student accounts | Rate limiting, lockout after five attempts, staff 2FA behind `STAFF_2FA_REQUIRED` |
| A08 Data integrity failures | Tampered upload | Type allow-list, magic-byte check, size cap, EXIF stripped, random storage key |
| A09 Logging failures | No idea who saw what | Append-only audit log for every sensitive action (FR-23) |
| A10 SSRF | The image optimiser used to reach internal hosts | Remote patterns are explicit; local IPs are allowed in development only |

## 6. Data we hold about children

Held: name, admission number, class, guardian name and phone, fee clearance status, results.
Not held: home address, medical information, national ID numbers.

Rules: least privilege by role; no personal data in URLs or logs; report cards are private
objects, never public files; applications and their documents are deleted after the retention
period, with a dry-run before any deletion job runs.

## 7. Delivery phases

| Phase | Scope | State |
|---|---|---|
| P0 | Repository, services, environment, brand, image pipeline | Done |
| P1 | CMS core: collections, roles, media, design system, home page | Done |
| P2 | The rest of the public site: about, academics, news, events, gallery, contact | Done (sub-pages and enquiry form outstanding) |
| P3 | e-Library: browse, filter, gated download | Started (gated download built; filters and bulk upload outstanding) |
| P4 | Student portal: sign-in, report cards, clearance messages | Done |
| P5 | Admissions: form, documents, tracking, review | Started (schema in place) |
| P6 | SEO, performance and security hardening | Started (structured data, headers) |
| P7 | Content loading, training, launch | Not started |

## 8. Acceptance

A phase is accepted when `pnpm check` passes, every page in it has been looked at on a
360 px viewport with a clean browser console, no placeholder text is left where real content
belongs, and — for anything behind a login — there is a test proving the wrong person is
turned away.
