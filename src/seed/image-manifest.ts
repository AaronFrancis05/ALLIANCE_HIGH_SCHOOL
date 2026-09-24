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

  // ------------------------------------------------- AI placeholders, replace with real photos
  {
    key: 'ph-campus-aerial',
    kind: 'placeholder',
    source: 'generated/aerial.png',
    slug: 'placeholder-campus-aerial-alliance-high-nansana',
    slot: 'Home hero, slide 4; About, facilities',
    alt: 'Placeholder image standing in for an aerial view of the campus at Alliance High School Nansana',
    aspect: '16:9',
    brief:
      'Drone shot from about 60 m, morning light, whole campus with classroom blocks, trees and the Nansana hills behind. Leave empty sky on the left third for the headline.',
  },
  {
    key: 'ph-assembly',
    kind: 'placeholder',
    source: 'generated/assembly.png',
    slug: 'placeholder-morning-assembly-alliance-high-nansana',
    slot: 'About, school life; News default image',
    alt: 'Placeholder image standing in for morning assembly at Alliance High School Nansana',
    aspect: '16:9',
    brief:
      'Whole-school assembly on the parade ground at 7:30 am, students in lines, flag being raised, teacher addressing them. Shot from slightly raised position.',
  },
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
    key: 'ph-computer-lab',
    kind: 'placeholder',
    source: 'generated/computer-lab.png',
    slug: 'placeholder-computer-laboratory-alliance-high-nansana',
    slot: 'Why choose us; Facilities',
    alt: 'Placeholder image standing in for the computer laboratory at Alliance High School Nansana',
    aspect: '4:3',
    brief:
      'Students at desktop computers in the ICT lab, teacher helping one of them, tidy cabling, natural light from the windows.',
  },
  {
    key: 'ph-football',
    kind: 'placeholder',
    source: 'generated/football.png',
    slug: 'placeholder-football-match-alliance-high-nansana',
    slot: 'Sports',
    alt: 'Placeholder image standing in for a football match at Alliance High School Nansana',
    aspect: '3:2',
    brief:
      'Mid-action football on the school pitch, fast shutter, players in the school strip, supporters along the touchline.',
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
  {
    key: 'ph-main-gate',
    kind: 'placeholder',
    source: 'generated/main-gate.png',
    slug: 'placeholder-main-gate-alliance-high-nansana',
    slot: 'Contact',
    alt: 'Placeholder image standing in for the main gate at Alliance High School Nansana',
    aspect: '16:9',
    brief:
      'The main gate with the school signboard clearly readable, shot straight on in the morning. This one matters for Google Business Profile.',
  },
]

export const photos = imageManifest.filter((i) => i.kind === 'photo')
export const placeholders = imageManifest.filter((i) => i.kind === 'placeholder')

export function imageByKey(key: string): ImageEntry {
  const found = imageManifest.find((i) => i.key === key)
  if (!found) throw new Error(`Unknown image key: ${key}`)
  return found
}
