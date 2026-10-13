import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Contrato Directo - Conecta. Acuerda. Realiza.',
    short_name: 'Contrato Directo',
    description:
      'Plataforma que conecta clientes con proveedores de servicios de confianza en Argentina.',
    start_url: '/',
    display: 'standalone',
    background_color: '#051027',
    theme_color: '#051027',
    lang: 'es',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
