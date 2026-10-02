import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import * as content from '@/seed/content'
import { imageManifest } from '@/seed/image-manifest'
import blurData from '@/seed/blur-data.json' with { type: 'json' }
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..', '..', '..', '..')
const PHOTOS = path.join(ROOT, 'public', 'photos')

const DEV_PASSWORD = 'AllianceDev1!'
const SEED_SECRET = process.env.SEED_SECRET

function toId(id: string | number): number {
  return typeof id === 'number' ? id : Number(id)
}

async function makePdf(title: string, lines: string[]): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([595, 842])
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const regular = await pdf.embedFont(StandardFonts.Helvetica)

  page.drawText('ALLIANCE HIGH SCHOOL NANSANA', {
    x: 50, y: 780, size: 16, font: bold, color: rgb(0.545, 0.102, 0.102),
  })
  page.drawText(title, { x: 50, y: 750, size: 13, font: bold })

  lines.forEach((line, index) => {
    page.drawText(line, { x: 50, y: 715 - index * 20, size: 11, font: regular })
  })

  page.drawText('Sample document created by the seed. Not a real school record.', {
    x: 50, y: 60, size: 9, font: regular, color: rgb(0.4, 0.4, 0.4),
  })

  return Buffer.from(await pdf.save())
}

async function clearCollections(payload: any, log: (msg: string) => void) {
  const collections = [
    'reportCards', 'feeClearances', 'resources', 'applications', 'applicationDocuments',
    'posts', 'events', 'albums', 'videos', 'pages', 'testimonials', 'staffProfiles',
    'downloads', 'subjects', 'departments', 'academicTerms', 'students', 'categories',
    'media', 'formSubmissions', 'users',
  ] as const

  for (const collection of collections) {
    try {
      await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
    } catch (e) {
      log(`  skip clearing ${collection}: ${String(e).slice(0, 100)}`)
    }
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.get('x-seed-secret') !== SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const logs: string[] = []
  
  function log(message: string) {
    logs.push(message)
    console.log(message)
  }

  try {
    log('Starting production seed...')

    await clearCollections(payload, log)
    log('Cleared existing collections')

    // Staff accounts
    log('Creating staff accounts')
    const staffSpecs = [
      { name: 'ICT Administrator', email: 'admin@alliancehigh.sc.ug', role: 'superAdmin' },
      { name: 'Communications Teacher', email: 'editor@alliancehigh.sc.ug', role: 'editor' },
      { name: 'Head of Sciences', email: 'hod.sciences@alliancehigh.sc.ug', role: 'hod' },
      { name: 'Academic Registrar', email: 'registrar@alliancehigh.sc.ug', role: 'registrar' },
      { name: 'School Bursar', email: 'bursar@alliancehigh.sc.ug', role: 'bursar' },
      { name: 'Admissions Officer', email: 'admissions@alliancehigh.sc.ug', role: 'admissions' },
    ] as const

    const staff: Record<string, number> = {}

    for (const spec of staffSpecs) {
      const created = await payload.create({
        collection: 'users',
        data: { name: spec.name, email: spec.email, role: spec.role, password: DEV_PASSWORD, active: true },
        overrideAccess: true,
      })
      staff[spec.role] = toId(created.id)
    }

    // Media
    log('Uploading images')
    const mediaIds: Record<string, number> = {}

    for (const entry of imageManifest) {
      const filePath = path.join(PHOTOS, `${entry.slug}.webp`)
      try {
        await fs.access(filePath)
      } catch {
        log(`  skipped ${entry.slug} (run "pnpm images" first)`)
        continue
      }

      const created = await payload.create({
        collection: 'media',
        data: {
          alt: entry.alt,
          isPlaceholder: entry.kind === 'placeholder',
          replacementBrief: entry.brief ?? undefined,
          blurDataUrl: (blurData as Record<string, string>)[entry.slug] ?? undefined,
        },
        filePath,
        overrideAccess: true,
      })
      mediaIds[entry.key] = toId(created.id)
    }
    const media = (key: string) => mediaIds[key]

    // Departments and subjects
    log('Creating departments and subjects')
    const departmentIds: Record<string, number> = {}

    for (const department of content.departments) {
      const created = await payload.create({
        collection: 'departments',
        data: {
          name: department.name,
          code: department.code,
          description: department.description,
          head: department.code === 'SCI' ? staff.hod : undefined,
        },
        overrideAccess: true,
      })
      departmentIds[department.code] = toId(created.id)
    }

    await payload.update({
      collection: 'users',
      id: staff.hod,
      data: { department: departmentIds.SCI },
      overrideAccess: true,
    })

    const subjectIds: Record<string, number> = {}
    for (const subject of content.subjects) {
      const created = await payload.create({
        collection: 'subjects',
        data: {
          name: subject.name,
          code: subject.code,
          department: departmentIds[subject.department],
          level: subject.level,
          classes: subject.classes,
        },
        overrideAccess: true,
      })
      subjectIds[subject.code] = toId(created.id)
    }

    // Globals
    log('Writing globals')
    await payload.updateGlobal({ slug: 'siteSettings', data: content.siteSettings, overrideAccess: true })
    await payload.updateGlobal({
      slug: 'homePage',
      data: {
        hero: content.homePage.hero.map((slide) => ({
          headline: slide.headline, subhead: slide.subhead,
          image: media(slide.imageKey),
          buttonLabel: slide.buttonLabel, buttonHref: slide.buttonHref,
        })),
        welcome: { ...content.homePage.welcome, photo: undefined },
        features: content.homePage.features.map((feature) => ({
          title: feature.title, body: feature.body, icon: feature.icon, image: media(feature.imageKey),
        })),
        callToAction: content.homePage.callToAction,
      },
      overrideAccess: true,
    })
    await payload.updateGlobal({ slug: 'admissionsSettings', data: content.admissionsSettings, overrideAccess: true })

    // Categories
    log('Creating categories')
    const categoryIds: Record<string, number> = {}
    for (const name of ['Academics', 'Student life', 'Announcements', 'Sports']) {
      const slug = name.toLowerCase().replace(/\s+/g, '-')
      const created = await payload.create({ collection: 'categories', data: { name, slug }, overrideAccess: true })
      categoryIds[name] = toId(created.id)
    }

    const richText = (text: string) => ({
      root: {
        type: 'root', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const,
        children: text.split('\n\n').map((paragraph) => ({
          type: 'paragraph', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const,
          children: [{ type: 'text', text: paragraph, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
        })),
      },
    })

    // Posts
    log('Creating posts')
    for (const [index, post] of content.posts.entries()) {
      const slug = post.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 80)
      const publishedAt = new Date(Date.now() - (index + 1) * 5 * 24 * 60 * 60 * 1000).toISOString()
      await payload.create({
        collection: 'posts',
        data: { title: post.title, slug, excerpt: post.excerpt, coverImage: media(post.imageKey), category: categoryIds[post.category], publishedAt, author: staff.editor, body: richText(post.body), _status: 'published' },
        overrideAccess: true,
      })
    }

    // Events
    log('Creating events')
    for (const event of content.events) {
      const slug = event.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      const start = new Date(Date.now() + event.daysFromNow * 24 * 60 * 60 * 1000)
      start.setHours(9, 0, 0, 0)
      await payload.create({
        collection: 'events',
        data: { title: event.title, slug, summary: event.summary, startDate: start.toISOString(), location: 'Alliance High School Nansana', audience: event.audience, _status: 'published' },
        overrideAccess: true,
      })
    }

    // Albums
    log('Creating albums')
    for (const album of content.albums) {
      const slug = album.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      const photos = album.imageKeys.map(media).filter(Boolean)
      if (!photos.length) continue
      await payload.create({
        collection: 'albums',
        data: { title: album.title, slug, category: album.category, year: new Date().getFullYear(), cover: photos[0], photos, _status: 'published' },
        overrideAccess: true,
      })
    }

    // Testimonials
    log('Creating testimonials')
    for (const testimonial of content.testimonials) {
      await payload.create({ collection: 'testimonials', data: { ...testimonial, featured: true, consent: true }, overrideAccess: true })
    }

    // Terms, students, report cards
    log('Creating terms and students')
    const year = new Date().getFullYear()
    const termSpecs = [
      { term: '1' as const, start: `${year}-02-05`, end: `${year}-05-02`, released: true },
      { term: '2' as const, start: `${year}-05-27`, end: `${year}-08-22`, released: true },
      { term: '3' as const, start: `${year}-09-16`, end: `${year}-12-05`, released: false, current: true },
    ]
    const termIds: Record<string, number> = {}

    for (const spec of termSpecs) {
      const created = await payload.create({
        collection: 'academicTerms',
        data: { year, term: spec.term, startDate: new Date(spec.start).toISOString(), endDate: new Date(spec.end).toISOString(), resultsReleased: spec.released, current: spec.current ?? false, reportingDates: spec.term === '3' ? [{ classes: 'S.4 and S.6', date: new Date(`${year}-09-14`).toISOString() }, { classes: 'S.1, S.2, S.3 and S.5', date: new Date(`${year}-09-16`).toISOString() }] : [] },
        overrideAccess: true,
      })
      termIds[spec.term] = toId(created.id)
    }

    const studentSpecs = [
      { admissionNo: 'AHSN/25/001', firstName: 'Sample', lastName: 'Cleared', class: 'S4' as const, cleared: true },
      { admissionNo: 'AHSN/25/002', firstName: 'Sample', lastName: 'Blocked', class: 'S4' as const, cleared: false },
      { admissionNo: 'AHSN/25/003', firstName: 'Sample', lastName: 'Senior', class: 'S6' as const, cleared: true },
    ]
    const studentIds: Record<string, number> = {}

    for (const spec of studentSpecs) {
      const created = await payload.create({
        collection: 'students',
        data: { admissionNo: spec.admissionNo, username: spec.admissionNo, password: DEV_PASSWORD, firstName: spec.firstName, lastName: spec.lastName, class: spec.class, stream: 'East', residence: 'boarding', status: 'active', mustChangePassword: false, phone: '+256700000000', guardians: [{ name: 'Sample Guardian', relationship: 'Parent', phone: '+256700000000' }] },
        overrideAccess: true,
      })
      studentIds[spec.admissionNo] = toId(created.id)

      await payload.create({
        collection: 'feeClearances',
        data: { student: studentIds[spec.admissionNo], term: termIds['2'], status: spec.cleared ? 'cleared' : 'blocked', reason: spec.cleared ? undefined : 'outstanding balance on Term 2 fees', updatedBy: staff.bursar },
        overrideAccess: true,
      })

      for (const term of ['2', '3'] as const) {
        const pdf = await makePdf(`Report card: ${spec.admissionNo}, Term ${term} ${year}`, [
          `Name: ${spec.firstName} ${spec.lastName}`, `Class: ${spec.class}`, '', 'Mathematics           78    Very good', 'English Language      71    Good', 'Physics               66    Fair', 'Chemistry             74    Good', 'Biology               69    Fair', '', 'Class teacher: this learner works steadily and should keep it up.',
        ])
        await payload.create({
          collection: 'reportCards',
          data: { student: studentIds[spec.admissionNo], term: termIds[term], published: term === '2', uploadedBy: staff.registrar },
          file: { data: pdf, mimetype: 'application/pdf', name: `${spec.admissionNo.replace(/\//g, '-')}-term-${term}-${year}.pdf`, size: pdf.length },
          overrideAccess: true,
        })
      }
    }

    // Resources
    log('Creating e-Library resources')
    const resourceSpecs = [
      { title: 'Senior Four Chemistry: revision notes on organic chemistry', type: 'notes', subject: 'CHE', classes: ['S3', 'S4'], visibility: 'classes' },
      { title: 'Senior Four Physics past paper, 2024', type: 'pastPaper', subject: 'PHY', classes: ['S4'], visibility: 'classes' },
      { title: 'Senior Six Mathematics: past paper with solutions', type: 'pastPaper', subject: 'MTC', classes: ['S6'], visibility: 'classes' },
      { title: 'Senior One English: scheme of work', type: 'scheme', subject: 'ENG', classes: ['S1'], visibility: 'students' },
      { title: 'School reading list, all classes', type: 'other', subject: 'LIT', classes: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'], visibility: 'public' },
    ] as const

    for (const spec of resourceSpecs) {
      const subjectCode = spec.subject
      const subject = content.subjects.find((s) => s.code === subjectCode)!
      const pdf = await makePdf(spec.title, ['This is a sample document created by the seed.', 'Replace it with the real material through the admin panel.'])
      await payload.create({
        collection: 'resources',
        data: { title: spec.title, description: 'Sample document created by the seed.', type: spec.type, department: departmentIds[subject.department], subject: subjectIds[subjectCode], classes: [...spec.classes], visibility: spec.visibility, year, uploadedBy: staff.registrar },
        file: { data: pdf, mimetype: 'application/pdf', name: `${spec.title.toLowerCase().replace(/[^\w]+/g, '-').slice(0, 60)}.pdf`, size: pdf.length },
        overrideAccess: true,
      })
    }

    // Staff directory
    log('Creating staff directory')
    for (const person of content.staffDirectory) {
      await payload.create({
        collection: 'staffProfiles',
        data: { name: person.name, title: person.title, group: person.group, order: person.order, department: person.department ? departmentIds[person.department] : undefined, level: person.level },
        overrideAccess: true,
      })
    }

    log('Seed complete!')
    return NextResponse.json({ success: true, logs })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: String(error), logs }, { status: 500 })
  }
}