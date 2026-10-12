'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ChevronDown, GraduationCap, Menu, Users, X } from 'lucide-react'
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

const PORTAL_LINK_CLASS =
  'flex min-h-12 items-center justify-center gap-2 rounded-lg border border-cream-200/40 px-3 text-sm font-semibold text-white hover:bg-maroon-700'

/**
 * Sticky header: crest and name, main menu with drop-downs, portal menu and an Apply
 * button. On phones everything collapses into a drawer, which also carries the portal
 * links that the top bar shows on desktop.
 *
 * The menu data comes from the CMS, so the office can add a page to the navigation
 * without a developer.
 */
export function Header({ schoolName, motto, items }: HeaderProps) {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  // Where the drawer starts: the header's bottom edge, measured when it opens and resizes, because
  // the header grows when the school name wraps onto two lines on a narrow phone.
  const [drawerTop, setDrawerTop] = useState(0)
  const headerRef = useRef<HTMLElement>(null)

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
    if (!drawerOpen) return

    const updateDrawerTop = () => {
      setDrawerTop(headerRef.current?.getBoundingClientRect().bottom ?? 0)
    }
    updateDrawerTop()
    window.addEventListener('resize', updateDrawerTop)
    return () => window.removeEventListener('resize', updateDrawerTop)
  }, [drawerOpen])

  // The drawer is phone-only. If the window widens past the breakpoint (a tablet turned
  // sideways) close it, or the page would stay locked with no visible way out.
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (desktop.matches) setDrawerOpen(false)
    }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
        setOpenMenu(null)
      }
    }
    const onClickOutside = (event: MouseEvent) => {
      if (openMenu && !(event.target as HTMLElement).closest('[data-open="true"]')) {
        setOpenMenu(null)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('click', onClickOutside)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('click', onClickOutside)
    }
  }, [openMenu])

  // Links close the drawer themselves: a link to a section of the current page ("#faqs")
  // does not change the pathname, so the navigation reset above would not fire.
  const closeDrawer = () => setDrawerOpen(false)

  const isCurrent = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-maroon-900/40 bg-maroon-800 text-white shadow-[var(--shadow-card)]"
    >
      <div className="container-site flex items-center justify-between gap-3 py-3 sm:gap-4">
        {/*
          On a phone the name may wrap and the motto tightens, so the row never grows wider
          than the screen (at 360 px the name on one line does not fit beside the menu
          button). From `sm` up there is room, and the name stays on one line.
        */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-md py-1 sm:shrink-0 sm:gap-3"
          aria-label={`${schoolName}, home`}
        >
          <Image
            src={CREST_SRC}
            alt=""
            width={48}
            height={48}
            priority
            className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
          />
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-[0.9375rem] font-semibold sm:text-lg sm:whitespace-nowrap">
              {schoolName}
            </span>
            {motto ? (
              <span className="block truncate text-[10px] tracking-[0.12em] text-gold-300 uppercase sm:text-[11px] sm:tracking-[0.18em]">
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
        <nav aria-label="Main menu" className="hidden shrink-0 items-center gap-0.5 lg:flex lg:gap-1">
          {items.map((item) =>
            item.children?.length ? (
              /*
                The label is a link to the section page; the chevron beside it opens the
                drop-down for touch and keyboard users. Hover is tracked on the whole item,
                panel included, so the pointer can travel from the label into the panel.
                Only a real mouse opens it on hover: a tap fires pointerenter just before
                click, which would otherwise open and immediately close the menu.
              */
              <div
                key={item.href}
                className="group relative flex items-center rounded-md transition-colors hover:bg-maroon-700"
                data-open={openMenu === item.href ? 'true' : 'false'}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') setOpenMenu(item.href)
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType === 'mouse') setOpenMenu(null)
                }}
              >
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? 'page' : undefined}
                  className={cn(
                    'shrink-0 rounded-md py-2 pl-2 text-sm font-medium whitespace-nowrap xl:pl-3',
                    isCurrent(item.href) && 'text-gold-300',
                  )}
                >
                  {item.label}
                </Link>
                <button
                  type="button"
                  aria-expanded={openMenu === item.href}
                  aria-haspopup="true"
                  aria-label={`${item.label} pages`}
                  onClick={() => setOpenMenu(openMenu === item.href ? null : item.href)}
                  className="flex min-h-11 items-center rounded-md pr-2 pl-1 xl:pr-3"
                >
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[open=true]:rotate-180" aria-hidden="true" />
                </button>

                {openMenu === item.href ? (
                  <div className="motion-drop absolute top-full left-0 z-50 min-w-[20rem] rounded-b-xl border border-cream-300 bg-white p-2 shadow-[0_2px_4px_rgb(20_20_20/0.08),0_16px_40px_-16px_rgb(20_20_20/0.28)] shadow-[var(--shadow-raised)]">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block rounded-lg px-3 py-2 text-ink-800 hover:bg-cream-100"
                        onClick={() => { setOpenMenu(null); setDrawerOpen(false); }}
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
            className="motion-press ml-1 inline-flex min-h-11 shrink-0 items-center rounded-lg bg-gold-500 px-3 py-2 text-sm font-semibold whitespace-nowrap text-ink-950 transition-colors hover:bg-gold-400 xl:ml-2 xl:px-4"
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
          className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg hover:bg-maroon-700 lg:hidden"
          aria-expanded={drawerOpen}
          aria-controls="mobile-menu"
          onClick={() => {
            setDrawerTop(headerRef.current?.getBoundingClientRect().bottom ?? 0)
            setDrawerOpen((open) => !open)
          }}
        >
          <span className="sr-only">{drawerOpen ? 'Close menu' : 'Open menu'}</span>
          {drawerOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </div>

      {/*
        Mobile drawer. It is fixed from the header's bottom edge to the bottom of the screen
        and scrolls on its own, so the last links and the Apply button are always reachable,
        whatever the phone's height and however much room the browser's toolbars take.
        The portal links sit at the top: on desktop they are in the top bar, which phones hide.
      */}
      {drawerOpen ? (
        <div
          id="mobile-menu"
          className="motion-drop fixed inset-x-0 bottom-0 overflow-y-auto overscroll-contain border-t border-maroon-900/40 bg-maroon-800 lg:hidden"
          style={{ top: drawerTop }}
        >
          <div className="container-site pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="grid grid-cols-2 gap-2">
              <Link href="/portal" className={PORTAL_LINK_CLASS} onClick={closeDrawer}>
                <GraduationCap className="h-5 w-5 shrink-0" aria-hidden />
                Student portal
              </Link>
              <Link href="/staff" className={PORTAL_LINK_CLASS} onClick={closeDrawer}>
                <Users className="h-5 w-5 shrink-0" aria-hidden />
                Staff portal
              </Link>
            </div>

            <nav aria-label="Main menu" className="mt-2 flex flex-col">
              {items.map((item) => (
                <div key={item.href} className="border-b border-maroon-700/60 py-1">
                  <Link
                    href={item.href}
                    onClick={closeDrawer}
                    aria-current={isCurrent(item.href) ? 'page' : undefined}
                    className={cn(
                      'flex min-h-12 items-center rounded-md px-2 text-base font-medium hover:bg-maroon-700',
                      isCurrent(item.href) && 'text-gold-300',
                    )}
                  >
                    {item.label}
                  </Link>
                  {item.children?.length ? (
                    <div className="mb-2 ml-3 flex flex-col">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={closeDrawer}
                          className="flex min-h-11 items-center rounded-md px-2 text-sm text-cream-200 hover:bg-maroon-700"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>

            <Link
              href="/admissions"
              onClick={closeDrawer}
              className="mt-5 flex min-h-12 items-center justify-center rounded-lg bg-gold-500 px-4 text-base font-semibold text-ink-950"
            >
              Apply now
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
