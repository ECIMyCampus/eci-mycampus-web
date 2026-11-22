import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Inter, Sora } from 'next/font/google';
import './globals.css';
import { Navbar } from '../components/layout/Navbar';
import { BottomNav } from '../components/layout/BottomNav';
import { Toaster } from 'sonner';
import { SessionProvider } from '../lib/session/session';
import { RegistrationsProvider } from '../lib/registrations/registrations';
import { SplashScreen } from '../components/brand/SplashScreen';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
/** Tipografía del logotipo (Sora 800 para «ECI», Sora 400 para «MyCampus»). */
const sora = Sora({ subsets: ['latin'], weight: ['400', '800'], variable: '--font-sora', display: 'swap' });

/** Voz de los nombres de las carreras: una grotesca expresiva y condensada, con más carácter que Inter y más aire que Sora. */
const program = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz', 'wdth'],
  variable: '--font-program',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ECI-MyCampus | Escuela Colombiana de Ingeniería Julio Garavito',
  description: 'Radar de eventos en vivo, mapa ilustrado interactivo y vida universitaria de la Escuela Colombiana de Ingeniería.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
  width: 'device-width',
  initialScale: 1,
  // Permite que el contenido llegue bajo la muesca; las barras respetan la zona segura.
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`dark ${inter.variable} ${sora.variable} ${program.variable}`}>
      <body className="flex min-h-dvh flex-col bg-canvas font-sans text-ink antialiased">
        <SessionProvider>
          <RegistrationsProvider>
          <SplashScreen />
          <Navbar />
          {/* El espacio inferior deja libre la barra de navegación del celular. */}
          <main className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
          <BottomNav />
          {/* Arriba al centro: no tapa la barra inferior ni los botones de acción del celular. */}
          <Toaster theme="dark" position="top-center" closeButton />
          </RegistrationsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
