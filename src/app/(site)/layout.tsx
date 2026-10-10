/**
 * Shell for every public page: fonts, header, footer and the site-wide structured data
 * Google uses to build the knowledge panel (FR-24).
 */

import React from 'react'
import type { Metadata } from 'next'
import '@fontsource-variable/dm-sans'
import '@fontsource/playfair-display'
import './brand.css'
import { getNavigation, getSiteSettings } from '../../lib/payload'
import { Header, type NavItem } from '../../components/layout/Header'
import { TopBar } from '../../components/layout/TopBar'
import { Footer } from '../../components/layout/Footer'
import { OrganisationJsonLd } from '../../components/seo/JsonLd'
import { env } from '../../lib/env'

/**
 * Menu used until the office edits it in the CMS.
 *
 * Every entry here must point at a page that exists — a menu that leads to a 404 is worse
 * than a shorter menu. Sub-pages are added back as their sections are built (docs/SRS.md,
 * phase P2).
 */
const DEFAULT_NAV: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'About the school', href: '/about', description: 'History, vision and values' },
      { label: 'Leadership', href: '/about/leadership', description: 'The Director and the administration' },
      { label: 'Our staff', href: '/about/staff', description: 'Heads of department and teachers' },
    ],
  },
  {
    label: 'Academics',
    href: '/academics',
    children: [
      { label: 'Departments and subjects', href: '/academics#departments', description: 'What is taught, and by whom' },
      { label: 'UNEB results', href: '/academics#results', description: 'How our candidates did' },
      { label: 'e-Library', href: '/resources', description: 'Notes, past papers and textbooks' },
    ],
  },
  {
    label: 'Admissions',
    href: '/admissions',
    children: [
      { label: 'How to apply', href: '/admissions', description: 'Requirements and steps' },
      { label: 'Apply online', href: '/admissions/apply', description: 'The application form' },
      { label: 'Track an application', href: '/admissions/track', description: 'Check its progress' },
      { label: 'Fees structure', href: '/admissions/fees', description: 'What each class pays' },
      { label: 'Questions', href: '/admissions#faqs', description: 'Answers to the common ones' },
    ],
  },
  {
    label: 'Student life',
    href: '/student-life',
    children: [
      { label: 'Clubs and societies', href: '/student-life#clubs' },
      { label: 'Sport', href: '/student-life#sports' },
      { label: 'Boarding', href: '/student-life#boarding' },
    ],
  },
  {
    label: 'News',
    href: '/news',
    children: [
      { label: 'Latest news', href: '/news', description: 'Stories and announcements' },
      { label: 'Events diary', href: '/events', description: 'Term dates and visiting days' },
    ],
  },
  { label: 'Gallery', href: '/gallery' },
  { label: 'Contact', href: '/contact' },
]

const DEFAULT_FOOTER = [
  {
    heading: 'Explore',
    links: [
      { label: 'About the school', href: '/about' },
      { label: 'Leadership', href: '/about/leadership' },
      { label: 'Academics', href: '/academics' },
      { label: 'News', href: '/news' },
      { label: 'Events', href: '/events' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Careers', href: '/careers' },
    ],
  },
  {
    heading: 'For students and parents',
    links: [
      { label: 'e-Library', href: '/resources' },
      { label: 'Admissions', href: '/admissions' },
      { label: 'Apply online', href: '/admissions/apply' },
      { label: 'Fees structure', href: '/admissions/fees' },
      { label: 'Contact the school', href: '/contact' },
    ],
  },
]

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const name = settings?.schoolName ?? 'Alliance High School Nansana'
  const description =
    settings?.mission ??
    'Alliance High School Nansana is a secondary school in Nansana, Wakiso District, Uganda, offering O-Level and A-Level education.'

  return {
    metadataBase: new URL(env.siteUrl),
    title: {
      default: `${name} | Secondary school in Nansana, Wakiso`,
      template: `%s — ${name}`,
    },
    description: description.slice(0, 155),
    applicationName: name,
    openGraph: {
      type: 'website',
      siteName: name,
      locale: 'en_UG',
      title: name,
      description: description.slice(0, 155),
      // The crest is the thumbnail Google and chat apps show beside the link.
      images: [{ url: '/brand/crest-512.png', width: 512, height: 512, alt: `${name} crest` }],
    },
    twitter: { card: 'summary' },
    icons: {
      // Google only shows a favicon in results when it is a multiple of 48 px.
      icon: [
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png' }],
    },
    // No canonical here: every page sets its own, and a site-wide '/' would tell Google
    // that any page without one is a copy of the home page.
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, navigation] = await Promise.all([getSiteSettings(), getNavigation()])

  const items: NavItem[] = navigation?.header?.length
    ? navigation.header.map((item) => ({
        label: item.label,
        href: item.href,
        children: item.children ?? undefined,
      }))
    : DEFAULT_NAV

  const footerColumns = navigation?.footer?.length
    ? navigation.footer.map((column) => ({ heading: column.heading, links: column.links ?? [] }))
    : DEFAULT_FOOTER

  const schoolName = settings?.schoolName ?? 'Alliance High School Nansana'
  const phones = settings?.phones ?? []
  const emails = settings?.emails ?? []

  return (
    <html lang="en-UG" className="font-playfair-display font-dm-sans-variable">
      <body className="flex min-h-screen flex-col">
        <a href="#main" className="skip-link">
          Skip to content
        </a>

        <TopBar phones={phones} email={emails[0]?.address} />
        <Header schoolName={schoolName} motto={settings?.motto} items={items} />

        <main id="main" className="flex-1">
          {children}
        </main>

        <Footer
          schoolName={schoolName}
          motto={settings?.motto}
          description={settings?.tagline}
          columns={footerColumns}
          phones={phones}
          emails={emails}
          address={settings?.address ?? {}}
          social={settings?.social ?? []}
        />

        <OrganisationJsonLd settings={settings} />
      </body>
    </html>
  )
}
