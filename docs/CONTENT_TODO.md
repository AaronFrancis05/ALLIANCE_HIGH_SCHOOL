# Content still needed from the school

Everything the website shows must come from the school. Where a fact has not been supplied,
the site shows a bracketed placeholder such as `[Founding year]` rather than a guess
(AGENTS.md rule 6). This file lists every one of them.

**How to use this list:** the office fills these in through the admin panel at `/admin`. No
developer is needed. When an item is filled in, delete its row here.

**For agents:** when you add a placeholder, add a row here in the same commit. When you find
yourself about to invent a school fact — a founding year, a result, a fee, a name — stop and
add a row instead.

---

## 1. Must be confirmed before launch

These are already on the site as if they were facts. They were taken from the material
supplied at the start of the project and **have not been confirmed by the school**. If any is
wrong, it is wrong on every page.

| What | Currently shows | Where |
|---|---|---|
| School office telephone | `+256 702 601686` | Top bar, footer, contact page |
| General email | `info@alliancehigh.sc.ug` | Footer, contact page |
| Admissions email | `admissions@alliancehigh.sc.ug` | Footer, admissions |
| Postal address | `P.O. Box 7236, Kampala` | Footer, contact, structured data |
| Office hours | Mon–Fri 8am–5pm, Sat 9am–1pm | Contact page |
| Motto and its meaning | "Adfecto Excellencia" / "We strive for excellence" | Header, footer, crest |
| Vision and mission | As seeded | Home, about |
| Core values | Six values, no descriptions | Home |

## 2. Blank placeholders, waiting on the school

| Placeholder | Where it shows | Who can answer |
|---|---|---|
| `[Founding year]` | About page, structured data | Head Teacher's office |
| `[Theme of the year]` | Home page identity cards | Head Teacher's office |
| `[Head Teacher's name]` | Welcome message on the home page | Head Teacher's office |
| `[0]` Students enrolled | Home page statistics | Registrar |
| `[0]` Teaching staff | Home page statistics | Head Teacher's office |
| `[0]` Years of service | Home page statistics | Head Teacher's office |
| `[0]` Clubs and societies | Home page statistics | Director of Studies |
| `[Amount]` × 9 — fees | Fees table: tuition, other and total for each class band | Bursar |
| `[Parent's name]` | Testimonial on the home page | Communications |
| `[Student's name]` | Testimonial on the home page | Communications |
| `[Alumnus's name]` | Testimonial on the home page | Communications |

The three testimonials are also **written text that needs approving**: the words are drafted
to show how the section reads. Each needs a real person's words and their permission to
publish, including a parent's consent where a student is named.

## 3. Still to be supplied, not yet on the site

| What | Why it is needed |
|---|---|
| A larger copy of the school crest | The genuine artwork is now in use (`assets/brand/originallogo.jpg`), but it is only 204×192 px, so the crest is soft at large sizes and unreadable as a 32 px favicon. A vector (SVG, AI, EPS or PDF) or a PNG of 1000 px or more would fix both. Drop it in `assets/brand/` and run `pnpm crest` |
| A simplified mark for the favicon | Any detailed crest turns to mush at 32×32. A single element — the elephant head alone, or the letter A — would be legible in a browser tab. Needed only if the school wants a sharp tab icon |
| UNEB results, last three years | The academics results page |
| Leadership: names, titles, photographs | About → leadership |
| Staff directory: names, subjects, qualifications | About → staff |
| Fees structure document (PDF) | Downloads, admissions |
| Admission requirements per class | Admissions |
| Term dates for the coming year | Events, admissions |
| Clubs and societies: the real list | Student life |
| Sports: teams, achievements | Student life |
| Google Maps link or coordinates for the campus | Contact page, structured data |
| Social media accounts the school actually uses | Footer |
| Bank or mobile money details for fees | Fees page (only if the school wants them published) |

## 4. Photographs

Sixteen real photographs of the school are in use. Twelve sections still show
AI-generated stand-ins, each labelled "Placeholder image" on the site. They must be replaced
with real photographs before launch — see [IMAGE_GUIDE.md](./IMAGE_GUIDE.md), which describes
exactly what to photograph for each one.
