/**
 * Every image the site uses, in one place.
 *
 * `photo` entries are real photographs supplied by the school and live in `assets/`
 * (git-ignored). `pnpm images` turns them into the optimised masters in `public/photos/`.
 *
 * `placeholder` entries are AI-generated stand-ins for sections the school has not
 * photographed yet. They are seeded with `isPlaceholder: true`, are shown as placeholders
 * in the admin panel, and must be replaced with a real photograph that matches `brief`.
 * They must never be described as photographs of real events at the school.
 */

export type ImageKind = 'photo' | 'placeholder'

export interface ImageEntry {
  /** Stable id used by the seed and by components. */
  key: string
  kind: ImageKind
  /** File inside `assets/`. Photographs sit at the top level, generated stand-ins in `assets/generated/`. */
  source?: string
  /** Optimised file name inside `public/photos/`, without extension. */
  slug: string
  /** Where it is used. */
  slot: string
  /** Alt text: [Who] [doing what] [where] at Alliance High School Nansana. */
  alt: string
  /** Intended crop. The master is stored uncropped; art direction happens in CSS. */
  aspect: '16:9' | '3:2' | '4:3' | '1:1' | '4:5' | '3:1'
  /** For placeholders: the photograph the school should take to replace it. */
  brief?: string
  /** Prompt used to generate the placeholder, kept for regeneration. */
  prompt?: string
}

export const imageManifest: ImageEntry[] = [
  // ---------------------------------------------------------------- real photographs
  {
    key: 'hero-students-driveway',
    kind: 'photo',
    source: '9Y3A1691.JPG',
    slug: 'students-on-the-main-driveway-alliance-high-nansana',
    slot: 'Home hero, slide 1',
    alt: 'Senior students talking together on the main driveway at Alliance High School Nansana',
    aspect: '16:9',
  },
  {
    key: 'hero-students-lined-up',
    kind: 'photo',
    source: '9Y3A1667.JPG',
    slug: 'senior-students-outside-the-classroom-block-alliance-high-nansana',
    slot: 'Home hero, slide 2; About header',
    alt: 'Senior students standing outside the classroom block at Alliance High School Nansana',
    aspect: '16:9',
  },
  {
    key: 'hero-girls-walking',
    kind: 'photo',
    source: '9Y3A1707.JPG',
    slug: 'students-walking-to-class-with-books-alliance-high-nansana',
    slot: 'Home hero, slide 3; Student life header',
    alt: 'Students walking to class carrying books along a tree-lined path at Alliance High School Nansana',
    aspect: '16:9',
  },
  {
    key: 'academics-girls-reading',
    kind: 'photo',
    source: '9Y3A1686.JPG',
    slug: 'students-reading-a-mathematics-textbook-alliance-high-nansana',
    slot: 'Academics header; Why choose us',
    alt: 'Two students reading a mathematics textbook together in the school garden at Alliance High School Nansana',
    aspect: '3:2',
  },
  {
    key: 'academics-girls-reading-wide',
    kind: 'photo',
    source: '9Y3A1687.JPG',
    slug: 'students-studying-together-in-the-school-garden-alliance-high-nansana',
    slot: 'Academics, O-Level section',
    alt: 'Students studying together in the school garden at Alliance High School Nansana',
    aspect: '3:2',
  },
  {
    key: 'studentlife-boys-folder',
    kind: 'photo',
    source: '9Y3A1688.JPG',
    slug: 'students-discussing-classwork-alliance-high-nansana',
    slot: 'Student life, portrait card',
    alt: 'Two students discussing their classwork outside at Alliance High School Nansana',
    aspect: '4:5',
  },
  {
    key: 'studentlife-girls-path',
    kind: 'photo',
    source: '9Y3A1709.JPG',
    slug: 'students-heading-to-the-library-alliance-high-nansana',
    slot: 'Student life, day scholars',
    alt: 'Students walking along the campus path on their way to the library at Alliance High School Nansana',
    aspect: '4:5',
  },
  {
    key: 'clubs-journalism',
    kind: 'photo',
    source: '9Y3A1716.JPG',
    slug: 'students-reading-magazines-in-the-journalism-club-alliance-high-nansana',
    slot: 'Clubs, Journalism',
    alt: 'Students reading magazines together during a club session at Alliance High School Nansana',
    aspect: '4:3',
  },
  {
    key: 'clubs-debate-group',
    kind: 'photo',
    source: '9Y3A1720.JPG',
    slug: 'students-in-a-group-discussion-under-the-trees-alliance-high-nansana',
    slot: 'Clubs, Debate; Student life',
    alt: 'Students holding a group discussion under the trees at Alliance High School Nansana',
    aspect: '4:3',
  },
  {
    key: 'library-desk-reading',
    kind: 'photo',
    source: '9Y3A1753.JPG',
    slug: 'student-reading-at-a-desk-in-the-school-library-alliance-high-nansana',
    slot: 'Resources / e-Library banner',
    alt: 'Student reading at a desk among the shelves in the school library at Alliance High School Nansana',
    aspect: '3:1',
  },
  {
    key: 'library-shelves',
    kind: 'photo',
    source: '9Y3A1758.JPG',
    slug: 'students-choosing-textbooks-in-the-school-library-alliance-high-nansana',
    slot: 'Facilities, Library',
    alt: 'Students choosing textbooks from the shelves in the school library at Alliance High School Nansana',
    aspect: '3:2',
  },
  {
    key: 'library-closeup',
    kind: 'photo',
    source: '9Y3A1762.JPG',
    slug: 'student-reading-a-book-in-the-library-alliance-high-nansana',
    slot: 'Testimonials; Resources card',
    alt: 'Student reading a book at a library desk at Alliance High School Nansana',
    aspect: '4:3',
  },
  {
    key: 'academics-outdoor-class',
    kind: 'photo',
    source: '9Y3A1773.JPG',
    slug: 'students-working-through-an-exercise-outdoors-alliance-high-nansana',
    slot: 'Academics, competence-based learning',
    alt: 'Students working through an exercise together in an outdoor class at Alliance High School Nansana',
    aspect: '3:2',
  },
  {
    key: 'studentlife-two-seniors',
    kind: 'photo',
    source: '9Y3A1815.JPG',
    slug: 'senior-students-walking-along-the-palm-avenue-alliance-high-nansana',
    slot: 'About, A-Level section',
    alt: 'Senior students walking along the palm-lined avenue at Alliance High School Nansana',
    aspect: '4:5',
  },
  {
    key: 'admissions-guidance',
    kind: 'photo',
    source: '9Y3A1816.JPG',
    slug: 'a-member-of-staff-guiding-a-student-alliance-high-nansana',
    slot: 'Admissions header; Contact',
    alt: 'A member of staff guiding a student outside the administration block at Alliance High School Nansana',
    aspect: '3:2',
  },
  {
    key: 'academics-classroom',
    kind: 'photo',
    source: '9Y3A1819.JPG',
    slug: 'students-writing-in-class-alliance-high-nansana',
    slot: 'Academics, classroom; Stats background',
    alt: 'Students writing at their desks during a lesson at Alliance High School Nansana',
    aspect: '16:9',
  },
  {
    key: 'campus-avenue',
    kind: 'photo',
    source: '9Y3A1847.JPG',
    slug: 'students-on-the-tree-lined-campus-avenue-alliance-high-nansana',
    slot: 'Home hero, slide 3; Gallery, around the campus',
    alt: 'Students walking along the tree-lined avenue through the campus at Alliance High School Nansana',
    aspect: '16:9',
  },
  {
    key: 'students-in-uniform',
    kind: 'photo',
    source: '9Y3A1779.JPG',
    slug: 'students-in-school-uniform-on-the-campus-road-alliance-high-nansana',
    slot: 'About, school life; Gallery, around the campus',
    alt: 'Students in school uniform standing together on the campus road at Alliance High School Nansana',
    aspect: '16:9',
  },
  {
    key: 'administration-block',
    kind: 'photo',
    source: '9Y3A1838.JPG',
    slug: 'the-administration-block-alliance-high-nansana',
    slot: 'Contact header; Gallery, around the campus',
    alt: 'The administration block at Alliance High School Nansana',
    aspect: '16:9',
  },
  {
    key: 'computer-lab',
    kind: 'photo',
    source: '9Y3A1825.JPG',
    slug: 'students-in-the-computer-laboratory-alliance-high-nansana',
    slot: 'Facilities; Gallery, in the classroom',
    alt: 'Students working at computers in the computer laboratory at Alliance High School Nansana',
    aspect: '4:3',
  },
  {
    key: 'classroom-two-students-writing',
    kind: 'photo',
    source: '9Y3A1738.JPG',
    slug: 'two-students-taking-notes-in-class-alliance-high-nansana',
    slot: 'Gallery, in the classroom',
    alt: 'Two students taking notes at a classroom desk at Alliance High School Nansana',
    aspect: '3:2',
  },
  {
    key: 'classroom-two-students-reading',
    kind: 'photo',
    source: '9Y3A1739.JPG',
    slug: 'two-students-studying-at-a-classroom-desk-alliance-high-nansana',
    slot: 'Gallery, in the classroom',
    alt: 'Two students reading and writing together at a classroom desk at Alliance High School Nansana',
    aspect: '3:2',
  },
  // Supplied by the school 2026-10-19 (WhatsApp, low resolution). 07.28.52 is a near-duplicate
  // of 07.28.51 and is left out.
  {
    key: 'sports-boys-football',
    kind: 'photo',
    source: 'wa-0728-47.jpeg',
    slug: 'boys-football-team-talk-alliance-high-nansana',
    slot: 'Sports; Why choose us; Gallery, sports',
    alt: 'The boys football team in green kit gathered for a team talk on the pitch at Alliance High School Nansana',
    aspect: '3:2',
  },
  {
    key: 'sports-girls-football',
    kind: 'photo',
    source: 'wa-0728-50.jpeg',
    slug: 'girls-football-team-on-the-pitch-alliance-high-nansana',
    slot: 'Gallery, sports',
    alt: 'The girls football team in orange kit walking together across the pitch at Alliance High School Nansana',
    aspect: '4:5',
  },
  {
    key: 'studentlife-bible-reading',
    kind: 'photo',
    source: 'wa-0728-46.jpeg',
    slug: 'students-reading-the-bible-together-alliance-high-nansana',
    slot: 'Gallery, clubs and societies',
    alt: 'Four students in school uniform reading the Bible together outdoors at Alliance High School Nansana',
    aspect: '4:5',
  },
  {
    key: 'studentlife-a-level-girls',
    kind: 'photo',
    source: 'wa-0728-51.jpeg',
    slug: 'senior-girls-seated-under-the-trees-alliance-high-nansana',
    slot: 'Gallery, around the campus',
    alt: 'Four senior students in red ties seated together under the trees at Alliance High School Nansana',
    aspect: '4:5',
  },
  {
    key: 'vocational-tailoring-lesson',
    kind: 'photo',
    source: 'wa-0729-29.jpeg',
    slug: 'tailoring-and-fashion-design-lesson-alliance-high-nansana',
    slot: 'Academics, vocational skills; Gallery, tailoring',
    alt: 'A student working at a sewing machine during a tailoring and fashion design lesson at Alliance High School Nansana',
    aspect: '4:5',
  },
  {
    key: 'vocational-tailoring-sewing',
    kind: 'photo',
    source: 'wa-0729-28.jpeg',
    slug: 'student-sewing-in-the-tailoring-class-alliance-high-nansana',
    slot: 'Gallery, tailoring',
    alt: 'A student practising stitching on a sewing machine while classmates watch in the tailoring class at Alliance High School Nansana',
    aspect: '4:5',
  },
  {
    key: 'vocational-tailoring-practice',
    kind: 'photo',
    source: 'wa-0729-28b.jpeg',
    slug: 'students-practising-on-the-sewing-machine-alliance-high-nansana',
    slot: 'Gallery, tailoring',
    alt: 'Students gathered round a classmate practising on a sewing machine in the tailoring class at Alliance High School Nansana',
    aspect: '4:5',
  },

  // ------------------------------------------------- AI placeholders, replace with real photos
  {
    key: 'ph-chemistry-lab',
    kind: 'placeholder',
    source: 'generated/chemistry-lab.png',
    slug: 'placeholder-chemistry-laboratory-alliance-high-nansana',
    slot: 'Why choose us; Academics, sciences',
    alt: 'Placeholder image standing in for a chemistry practical at Alliance High School Nansana',
    aspect: '4:3',
    brief:
      'Senior Four students in lab coats doing a titration, teacher supervising, clean benches, labelled reagent bottles.',
  },
  {
    key: 'ph-mdd',
    kind: 'placeholder',
    source: 'generated/mdd.png',
    slug: 'placeholder-music-dance-and-drama-alliance-high-nansana',
    slot: 'Clubs, MDD; Gallery',
    alt: 'Placeholder image standing in for a music, dance and drama performance at Alliance High School Nansana',
    aspect: '3:2',
    brief:
      'Students performing a traditional dance on stage in costume, drummers at the side, audience of students.',
  },
  {
    key: 'ph-dining-hall',
    kind: 'placeholder',
    source: 'generated/dining-hall.png',
    slug: 'placeholder-dining-hall-alliance-high-nansana',
    slot: 'Boarding life; Facilities',
    alt: 'Placeholder image standing in for the dining hall at Alliance High School Nansana',
    aspect: '3:2',
    brief: 'Dining hall photographed clean and empty between meals, tables laid out, wide angle.',
  },
  {
    key: 'ph-dormitory',
    kind: 'placeholder',
    source: 'generated/dormitory.png',
    slug: 'placeholder-dormitory-alliance-high-nansana',
    slot: 'Boarding life',
    alt: 'Placeholder image standing in for a dormitory at Alliance High School Nansana',
    aspect: '3:2',
    brief:
      'Dormitory photographed tidy and empty, beds made, lockers closed. Never photograph students in the dormitory.',
  },
  {
    key: 'ph-prize-giving',
    kind: 'placeholder',
    source: 'generated/prize-giving.png',
    slug: 'placeholder-prize-giving-day-alliance-high-nansana',
    slot: 'Home hero, slide 5; News',
    alt: 'Placeholder image standing in for prize-giving day at Alliance High School Nansana',
    aspect: '16:9',
    brief:
      'A student receiving an award on speech day, guest of honour handing over the trophy, parents applauding.',
  },
]

export const photos = imageManifest.filter((i) => i.kind === 'photo')
export const placeholders = imageManifest.filter((i) => i.kind === 'placeholder')

export function imageByKey(key: string): ImageEntry {
  const found = imageManifest.find((i) => i.key === key)
  if (!found) throw new Error(`Unknown image key: ${key}`)
  return found
}
