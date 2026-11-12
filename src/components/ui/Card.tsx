import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'div' | 'article' | 'section' | 'li';
}

/** Superficie base: un solo nivel de borde y fondo, sin sombras decorativas. */
export function Card({ as: Tag = 'div', className, ...rest }: CardProps) {
  return <Tag className={cn('rounded-card border border-line bg-surface', className)} {...rest} />;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  /** Acción opcional (por ejemplo un `Button`). */
  action?: React.ReactNode;
  icon?: React.ReactNode;
  /** `alert` para errores: los lectores de pantalla lo anuncian de inmediato. */
  role?: 'status' | 'alert';
  className?: string;
}

/** Estado vacío o de error de una vista: dice qué pasa y qué se puede hacer. */
export function EmptyState({ title, description, action, icon, role = 'status', className }: EmptyStateProps) {
  return (
    <Card role={role} className={cn('flex flex-col items-center gap-2 px-6 py-10 text-center', className)}>
      {icon && <div className="text-ink-subtle">{icon}</div>}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

/** Marcador de carga con la forma del contenido que va a llegar. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-control bg-surface-raised motion-reduce:animate-none', className)} />;
}
