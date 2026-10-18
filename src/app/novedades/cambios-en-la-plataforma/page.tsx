import type { Metadata } from 'next';
import CambiosPlataformaLanding from '@/components/novedades/CambiosPlataformaLanding';

export const metadata: Metadata = {
  title: 'Qué cambió en la plataforma | Contrato Directo',
  description:
    'Todas las mejoras recientes en un solo lugar: marketplace con Mercado Pago, retención y liberación de pagos, conformidad, hitos, comienzo del servicio notificado y anticipo del 30% para servicios largos.',
  alternates: {
    canonical: '/novedades/cambios-en-la-plataforma',
  },
  openGraph: {
    title: 'Qué cambió en la plataforma',
    description:
      'Todas las mejoras recientes en un solo lugar: pagos y seguridad, marketplace, comienzo del servicio y anticipo del 30%.',
    url: '/novedades/cambios-en-la-plataforma',
    siteName: 'Contrato Directo',
    locale: 'es_AR',
    type: 'website',
  },
};

export default function CambiosEnLaPlataformaPage() {
  return <CambiosPlataformaLanding />;
}
