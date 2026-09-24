/**
 * The text the local site starts with.
 *
 * Anything the school has not confirmed is written as a bracketed placeholder such as
 * `[Founding year]`, and listed in docs/CONTENT_TODO.md. Nothing here is copied from
 * another school's website, and no figure is invented and presented as fact.
 */

export const CONTENT_PLACEHOLDER = (label: string) => `[${label}]`

export const siteSettings = {
  schoolName: 'Alliance High School Nansana',
  shortName: 'Alliance High Nansana',
  motto: 'Adfecto Excellencia',
  mottoMeaning: 'We strive for excellence',
  tagline:
    'A secondary school in Nansana, Wakiso District, developing students physically, academically and socially.',
  foundedYear: CONTENT_PLACEHOLDER('Founding year'),
  vision:
    'To be one of the leading schools in the East African region where all young people are given the opportunity and challenges to achieve their potential physically, academically and socially.',
  mission:
    'To promote intellectual, emotional, physical and social development of our students through a broad based curriculum implemented by a dedicated staff.',
  coreValues: [
    { value: 'Professionalism', description: '' },
    { value: 'Integrity', description: '' },
    { value: 'Responsibility', description: '' },
    { value: 'Teamwork', description: '' },
    { value: 'Continuous improvement', description: '' },
    { value: 'Respect for individuals and environment', description: '' },
  ],
  themeOfTheYear: {
    year: String(new Date().getFullYear()),
    theme: CONTENT_PLACEHOLDER('Theme of the year'),
    reference: '',
  },
  phones: [
    { label: 'School office', number: '+256 702 601686', whatsapp: true },
  ],
  emails: [
    { label: 'General', address: 'info@alliancehigh.sc.ug' },
    { label: 'Admissions', address: 'admissions@alliancehigh.sc.ug' },
  ],
  address: {
    line1: 'Nansana',
    district: 'Wakiso District',
    country: 'Uganda',
    poBox: 'P.O. Box 7236, Kampala',
    mapEmbedUrl: '',
  },
  officeHours: [
    { days: 'Monday to Friday', hours: '8:00 am to 5:00 pm' },
    { days: 'Saturday', hours: '9:00 am to 1:00 pm' },
    { days: 'Sunday', hours: 'Closed' },
  ],
  stats: [
    { value: CONTENT_PLACEHOLDER('0'), label: 'Students enrolled' },
    { value: CONTENT_PLACEHOLDER('0'), label: 'Teaching staff' },
    { value: CONTENT_PLACEHOLDER('0'), label: 'Years of service' },
    { value: CONTENT_PLACEHOLDER('0'), label: 'Clubs and societies' },
  ],
  social: [],
}

export const homePage = {
  welcome: {
    heading: 'Welcome from the Head Teacher',
    name: 'Mrs. Ainesaasi Oliver',
    title: 'Head Teacher',
    message: [
      'Thank you for visiting Alliance High School Nansana. Choosing a secondary school is one of the most important decisions a family makes, and we do not take lightly the trust parents place in us.',
      'Our work is simple to describe and demanding to do well: teach thoroughly, insist on discipline, and give every learner the attention they need to find what they are good at. Whether your child joins us in Senior One or for A-Level, they will be known by name and expected to work.',
      'You are welcome to visit the school, walk through our classrooms and laboratories, and meet the people who would teach your child.',
    ].join('\n\n'),
    readMoreHref: '/about',
  },
  callToAction: {
    heading: 'Join our school community',
    body: 'Applications for the coming intake are open. Call the admissions office or visit the school any weekday to start.',
    buttonLabel: 'How to apply',
    buttonHref: '/admissions',
  },
  features: [
    {
      title: 'Thorough teaching',
      body: 'A full competence-based curriculum at O-Level and a wide choice of A-Level combinations, taught by teachers who mark and follow up.',
      icon: 'book' as const,
      imageKey: 'academics-girls-reading',
    },
    {
      title: 'Practical science',
      body: 'Laboratory work is done, not described. Learners handle apparatus and record their own results.',
      icon: 'flask' as const,
      imageKey: 'ph-chemistry-lab',
    },
    {
      title: 'Sport and culture',
      body: 'Football, netball, athletics, music, dance and drama, with time set aside every week.',
      icon: 'trophy' as const,
      imageKey: 'ph-football',
    },
    {
      title: 'Care and discipline',
      body: 'A safe, orderly campus with matrons, class teachers and a chaplaincy that knows the learners.',
      icon: 'heart' as const,
      imageKey: 'studentlife-boys-folder',
    },
  ],
  hero: [
    {
      headline: 'Education that prepares your child for life',
      subhead:
        'A secondary school in Nansana, Wakiso District, offering O-Level and A-Level in a disciplined, caring environment.',
      imageKey: 'hero-students-driveway',
      buttonLabel: 'Apply for admission',
      buttonHref: '/admissions',
    },
    {
      headline: 'Learning that reaches every student',
      subhead: 'Small enough to know each learner, structured enough to get results.',
      imageKey: 'hero-students-lined-up',
      buttonLabel: 'Our academics',
      buttonHref: '/academics',
    },
    {
      headline: 'A campus built for study',
      subhead: 'Classrooms, laboratories, a library and boarding facilities on a quiet, green site.',
      imageKey: 'ph-campus-aerial',
      buttonLabel: 'Visit the school',
      buttonHref: '/contact',
    },
  ],
}

export const admissionsSettings = {
  applicationsOpen: true,
  intakeNote: `Senior One and Senior Five intake, ${new Date().getFullYear() + 1}`,
  requirements: [
    { item: 'Original PLE or UCE result slip, with a photocopy' },
    { item: 'Birth certificate or a sworn declaration of age' },
    { item: 'Two passport-size photographs' },
    { item: 'A letter of recommendation from the previous school' },
    { item: 'Completed application form, collected from the admissions office' },
  ],
  fees: [
    {
      category: 'Senior One to Senior Four, boarding',
      tuition: CONTENT_PLACEHOLDER('Amount'),
      other: CONTENT_PLACEHOLDER('Amount'),
      total: CONTENT_PLACEHOLDER('Amount'),
    },
    {
      category: 'Senior One to Senior Four, day',
      tuition: CONTENT_PLACEHOLDER('Amount'),
      other: CONTENT_PLACEHOLDER('Amount'),
      total: CONTENT_PLACEHOLDER('Amount'),
    },
    {
      category: 'Senior Five and Senior Six, boarding',
      tuition: CONTENT_PLACEHOLDER('Amount'),
      other: CONTENT_PLACEHOLDER('Amount'),
      total: CONTENT_PLACEHOLDER('Amount'),
    },
  ],
  feesNote:
    'Fees are paid to the school bank account before reporting. The bursar issues a receipt, which the learner presents at registration.',
  faqs: [
    {
      question: 'When does the school accept applications?',
      answer:
        'Applications are received throughout the year, and most families apply between October and January for the Senior One intake. Call the admissions office or visit the school on a weekday.',
    },
    {
      question: 'Is Alliance High School Nansana a boarding school?',
      answer: 'The school takes both boarding and day students. Boarders are supervised by resident matrons and patrons.',
    },
    {
      question: 'What classes does the school offer?',
      answer:
        'Senior One to Senior Four under the competence-based lower secondary curriculum, and Senior Five and Senior Six for A-Level.',
    },
    {
      question: 'How do I pay school fees?',
      answer:
        'Fees are paid into the school bank account. Bring the deposit slip to the bursar, who will issue an official receipt.',
    },
    {
      question: 'Can I visit the school before applying?',
      answer:
        'Yes. Call the admissions office to arrange a time, and a member of staff will show you the classrooms, laboratories and dormitories.',
    },
  ],
}

export const posts = [
  {
    title: 'Senior Four candidates sit their mock examinations',
    excerpt:
      'Candidates began the school mock examinations this week, sitting the same paper structure they will meet at UNEB.',
    imageKey: 'academics-classroom',
    category: 'Academics',
    body: 'Candidates began the school mock examinations this week. The timetable follows the UNEB structure so that learners become familiar with the timing and the instructions before the national examinations.\n\nTeachers will mark and return the scripts within two weeks, and every candidate will sit with their class teacher to go through the questions they lost marks on.',
  },
  {
    title: 'Science students spend the term in the laboratory',
    excerpt:
      'Practical work continues every week for Senior Three and Senior Four, with each learner handling apparatus themselves.',
    imageKey: 'ph-chemistry-lab',
    category: 'Academics',
    body: 'Practical lessons run every week for Senior Three and Senior Four. Learners carry out the experiment themselves rather than watching a demonstration, and record their own observations.\n\nThe department reports that learners who do the practical work themselves handle the examination questions on procedure and observation far more confidently.',
  },
  {
    title: 'Clubs and societies open for the new term',
    excerpt:
      'Debate, journalism, science club and the music, dance and drama troupe are taking new members this term.',
    imageKey: 'clubs-debate-group',
    category: 'Student life',
    body: 'Club registration is open. Every learner is encouraged to join at least one club, and club time is protected on the timetable so that it is not eaten by extra lessons.\n\nThe debate and journalism clubs meet on Tuesdays, science club on Wednesdays, and the music, dance and drama troupe rehearses on Fridays.',
  },
  {
    title: 'A word on the library and reading',
    excerpt: 'The school library is now open during preparation hours, and the e-Library is available online.',
    imageKey: 'library-desk-reading',
    category: 'Announcements',
    body: 'The library is open during preparation hours from Monday to Friday. Learners may borrow textbooks overnight with their library card.\n\nNotes, past papers and reading material are also available in the e-Library on this website. Learners sign in with their admission number.',
  },
]

export const events = [
  {
    title: 'Visitation Day',
    summary: 'Parents and guardians visit the school, meet class teachers and see their child’s progress.',
    daysFromNow: 21,
    audience: 'parents' as const,
  },
  {
    title: 'Inter-house athletics',
    summary: 'The annual athletics competition between the school houses, held on the school field.',
    daysFromNow: 40,
    audience: 'all' as const,
  },
  {
    title: 'Senior One orientation',
    summary: 'New learners and their parents are introduced to the school, the rules and the timetable.',
    daysFromNow: 65,
    audience: 'parents' as const,
  },
]

export const testimonials = [
  {
    name: CONTENT_PLACEHOLDER('Parent’s name'),
    role: 'Parent of a Senior Three student',
    quote:
      'What convinced me was the follow-up. When my son fell behind in mathematics, the class teacher called me before I had noticed anything myself.',
  },
  {
    name: CONTENT_PLACEHOLDER('Student’s name'),
    role: 'Senior Six student',
    quote:
      'The laboratories are open and the teachers let us do the experiments ourselves. That is what made me choose sciences.',
  },
  {
    name: CONTENT_PLACEHOLDER('Alumnus’s name'),
    role: 'Former student',
    quote:
      'The discipline felt heavy at the time. At university I realised it was the reason I could organise my own work.',
  },
]

export const departments = [
  { name: 'Sciences', code: 'SCI', description: 'Biology, Chemistry, Physics and Mathematics.' },
  { name: 'Languages', code: 'LAN', description: 'English, Literature, Luganda and Kiswahili.' },
  { name: 'Humanities', code: 'HUM', description: 'History, Geography, Entrepreneurship and Religious Education.' },
  { name: 'Vocational and Creative', code: 'VOC', description: 'Agriculture, Art and Design, ICT and Technical Drawing.' },
]

/** The six classes, matching the `classes` options on the Subjects collection. */
export type SchoolClass = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6'

export const subjects: {
  name: string
  code: string
  department: string
  level: 'o' | 'a' | 'both'
  classes: SchoolClass[]
}[] = [
  { name: 'Mathematics', code: 'MTC', department: 'SCI', level: 'both' as const, classes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  { name: 'Physics', code: 'PHY', department: 'SCI', level: 'both' as const, classes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  { name: 'Chemistry', code: 'CHE', department: 'SCI', level: 'both' as const, classes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  { name: 'Biology', code: 'BIO', department: 'SCI', level: 'both' as const, classes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  { name: 'English Language', code: 'ENG', department: 'LAN', level: 'o' as const, classes: ['S1', 'S2', 'S3', 'S4'] },
  { name: 'Literature in English', code: 'LIT', department: 'LAN', level: 'both' as const, classes: ['S3', 'S4', 'S5', 'S6'] },
  { name: 'History', code: 'HIS', department: 'HUM', level: 'both' as const, classes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  { name: 'Geography', code: 'GEO', department: 'HUM', level: 'both' as const, classes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
  { name: 'Entrepreneurship', code: 'ENT', department: 'HUM', level: 'both' as const, classes: ['S3', 'S4', 'S5', 'S6'] },
  { name: 'Agriculture', code: 'AGR', department: 'VOC', level: 'both' as const, classes: ['S1', 'S2', 'S3', 'S4'] },
  { name: 'Information and Communications Technology', code: 'ICT', department: 'VOC', level: 'both' as const, classes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] },
]

export const albums = [
  { title: 'Around the campus', category: 'campus' as const, imageKeys: ['hero-students-driveway', 'hero-students-lined-up', 'studentlife-two-seniors', 'ph-campus-aerial'] },
  { title: 'In the classroom', category: 'academics' as const, imageKeys: ['academics-classroom', 'academics-outdoor-class', 'academics-girls-reading', 'ph-computer-lab'] },
  { title: 'The library', category: 'academics' as const, imageKeys: ['library-desk-reading', 'library-shelves', 'library-closeup'] },
  { title: 'Clubs and societies', category: 'clubs' as const, imageKeys: ['clubs-debate-group', 'clubs-journalism', 'ph-mdd'] },
  { title: 'Sports', category: 'sports' as const, imageKeys: ['ph-football'] },
  { title: 'Boarding life', category: 'campus' as const, imageKeys: ['ph-dining-hall', 'ph-dormitory'] },
]

/**
 * Heads of subject, O-Level and A-Level, from the school's printed list (supplied by the
 * school owner, 2026-09-23). Names are exactly as printed. Departments follow the
 * department descriptions above; Economics and General Paper are not listed under one.
 */
const headsOfSubject: { subject: string; name: string; level: 'o' | 'a'; department?: string }[] = [
  { level: 'o', subject: 'Mathematics', name: 'Mr. Mumbere Richard', department: 'SCI' },
  { level: 'o', subject: 'Entrepreneurship', name: 'Ms. Kimulinya Sarah', department: 'HUM' },
  { level: 'o', subject: 'History and Political Education', name: 'Ms. Nakyanzi Mwajuma', department: 'HUM' },
  { level: 'o', subject: 'CRE', name: 'Ms. Nagadya Irene', department: 'HUM' },
  { level: 'o', subject: 'Fine Art', name: 'Mr. Okitoi Alvin', department: 'VOC' },
  { level: 'o', subject: 'English Language', name: 'Mr. Odong Innocent', department: 'LAN' },
  { level: 'o', subject: 'Literature in English', name: 'Mr. Odong Innocent', department: 'LAN' },
  { level: 'o', subject: 'Luganda', name: 'Mr. Sekate John', department: 'LAN' },
  { level: 'o', subject: 'Kiswahili', name: 'Mr. Saturday Innocent', department: 'LAN' },
  { level: 'o', subject: 'Biology', name: 'Mr. Mivule Ronald', department: 'SCI' },
  { level: 'o', subject: 'Physics', name: 'Mr. Komakech Denish', department: 'SCI' },
  { level: 'o', subject: 'Geography', name: 'Ms. Nakimuli Vivian', department: 'HUM' },
  { level: 'o', subject: 'Agriculture', name: 'Mr. Ssegirinya William', department: 'VOC' },
  { level: 'o', subject: 'Computer', name: 'Mr. Sande Caleb', department: 'VOC' },
  { level: 'o', subject: 'Chemistry', name: 'Mr. Tulyakira Justus Byamuto', department: 'SCI' },
  { level: 'a', subject: 'Chemistry', name: 'Mr. Tulyakira Justus Byamuto', department: 'SCI' },
  { level: 'a', subject: 'Mathematics', name: 'Mr. Kamugisha Alex', department: 'SCI' },
  { level: 'a', subject: 'Geography', name: 'Mr. Mudde Godfrey', department: 'HUM' },
  { level: 'a', subject: 'Entrepreneurship', name: 'Ms. Salwa Abdallah', department: 'HUM' },
  { level: 'a', subject: 'Art', name: 'Mr. Okitoi Alvin', department: 'VOC' },
  { level: 'a', subject: 'Literature', name: 'Ms. Mpumwire Jailah', department: 'LAN' },
  { level: 'a', subject: 'Economics', name: 'Mr. Ngororano Vicent' },
  { level: 'a', subject: 'Physics', name: 'Mr. Tumusiime Nicholas', department: 'SCI' },
  { level: 'a', subject: 'Divinity', name: 'Ms. Mwesigye Rhonah', department: 'HUM' },
  { level: 'a', subject: 'Biology', name: 'Mr. Mukubuya Ronald', department: 'SCI' },
  { level: 'a', subject: 'Agriculture', name: 'Ms. Nalutaaya Joanita', department: 'VOC' },
  { level: 'a', subject: 'Luganda', name: 'Ms. Kalunda Prim', department: 'LAN' },
  { level: 'a', subject: 'History', name: 'Mr. Mukama Musa', department: 'HUM' },
  { level: 'a', subject: 'General Paper', name: 'Mr. Agodo Walter' },
]

/**
 * The staff directory (About: Leadership and Our staff). Names in brackets are placeholders
 * the office replaces in the admin panel; photographs are uploaded there too.
 * Leadership names supplied by the school owner, 2026-09-23.
 */
export const staffDirectory: {
  name: string
  title: string
  group: 'director' | 'administration' | 'board' | 'hods' | 'teaching' | 'support'
  order: number
  /** Department code, from `departments` above. */
  department?: string
  level?: 'o' | 'a'
}[] = [
  { name: 'Mr. TURYAKIRA NJENJEKA', title: 'Director and Founder', group: 'director', order: 1 },
  { name: 'Mrs. Ainesaasi Oliver', title: 'Head Teacher', group: 'administration', order: 1 },
  { name: '[Deputy Head Teacher’s name]', title: 'Deputy Head Teacher', group: 'administration', order: 2 },
  { name: 'Mr. Kiwanuka Asuman', title: 'School Dean', group: 'administration', order: 3 },
  { name: 'Mr. Odong Innocent', title: 'Director of Studies, A-Level', group: 'administration', order: 4 },
  { name: 'Mr. Turyagenda Bardon', title: 'Director of Studies, O-Level', group: 'administration', order: 5 },
  { name: '[Bursar’s name]', title: 'Bursar', group: 'support', order: 200 },
  { name: '[Senior Woman’s name]', title: 'Senior Woman', group: 'support', order: 201 },
  ...headsOfSubject.map((head, index) => ({
    name: head.name,
    title: `Head of ${head.subject}, ${head.level === 'o' ? 'O-Level' : 'A-Level'}`,
    group: 'hods' as const,
    order: 10 + index,
    department: head.department,
    level: head.level,
  })),
  ...subjects.map((subject, index) => ({
    name: `[${subject.name} teacher’s name]`,
    title: `Teacher, ${subject.name}`,
    group: 'teaching' as const,
    order: 100 + index,
    department: subject.department,
  })),
]
