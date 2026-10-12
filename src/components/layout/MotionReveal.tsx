'use client'

/**
 * Reveals `data-reveal` elements as they scroll into view (styles in motion.css).
 *
 * Progressive enhancement: the server renders everything visible, and elements are only
 * hidden once this has run and marked `<html data-motion>`. Anything already on screen at
 * that moment is marked shown first, in the same tick, so nothing flickers on load. Content
 * added later (a client-side page change) is picked up by a MutationObserver.
 */

import { useEffect } from 'react'

const SELECTOR = '[data-reveal]'
/** Gap between cards that come into view together, so a row fills in left to right. */
const STAGGER_MS = 80
const MAX_DELAY_MS = 400

function isOnScreenOrAbove(element: Element): boolean {
  return element.getBoundingClientRect().top < window.innerHeight
}

function reveal(element: HTMLElement, mode: 'in' | 'now', delayMs = 0) {
  if (delayMs > 0) element.style.setProperty('--reveal-delay', `${delayMs}ms`)
  element.dataset.revealed = mode
}

export function MotionReveal() {
  useEffect(() => {
    const root = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        const arriving = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)

        arriving.forEach((entry, order) => {
          observer.unobserve(entry.target)
          reveal(entry.target as HTMLElement, 'in', Math.min(order * STAGGER_MS, MAX_DELAY_MS))
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.1 },
    )

    const track = (element: HTMLElement, initial: boolean) => {
      if (element.dataset.revealed) return
      if (initial && isOnScreenOrAbove(element)) reveal(element, 'now')
      else observer.observe(element)
    }

    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((element) => track(element, true))
    root.dataset.motion = 'on'

    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return
          if (node.matches(SELECTOR)) track(node, false)
          node.querySelectorAll<HTMLElement>(SELECTOR).forEach((element) => track(element, false))
        })
      }
    })
    mutations.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mutations.disconnect()
      delete root.dataset.motion
    }
  }, [])

  return null
}
