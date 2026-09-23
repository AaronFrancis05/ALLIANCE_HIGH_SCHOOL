/**
 * The small set of building blocks every page is made from.
 *
 * Kept in one file on purpose: it is easier to keep twelve related primitives visually
 * consistent when they sit next to each other.
 */

import React from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'
import { cn } from '../../lib/cn'

// ---------------------------------------------------------------- layout

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('container-site', className)}>{children}</div>
}

export function Section({
  className,
  tone = 'plain',
  children,
  id,
}: {
  className?: string
  /** Background treatment. Alternate `plain` and `sunken` down a page. */
  tone?: 'plain' | 'sunken' | 'brand' | 'dark'
  children: React.ReactNode
  id?: string
}) {
  const tones = {
    plain: 'bg-[var(--surface)]',
    sunken: 'bg-[var(--surface-sunken)]',
    brand: 'bg-maroon-700 text-white',
    dark: 'bg-ink-950 text-cream-100',
  } as const

  return (
    <section id={id} className={cn('py-14 sm:py-20', tones[tone], className)}>
      {children}
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'center',
  inverted = false,
}: {
  eyebrow?: string
  title: string
  lead?: string
  align?: 'center' | 'left'
  inverted?: boolean
}) {
  return (
    <header className={cn('mb-10 max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow ? (
        <p
          className={cn(
            'mb-3 inline-block rounded-full border px-3 py-1 text-xs font-semibold tracking-widest uppercase',
            inverted ? 'border-white/30 text-gold-300' : 'border-[var(--border-subtle)] text-maroon-700',
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2 className={cn('text-3xl sm:text-4xl', inverted && 'text-white')}>{title}</h2>
      {lead ? (
        <p className={cn('mt-4 text-lg', inverted ? 'text-cream-200' : 'text-[var(--text-muted)]')}>{lead}</p>
      ) : null}
    </header>
  )
}

// ---------------------------------------------------------------- button

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-maroon-700 text-white hover:bg-maroon-800 active:bg-maroon-900',
  secondary:
    'border-2 border-maroon-700 text-maroon-700 hover:bg-maroon-700 hover:text-white active:bg-maroon-800',
  accent: 'bg-gold-500 text-ink-950 hover:bg-gold-400 active:bg-gold-600 font-semibold',
  ghost: 'text-ink-800 hover:bg-cream-200',
}

const buttonBase =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={cn(buttonBase, buttonStyles[variant], className)} {...props}>
      {children}
    </button>
  )
}

export function ButtonLink({
  href,
  variant = 'primary',
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return (
    <Link href={href} className={cn(buttonBase, buttonStyles[variant], className)} {...props}>
      {children}
    </Link>
  )
}

// ---------------------------------------------------------------- surfaces

export function Card({
  className,
  children,
  as: Tag = 'div',
}: {
  className?: string
  children: React.ReactNode
  as?: 'div' | 'article' | 'li'
}) {
  return (
    <Tag
      className={cn(
        'rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-[var(--shadow-card)]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function Badge({
  children,
  tone = 'maroon',
}: {
  children: React.ReactNode
  tone?: 'maroon' | 'gold' | 'ink' | 'muted'
}) {
  const tones = {
    maroon: 'bg-maroon-50 text-maroon-800 border-maroon-200',
    gold: 'bg-gold-50 text-gold-800 border-gold-200',
    ink: 'bg-ink-100 text-ink-800 border-ink-200',
    muted: 'bg-cream-100 text-ink-600 border-cream-300',
  } as const

  return (
    <span className={cn('inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium', tones[tone])}>
      {children}
    </span>
  )
}

/**
 * True for content the school has not supplied yet, written as `[Head Teacher's name]`.
 * Such text must never be chopped up for display: initials of "[Parent's name]" come out
 * as "[P", which reads as a broken page rather than as content still to come.
 */
export function isContentPlaceholder(value?: string | null): boolean {
  return typeof value === 'string' && /^\s*\[.*\]\s*$/.test(value)
}

/** Used wherever a person has no photograph, so the directory still looks deliberate. */
export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  const initials = isContentPlaceholder(name)
    ? ''
    : name
        .replace(/^(Mr|Mrs|Ms|Dr|Prof|Rev|Sr|Fr)\.?\s+/i, '')
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('')

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex aspect-square w-full items-center justify-center rounded-[var(--radius-card)] bg-maroon-700 text-2xl font-semibold tracking-wide text-gold-300',
        className,
      )}
    >
      {initials || <User className="h-1/2 w-1/2 opacity-70" strokeWidth={1.5} />}
    </span>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-8 text-center">
      <p className="font-display text-xl text-[var(--text-strong)]">{title}</p>
      <p className="mt-2 text-[var(--text-muted)]">{body}</p>
    </Card>
  )
}

export function Prose({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'max-w-none space-y-4 leading-relaxed [&_a]:text-maroon-700 [&_a]:underline [&_a:hover]:text-maroon-900',
        '[&_h2]:mt-8 [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:text-xl',
        '[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-6',
        className,
      )}
    >
      {children}
    </div>
  )
}
