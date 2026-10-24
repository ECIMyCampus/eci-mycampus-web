import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ECI-MyCampus | Escuela Colombiana de Ingeniería Julio Garavito',
  description: 'Conecta con los eventos, partidos de ASCUN, charlas académicas y el mapa en vivo del campus.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
