import React from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

const base =
  'pressable inline-flex min-h-9 flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-medium ' +
  'transition-colors duration-fast ease-out';

const tone = (selected: boolean) =>
  selected ? 'bg-ink text-canvas' : 'border border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink';

interface ChipProps {
  selected?: boolean;
  /** Con `href` el chip navega (filtros en la URL); sin él es un botón de alternancia. */
  href?: string;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

/** Chip de filtro: una opción elegible dentro de un grupo. */
export function Chip({ selected = false, href, onClick, className, children }: ChipProps) {
  const classes = cn(base, tone(selected), className);

  if (href !== undefined) {
    return (
      <Link href={href} scroll={false} aria-current={selected ? 'true' : undefined} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={classes}>
      {children}
    </button>
  );
}

interface BadgeProps {
  tone?: 'neutral' | 'accent' | 'live';
  className?: string;
  children: React.ReactNode;
}

const badgeTones: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'bg-surface-raised text-ink-muted',
  accent: 'bg-accent/15 text-accent-ink',
  live: 'bg-live/10 text-live',
};

/** Etiqueta informativa, no interactiva. */
export function Badge({ tone: badgeTone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        badgeTones[badgeTone],
        className,
      )}
    >
      {children}
    </span>
  );
}
