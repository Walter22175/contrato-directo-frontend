import type { Metadata } from 'next';
import Anticipo30Landing from '@/components/novedades/Anticipo30Landing';

export const metadata: Metadata = {
  title: 'Nuevo anticipo del 30% para servicios largos | Contrato Directo',
  description:
    'En servicios de más de 3 días cobrá el 30% del presupuesto 72 horas después del comienzo del trabajo. Automático, seguro y transparente: descubrí cómo funciona el anticipo del 30% de Contrato Directo.',
  alternates: {
    canonical: '/novedades/anticipo-30',
  },
  openGraph: {
    title: 'Nuevo anticipo del 30% para servicios largos',
    description:
      'Más seguridad, más transparencia, mejor flujo de trabajo. Conocé el nuevo anticipo del 30% para servicios de más de 3 días.',
    url: '/novedades/anticipo-30',
    siteName: 'Contrato Directo',
    locale: 'es_AR',
    type: 'website',
  },
};

export default function NovedadAnticipo30Page() {
  return <Anticipo30Landing />;
}
