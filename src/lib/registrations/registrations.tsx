'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { useSession } from '../session/session';
import { EventRegistration } from '../../types';

export type RegistrationsStatus = 'idle' | 'loading' | 'ready' | 'error';

interface RegistrationsValue {
  status: RegistrationsStatus;
  /** Todas las reservas de la persona (confirmadas, canceladas y asistidas). */
  items: EventRegistration[];
  /** ¿Tiene un cupo vigente en este evento? */
  isRegistered: (eventId: string) => boolean;
  /** Reserva un cupo. Lanza `ApiRequestError` con el motivo del backend (cupos agotados, ya inscrito...). */
  register: (eventId: string) => Promise<EventRegistration>;
  /** Cancela el cupo. El backend solo lo permite hasta 2 horas antes del evento. */
  cancel: (eventId: string) => Promise<EventRegistration>;
  reload: () => Promise<void>;
}

const RegistrationsContext = createContext<RegistrationsValue | null>(null);

/** Reemplaza (o agrega) la reserva de un evento, para que la interfaz cambie sin volver a pedir la agenda. */
const upsert = (items: EventRegistration[], next: EventRegistration): EventRegistration[] => {
  const previous = items.find((item) => item.eventId === next.eventId);
  return [...items.filter((item) => item.eventId !== next.eventId), { ...previous, ...next }];
};

/**
 * Reservas de la persona con sesión. Se cargan al entrar y se vacían al salir, para que el radar,
 * el detalle y la agenda muestren el mismo estado ("Inscrito") sin pedir la agenda cada uno.
 */
export function RegistrationsProvider({ children }: { children: React.ReactNode }) {
  const { status: sessionStatus } = useSession();
  const [status, setStatus] = useState<RegistrationsStatus>('idle');
  const [items, setItems] = useState<EventRegistration[]>([]);

  const reload = useCallback(async () => {
    setStatus((current) => (current === 'ready' ? current : 'loading'));
    try {
      setItems(await api.getItinerary());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      void reload();
    } else if (sessionStatus === 'anonymous') {
      setItems([]);
      setStatus('idle');
    }
  }, [sessionStatus, reload]);

  const register = useCallback(async (eventId: string) => {
    const registration = await api.registerToEvent(eventId);
    setItems((current) => upsert(current, registration));
    return registration;
  }, []);

  const cancel = useCallback(async (eventId: string) => {
    const registration = await api.cancelRegistration(eventId);
    setItems((current) => upsert(current, registration));
    return registration;
  }, []);

  const value = useMemo<RegistrationsValue>(
    () => ({
      status,
      items,
      isRegistered: (eventId) => items.some((item) => item.eventId === eventId && item.status === 'CONFIRMADA'),
      register,
      cancel,
      reload,
    }),
    [status, items, register, cancel, reload],
  );

  return <RegistrationsContext.Provider value={value}>{children}</RegistrationsContext.Provider>;
}

export function useRegistrations(): RegistrationsValue {
  const value = useContext(RegistrationsContext);
  if (!value) throw new Error('useRegistrations debe usarse dentro de <RegistrationsProvider>');
  return value;
}
