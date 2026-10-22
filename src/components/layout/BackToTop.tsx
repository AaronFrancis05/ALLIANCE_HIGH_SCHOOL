'use client'

/**
 * A round "back to top" button in the bottom-right corner, shown once the visitor has
 * scrolled more than a screen down.
 *
 * It scrolls smoothly unless the visitor asks for reduced motion, then moves keyboard focus
 * to the page's main region so the next Tab starts from the top, not from the footer.
 * Sits below the header (z-50), so the mobile menu still covers it when open.
 */

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '../../lib/cn'

export function BackToTop({ targetId }: { targetId: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const backToTop = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })

    const target = document.getElementById(targetId)
    if (!target) return
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }

  return (
    <button
      type="button"
      onClick={backToTop}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={cn(
        'fixed right-4 bottom-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-maroon-800 text-white shadow-[var(--shadow-raised)] transition-[opacity,translate,scale,background-color] duration-300 hover:bg-maroon-700 active:scale-95 sm:right-6 sm:bottom-6',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0',
      )}
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </button>
  )
}
