'use client';

import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface CancelRegistrationProps {
  onConfirm: () => void;
  busy?: boolean;
  /** Nombre de la actividad, para que el lector de pantalla sepa qué se cancela. */
  title?: string;
}

/** Cancelar un cupo pide una segunda confirmación en el mismo lugar, sin ventana emergente. */
export function CancelRegistration({ onConfirm, busy = false, title }: CancelRegistrationProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)} aria-label={title ? `Cancelar inscripción a ${title}` : undefined}>
        Cancelar inscripción
      </Button>
    );
  }

  return (
    <div role="group" aria-label="Confirmar cancelación" className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-ink-muted">¿Liberar tu cupo?</span>
      <Button variant="secondary" size="sm" disabled={busy} onClick={onConfirm}>
        Sí, cancelar
      </Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirming(false)}>
        Mantener
      </Button>
    </div>
  );
}
