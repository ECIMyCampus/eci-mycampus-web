import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '../components/layout/Navbar';
import { BottomNav } from '../components/layout/BottomNav';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'ECI-MyCampus | Escuela Colombiana de Ingeniería Julio Garavito',
  description: 'Radar de eventos en vivo, mapa ilustrado interactivo y vida universitaria de la Escuela Colombiana de Ingeniería.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
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
    <html lang="es" className={`dark ${inter.variable}`}>
      <body className="flex min-h-dvh flex-col bg-canvas font-sans text-ink antialiased">
        <Navbar />
        {/* El espacio inferior deja libre la barra de navegación del celular. */}
        <main className="flex-1 pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
