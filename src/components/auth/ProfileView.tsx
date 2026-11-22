'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { ROLE_LABELS, getInitials } from '../../lib/auth/labels';
import { withReturnTo } from '../../lib/auth/redirect';
import { dayLabel, splitAgenda } from '../../lib/registrations/agenda';
import { useOptionalRegistrations } from '../../lib/registrations/registrations';
import { useSession } from '../../lib/session/session';
import { formatEventTime } from '../../lib/utils';
import Link from 'next/link';
import { Faculty } from '../../types';
import { Button } from '../ui/Button';
import { Card, Skeleton } from '../ui/Card';
import { Badge } from '../ui/Chip';
import { FormError } from './AuthShell';

const memberSince = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(new Date(iso));

/** Perfil de la persona con sesión. Sin sesión lleva a iniciar sesión y regresa aquí. */
export function ProfileView() {
  const router = useRouter();
  const { status, user, logout } = useSession();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const registrations = useOptionalRegistrations();
  const next = useMemo(
    () => (registrations?.status === 'ready' ? (splitAgenda(registrations.items).upcoming[0]?.items[0] ?? null) : null),
    [registrations?.status, registrations?.items],
  );

  useEffect(() => {
    if (status === 'anonymous' && !leaving) router.replace(withReturnTo('/login', '/perfil'));
  }, [status, leaving, router]);

  useEffect(() => {
    if (!user?.facultyId) return;
    let cancelled = false;
    api
      .getFaculties()
      .then((list) => !cancelled && setFaculties(list))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user?.facultyId]);

  const onLogout = async () => {
    setLeaving(true);
    setError(null);
    try {
      await logout();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cerrar la sesión.');
      setLeaving(false);
    }
  };

  if (!user) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-10 sm:px-6" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const faculty = faculties.find((f) => f.id === user.facultyId)?.name;
  const rows: { label: string; value: string | null }[] = [
    { label: 'Correo', value: user.email },
    { label: 'Facultad', value: faculty ?? null },
    { label: 'Carrera o programa', value: user.academicProgram ?? null },
    { label: 'Miembro desde', value: memberSince(user.createdAt) },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10 sm:px-6">
      <header className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-accent text-lg font-semibold text-white"
        >
          {getInitials(user.fullName)}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight text-ink [overflow-wrap:anywhere]">{user.fullName}</h1>
          <p className="mt-1">
            <Badge>{ROLE_LABELS[user.role] ?? user.role}</Badge>
          </p>
        </div>
      </header>

      {registrations?.status === 'ready' && (
        <section aria-labelledby="proxima-title" className="space-y-1">
          <h2 id="proxima-title" className="text-sm font-semibold text-ink">
            Tu próxima actividad
          </h2>
          {next ? (
            <p className="text-sm text-ink-muted">
              <Link href={`/eventos/${next.eventId}`} className="font-medium text-ink hover:text-accent-ink">
                {next.eventTitle ?? 'Actividad'}
              </Link>
              {next.startTime && (
                <span className="tabular-nums">
                  {' · '}
                  {dayLabel(next.startTime)}, {formatEventTime(next.startTime)}
                </span>
              )}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">
              No tienes actividades próximas.{' '}
              <Link href="/" className="font-medium text-ink hover:text-accent-ink">
                Mira el radar
              </Link>
            </p>
          )}
        </section>
      )}

      <Card as="section" aria-label="Datos de tu cuenta" className="divide-y divide-line">
        {rows
          .filter((row) => row.value)
          .map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <dt className="text-sm text-ink-muted">{row.label}</dt>
              <dd className="text-sm text-ink [overflow-wrap:anywhere] sm:text-right">{row.value}</dd>
            </div>
          ))}
        {user.interests && user.interests.length > 0 && (
          <div className="space-y-2 px-4 py-3">
            <p className="text-sm text-ink-muted">Intereses</p>
            <div className="flex flex-wrap gap-1.5">
              {user.interests.map((interest) => (
                <Badge key={interest}>{interest}</Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      <div className="space-y-3">
        <FormError message={error} />
        <div className="flex flex-wrap gap-3">
          <Button href="/mis-eventos" variant="secondary">
            Mi agenda
          </Button>
          <Button variant="ghost" onClick={onLogout} disabled={leaving}>
            {leaving ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Button>
        </div>
      </div>
    </div>
  );
}
