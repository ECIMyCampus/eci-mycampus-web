'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onUnauthorized } from '../api';
import { AuthUser, RegisterInput } from '../../types';

/** `loading`: todavía no sabemos si hay sesión (la primera consulta a /auth/me no ha terminado). */
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
 * Estado de sesión de toda la aplicación. La sesión vive en una cookie HttpOnly que el navegador
 * envía solo: aquí nunca se ve ni se guarda el token, solo los datos de la persona.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const setSession = useCallback((next: AuthUser | null) => {
    setUser(next);
    setStatus(next ? 'authenticated' : 'anonymous');
  }, []);

  // Al abrir la aplicación: ¿ya hay una sesión? Un 401 (o cualquier fallo) significa visitante.
  useEffect(() => {
    let cancelled = false;
    api
      .getMe()
      .then((me) => !cancelled && setSession(me))
      .catch(() => !cancelled && setSession(null));
    return () => {
      cancelled = true;
    };
  }, [setSession]);

  // Una acción con sesión recibió 401: venció o se cerró en otra pestaña.
  useEffect(() => onUnauthorized(() => setSession(null)), [setSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      await api.login(email, password);
      // El login devuelve lo básico; el perfil completo sale de /auth/me.
      const me = await api.getMe();
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

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return value;
}
