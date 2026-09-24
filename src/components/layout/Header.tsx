'use client'

/**
 * Sticky header: crest and name, main menu with drop-downs, portal menu and an Apply
 * button. On phones everything collapses into a drawer.
 *
 * The menu data comes from the CMS, so the office can add a page to the navigation
 * without a developer.
 */

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { CREST_SRC } from '../../lib/brand'

export interface NavItem {
  label: string
  href: string
  children?: { label: string; href: string; description?: string | null }[] | null
}

interface HeaderProps {
  schoolName: string
  motto?: string | null
  items: NavItem[]
}

export function Header({ schoolName, motto, items }: HeaderProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  // Close everything on navigation, otherwise the drawer stays open behind the new page.
  // Adjusting during render rather than in an effect means the new page never paints
  // with the old drawer still open.
  const [renderedPath, setRenderedPath] = useState(pathname)
  if (pathname !== renderedPath) {
    setRenderedPath(pathname)
    setDrawerOpen(false)
    setOpenMenu(null)
  }

  // Stop the page scrolling behind the open drawer.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
        setOpenMenu(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const isCurrent = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

  return (
    <header className="sticky top-0 z-50 border-b border-maroon-900/40 bg-maroon-800 text-white shadow-[var(--shadow-card)]">
      <div className="container-site flex items-center justify-between gap-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 rounded-md py-1"
          aria-label={`${schoolName}, home`}
        >
          <Image
            src={CREST_SRC}
            alt=""
            width={48}
            height={48}
            priority
            className="h-11 w-11 shrink-0 object-contain"
          />
          <span className="leading-tight">
            <span className="block font-display text-base font-semibold whitespace-nowrap sm:text-lg">
              {schoolName}
            </span>
            {motto ? (
              <span className="block text-[11px] tracking-[0.18em] whitespace-nowrap text-gold-300 uppercase">
                {motto}
              </span>
            ) : null}
          </span>
        </Link>

        {/* Desktop menu */}
        {/*
          `shrink-0` keeps the menu at its natural width, and every item is `whitespace-nowrap`
          so a two-word label such as "Student life" cannot break onto a second line and throw
          the row out of alignment. Padding tightens at lg and relaxes again at xl.
        */}
        <nav aria-label="Main menu" className="hidden shrink-0 items-center gap-0.5 xl:flex xl:gap-1">
          {items.map((item) =>
            item.children?.length ? (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setOpenMenu(item.href)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  type="button"
                  aria-expanded={openMenu === item.href}
                  aria-haspopup="true"
                  onClick={() => setOpenMenu(openMenu === item.href ? null : item.href)}
                  className={cn(
                    'flex shrink-0 items-center gap-1 rounded-md px-2 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-maroon-700 xl:px-3',
                    isCurrent(item.href) && 'text-gold-300',
                  )}
                >
                  {item.label}
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>

                {openMenu === item.href ? (
                  <div className="absolute top-full left-0 w-72 rounded-b-xl border border-cream-300 bg-white p-2 shadow-[var(--shadow-raised)]">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-lg px-3 py-2 text-ink-800 hover:bg-cream-100"
                      >
                        <span className="block text-sm font-medium">{child.label}</span>
                        {child.description ? (
                          <span className="block text-xs text-ink-500">{child.description}</span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isCurrent(item.href) ? 'page' : undefined}
                className={cn(
                  'shrink-0 rounded-md px-2 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-maroon-700 xl:px-3',
                  isCurrent(item.href) && 'text-gold-300',
                )}
              >
                {item.label}
              </Link>
            ),
          )}

          <Link
            href="/admissions"
            className="ml-1 inline-flex min-h-11 shrink-0 items-center rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold whitespace-nowrap text-ink-950 transition-colors hover:bg-gold-400 xl:ml-2 xl:px-4"
          >
            Apply now
          </Link>
        </nav>

        {/*
          44px is the minimum comfortable touch target. It is pinned with min-width and
          min-height, and shrink-0, so that flex shrinking at 360px cannot take it under.
        */}
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg hover:bg-maroon-700 xl:hidden"
          aria-expanded={drawerOpen}
          aria-controls="mobile-menu"
          onClick={() => setDrawerOpen((open) => !open)}
        >
          <span className="sr-only">{drawerOpen ? 'Close menu' : 'Open menu'}</span>
          {drawerOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div id="mobile-menu" className="xl:hidden">
          <div className="max-h-[calc(100vh-4.5rem)] overflow-y-auto border-t border-maroon-900/40 bg-maroon-800 pb-6">
            <nav aria-label="Main menu" className="container-site flex flex-col py-2">
              {items.map((item) => (
                <div key={item.href} className="border-b border-maroon-700/60 py-1">
                  <Link
                    href={item.href}
                    className="block rounded-md px-2 py-3 text-base font-medium hover:bg-maroon-700"
                  >
                    {item.label}
                  </Link>
                  {item.children?.length ? (
                    <div className="mb-2 ml-3 flex flex-col gap-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="rounded-md px-2 py-2 text-sm text-cream-200 hover:bg-maroon-700"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              <Link
                href="/admissions"
                className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg bg-gold-500 px-4 text-base font-semibold text-ink-950"
              >
                Apply now
              </Link>
            </nav>
          </div>
          {/* Tapping outside the drawer closes it. Hidden from assistive tech: the
              close button in the header already does this job. */}
          <div
            aria-hidden="true"
            className="fixed inset-0 -z-10"
            onClick={() => setDrawerOpen(false)}
          />
        </div>
      ) : null}
    </header>
  )
}
