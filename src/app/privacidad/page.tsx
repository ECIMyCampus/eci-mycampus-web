import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacidad y cookies | ECI-MyCampus',
  description:
    'Qué datos usa ECI MyCampus, para qué, qué cookies guarda, qué servicios de terceros carga y cómo ejercer tus derechos como titular de datos.',
};

/** Política oficial de la Escuela y canal de contacto: se muestran solo si están definidos (ver .env.example). */
const POLICY_URL = process.env.NEXT_PUBLIC_DATA_POLICY_URL;
const CONTACT_EMAIL = process.env.NEXT_PUBLIC_DATA_CONTACT_EMAIL;
const SCHOOL_URL = 'https://www.escuelaing.edu.co';
const UPDATED = '22 de noviembre de 2026';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="font-program text-2xl font-bold tracking-[-0.015em] text-ink">
        {title}
      </h2>
      <div className="space-y-3 text-base leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}

const link = 'font-medium text-accent-ink underline-offset-4 hover:text-ink hover:underline';

/**
 * Privacidad y cookies. Describe lo que la aplicación hace de verdad (los datos que usa, la cookie de sesión y lo que carga de
 * terceros) y remite a la política de tratamiento de datos de la Escuela, que es la que manda. No sustituye ese documento.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <Link
        href="/"
        className="-ml-2 inline-flex min-h-9 items-center gap-1.5 rounded-control px-2 text-sm text-ink-muted transition-colors duration-fast ease-out hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Inicio
      </Link>

      <h1 className="mt-4 text-balance font-program text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-ink sm:text-5xl">
        Privacidad y cookies
      </h1>
      <p className="mt-3 text-sm text-ink-subtle">Actualizado el {UPDATED}</p>

      <div className="mt-10 space-y-10">
        <Section id="que-es" title="Qué es ECI MyCampus">
          <p>
            ECI MyCampus es una aplicación para la comunidad de la Escuela Colombiana de Ingeniería Julio Garavito: muestra
            lo que pasa en el campus, el mapa, los programas de pregrado y tus inscripciones a actividades.
          </p>
          <p>
            Puedes entrar como invitado y ver el radar, el mapa y las carreras sin darnos ningún dato personal.
          </p>
        </Section>

        <Section id="datos" title="Qué datos usamos y para qué">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-ink">Los datos básicos de tu cuenta institucional</span> (correo y nombre), cuando accedes
              con Microsoft: para identificarte y mostrarte tu perfil.
            </li>
            <li>
              <span className="text-ink">Tu facultad, tu programa y tus intereses</span>, si están en tu perfil: para mostrar
              lo que te corresponde.
            </li>
            <li>
              <span className="text-ink">Tus inscripciones</span> (a qué actividades reservas o cancelas y cuándo): para tu
              agenda y para llevar la cuenta de los cupos.
            </li>
          </ul>
          <p>No vendemos tus datos ni los usamos para publicidad. No hay analítica ni seguimiento de terceros.</p>
        </Section>

        <Section id="cookies" title="Cookies y almacenamiento">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-ink">Cookie de sesión.</span> La usamos solo para mantener tu sesión abierta. Es necesaria
              para que la aplicación funcione, la página web no puede leerla (HttpOnly) y se borra al cerrar sesión.
            </li>
            <li>
              <span className="text-ink">Almacenamiento de la sesión del navegador.</span> Recuerda, mientras la pestaña
              siga abierta, que ya viste la pantalla de carga.
            </li>
            <li>
              <span className="text-ink">Tu elección sobre el mapa.</span> Si aceptas cargar el mapa, guardamos esa elección
              en este navegador para no preguntarte cada vez.
            </li>
          </ul>
          <p>
            No usamos cookies de analítica, de publicidad ni de seguimiento. Las tipografías se sirven desde la propia
            aplicación, sin pedirlas a otros sitios.
          </p>
        </Section>

        <Section id="terceros" title="Servicios de terceros">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="text-ink">Mapbox</span> dibuja el mapa del campus. Al cargarlo, tu navegador se conecta con
              Mapbox y le llegan datos técnicos de la conexión, como tu dirección IP. No le enviamos tus datos de cuenta. Por
              eso te pedimos que aceptes antes de cargar el mapa.
            </li>
            <li>
              <span className="text-ink">Microsoft</span> verifica tu identidad cuando accedes con tu cuenta de la Escuela.
              Nunca vemos tu contraseña.
            </li>
          </ul>
        </Section>

        <Section id="derechos" title="Tus derechos">
          <p>
            Según la Ley 1581 de 2012 (Habeas Data) puedes conocer, actualizar y rectificar tus datos; pedir prueba de la
            autorización que diste; saber el uso que se les ha dado; revocar la autorización o pedir que se supriman; y
            presentar quejas ante la Superintendencia de Industria y Comercio.
          </p>
          <p>
            El tratamiento de datos personales se rige por la política de tratamiento de datos de la Escuela
            {POLICY_URL ? (
              <>
                :{' '}
                <a href={POLICY_URL} target="_blank" rel="noopener noreferrer" className={link}>
                  léela aquí
                </a>
                .
              </>
            ) : (
              <>
                , que puedes consultar en{' '}
                <a href={SCHOOL_URL} target="_blank" rel="noopener noreferrer" className={link}>
                  escuelaing.edu.co
                </a>
                .
              </>
            )}
          </p>
          {CONTACT_EMAIL && (
            <p>
              Para ejercer tus derechos escribe a{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className={link}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          )}
        </Section>

        <Section id="seguridad" title="Seguridad">
          <p>
            Tu sesión se mantiene con un token que vive solo en la memoria de la página y se renueva con la cookie de sesión.
            No guardamos contraseñas: el acceso lo resuelve Microsoft.
          </p>
        </Section>
      </div>
    </div>
  );
}
