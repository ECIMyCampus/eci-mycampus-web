/**
 * Token de acceso de la sesión. Vive solo en memoria: recargar la página lo pierde y se
 * recupera con el refresco (cookie HttpOnly). Nunca se guarda en localStorage ni en cookies legibles.
 */
let accessToken: string | null = null;

export const getAccessToken = (): string | null => accessToken;

export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
