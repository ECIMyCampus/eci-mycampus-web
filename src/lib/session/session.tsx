'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onUnauthorized } from '../api';
import { AuthUser, RegisterInput } from '../../types';

/** `loading`: todavía no sabemos si hay sesión (la restauración al abrir la app no ha terminado). */
export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

interface SessionValue {
  status: SessionStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  /** Crea la cuenta y entra directamente: el backend de registro no devuelve sesión. */
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Estado de sesión de toda la aplicación. El token de acceso vive solo en memoria (`token-store`);
 * al abrir la app se recupera con la cookie de refresco, que el JavaScript no puede leer.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const setSession = useCallback((next: AuthUser | null) => {
    setUser(next);
    setStatus(next ? 'authenticated' : 'anonymous');
  }, []);

  // Al abrir la aplicación: ¿ya hay una sesión? Sin cookie de refresco (o vencida) es un visitante.
  useEffect(() => {
    let cancelled = false;
    api.restoreSession().then((me) => !cancelled && setSession(me));
    return () => {
      cancelled = true;
    };
  }, [setSession]);

  // Una acción con sesión recibió 401 y el refresco no pudo renovarla: la sesión terminó.
  useEffect(() => onUnauthorized(() => setSession(null)), [setSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user: me } = await api.login(email, password);
      setSession(me);
      return me;
    },
    [setSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await api.register(input);
      return login(input.email, input.password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setSession(null);
  }, [setSession]);

  const value = useMemo(() => ({ status, user, login, register, logout }), [status, user, login, register, logout]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/** Igual que `useSession`, pero devuelve `null` fuera del proveedor. */
export function useOptionalSession(): SessionValue | null {
  return useContext(SessionContext);
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return value;
}
