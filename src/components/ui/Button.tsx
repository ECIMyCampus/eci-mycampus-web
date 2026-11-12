import React from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md';

const base =
  'pressable inline-flex items-center justify-center gap-2 rounded-control font-semibold ' +
  'transition-colors duration-fast ease-out disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'border border-line-strong bg-surface-raised text-ink hover:border-ink-subtle',
  ghost: 'text-ink-muted hover:bg-surface-raised hover:text-ink',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-touch px-4 text-sm',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  /** Botón cuadrado para un solo ícono. Exige `aria-label`. */
  iconOnly?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & { href?: undefined };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children' | 'href'> & { href: string };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/** Botón base. Con `href` se comporta como enlace de navegación. */
export function Button({ variant = 'primary', size = 'md', iconOnly = false, className, children, ...rest }: ButtonProps) {
  const classes = cn(
    base,
    variants[variant],
    sizes[size],
    iconOnly && (size === 'sm' ? 'w-9 px-0' : 'w-11 px-0'),
    className,
  );

  if (rest.href !== undefined) {
    const { href, ...anchorProps } = rest;
    return (
      <Link href={href} className={classes} {...anchorProps}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  );
}
