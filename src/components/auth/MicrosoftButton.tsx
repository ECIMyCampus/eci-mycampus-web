'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

/** El acceso con Microsoft se activa cuando el backend exponga el inicio de sesión institucional. */
const MICROSOFT_LOGIN_URL = process.env.NEXT_PUBLIC_MICROSOFT_LOGIN_URL;

/** Logo de Microsoft: cuatro cuadros con sus colores oficiales. */
function MicrosoftLogo() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 21 21" className="shrink-0">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

export function MicrosoftButton({ returnTo }: { returnTo?: string | null }) {
  const [opening, setOpening] = useState(false);
  const onClick = () => {
    if (!MICROSOFT_LOGIN_URL) {
      toast.info('El acceso con Microsoft estará disponible pronto. Por ahora entra con tu correo.');
      return;
    }
    const url = new URL(MICROSOFT_LOGIN_URL, window.location.origin);
    if (returnTo) url.searchParams.set('volver', returnTo);
    setOpening(true);
    window.location.assign(url.toString());
  };

  return (
    <div className="relative isolate">
      {/* Resplandor suave detrás: el vidrio necesita algo de color que difuminar. */}
      <span aria-hidden="true" className="glass-glow absolute -inset-x-6 -inset-y-4 -z-10" />
      <button
        type="button"
        onClick={onClick}
        disabled={opening}
        className="glass-button flex h-14 w-full items-center justify-center gap-3 rounded-control px-4 text-base font-semibold text-white transition-[background-color,transform,box-shadow] duration-150 ease-out active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink disabled:cursor-wait disabled:opacity-70"
      >
        <MicrosoftLogo />
        {opening ? 'Abriendo Microsoft…' : 'Iniciar sesión con Microsoft'}
      </button>
    </div>
  );
}
