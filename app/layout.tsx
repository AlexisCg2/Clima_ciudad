import type { Metadata } from 'next';
import React from 'react';
import './globals.css';
import { AvisoOffline } from '../src/components/AvisoOffline';
import { Footer } from '../src/components/Footer';

export const metadata: Metadata = {
  title: '09 · Clima por ciudad | Pronóstico meteorológico accesible',
  description:
    'Aplicación atómica de pronóstico meteorológico por ciudad con Open-Meteo, caché compartida, favoritos y accesibilidad WCAG 2.2 AA.',
  keywords: ['clima', 'pronóstico', 'temperatura', 'ciudades', 'Open-Meteo'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {/* Enlace para saltar al contenido principal (WCAG 2.4.1) */}
        <a href="#contenido-principal" className="saltar-contenido">
          Saltar al contenido principal
        </a>

        {/* Banner de aviso offline (Sección 5) */}
        <AvisoOffline />

        {/* Contenido principal con landmark semántico */}
        <main id="contenido-principal" style={{ flex: '1 0 auto' }}>
          {children}
        </main>

        {/* Pie de página con atribución y cumplimiento de accesibilidad */}
        <Footer />
      </body>
    </html>
  );
}
