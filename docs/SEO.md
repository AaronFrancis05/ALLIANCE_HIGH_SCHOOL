# How the school appears on Google

The goal is the result established Ugandan schools get when someone searches their name: the
school's name and crest above the link, a short description, a block of links to the main
pages (Fees, Admissions, Contact…) underneath, and a panel on the right with photos, a map,
the address, phone number, opening hours and Website / Directions buttons.

Half of that comes from this website. The other half comes from Google's own records about the
school, which only the school can claim. Neither half works without the other.

---

## 1. What the website already does

| In the result | Where it comes from | In the code |
|---|---|---|
| **School name** above the address (instead of the bare domain) | `WebSite` structured data on the home page | `WebSiteJsonLd` in `src/components/seo/JsonLd.tsx` |
| **Crest** beside the name (the favicon) | A 192 px icon. Google only uses icons sized in multiples of 48 px | `icons` in `src/app/(site)/layout.tsx` |
| **Title** of the main result: the school name alone | Home page metadata | `generateMetadata` in `src/app/(site)/page.tsx` |
| **Description** under the title | Home page metadata | same |
| **Thumbnail** beside the result | Open Graph image (the crest) | layout and home page metadata |
| **Links under the result** (sitelinks) | Google picks them. It needs clear menus, one page per topic, and a distinct title, description and canonical address on each page | every `page.tsx` under `src/app/(site)/`, the header and footer menus, `src/app/sitemap.ts` |
| **Breadcrumbs** in the address line of inner pages | `BreadcrumbList` structured data | `BreadcrumbJsonLd` |
| **Panel facts** (name, address, phone, founding year, map pin, logo, photo) | `HighSchool` structured data on every page, filled from *School details* in the admin panel | `OrganisationJsonLd` |
| **News and events** as cards | `NewsArticle` and `Event` structured data | `ArticleJsonLd`, `EventJsonLd` |
| **Admissions questions** | `FAQPage` structured data | `FaqJsonLd` |

Nothing above can be forced. Google decides when to show sitelinks, the site name and the
panel. For a new site that usually takes a few weeks, and it depends on people searching for the
school by name.

**Keep it working:** every new public page needs its own `title`, `description` and
`alternates.canonical`, a link from a menu, and an entry in `src/app/sitemap.ts`.

## 2. What the school must do (no developer needed)

### 2.1 Google Business Profile: the right-hand panel
The panel (photos, map, address, phone, hours, *Website* and *Directions* buttons) is Google
Business Profile. It is free.

1. Search the school's name on Google. If a panel already appears, click **Own this business?**.
   If not, go to <https://business.google.com> and add the school.
2. Category: **High school** (add **Boarding school** as a second category if it applies).
3. Verify ownership. Google sends a postcard or a code to the school's phone or email. This
   can take several days.
4. Fill in exactly what is on the website's *School details*: the name, address, phone number,
   opening hours and website address. They must match **character for character**. A
   difference makes Google trust both less.
5. Drop the map pin on the main gate.
6. Add real photographs: the gate, buildings, students in uniform (with consent), the crest
   as the logo, and a wide cover photo. Add more each term.
7. Ask parents and alumni to leave reviews. Reply to them.

### 2.2 Google Search Console: tell Google the site exists
1. Go to <https://search.google.com/search-console> and add the domain.
2. Verify it with the DNS record the console gives you (whoever manages the domain adds it).
3. Under **Sitemaps**, submit `https://<domain>/sitemap.xml`.
4. Under **URL inspection**, inspect the home page and click **Request indexing**.
5. Check **Enhancements** a week later for structured-data errors.

### 2.3 Wikipedia and Wikidata: "Founded" and "Colours"
Lines such as *Founded: 1906* and *Colours: Blue, Gold* in a school's panel usually come from
Wikidata or Wikipedia, not from the school's own site. An editor who is not connected to the
school must write that entry, using published sources such as newspaper articles. The school
should not write it itself.

## 3. Details the panel needs that the school has not yet confirmed

These are tracked in [CONTENT_TODO.md](CONTENT_TODO.md): the founding year, the office hours,
the phone number and address, and the map coordinates (latitude and longitude in *School
details → Contact*). Until they are confirmed, the structured data leaves them out rather than
guessing.
