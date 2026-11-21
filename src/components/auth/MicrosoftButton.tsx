'use client';

import React from 'react';
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
  const onClick = () => {
    if (!MICROSOFT_LOGIN_URL) {
      toast.info('El acceso con Microsoft estará disponible pronto. Por ahora entra con tu correo.');
      return;
    }
    const url = new URL(MICROSOFT_LOGIN_URL, window.location.origin);
    if (returnTo) url.searchParams.set('volver', returnTo);
    window.location.assign(url.toString());
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-14 w-full items-center justify-center gap-3 rounded-control border border-[#5E5E5E] bg-[#2F2F2F] px-4 text-base font-semibold text-white transition-[background-color,transform] duration-150 ease-out hover:bg-[#3a3a3a] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-ink"
    >
      <MicrosoftLogo />
      Iniciar sesión con Microsoft
    </button>
  );
}
