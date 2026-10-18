'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth';
import api, { extractData } from '@/lib/api';
import {
  ShieldCheck,
  Lock,
  Percent,
  Hourglass,
  Landmark,
  KeyRound,
  Wallet,
  LayoutDashboard,
  BellRing,
  CalendarClock,
  TrendingUp,
  Timer,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import type { Faq } from '@/types';

const pagosSeguridad = [
  {
    icono: Lock,
    titulo: 'Retención y liberación',
    texto:
      'Los fondos quedan en custodia y solo se liberan con la conformidad del cliente o por resolución de un reclamo. La conformidad parcial retiene el porcentaje no conforme hasta la mediación.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Conformidad manual y automática',
    texto:
      'El cliente confirma el resultado y el pago se libera en 24 horas hábiles. Si no responde en 72 horas hábiles, el sistema da conformidad automática y libera igual.',
  },
  {
    icono: Percent,
    titulo: 'Hitos',
    texto:
      'Los servicios de más de 7 días hábiles se trabajan por hitos: cada tramo se conforma y se libera por separado (conformidad automática de hito a las 48 horas hábiles).',
  },
];

const itemsMarketplace = [
  {
    icono: Wallet,
    titulo: 'Conexión con Mercado Pago',
    texto:
      'Cada proveedor conecta su cuenta en un clic desde su panel, con autorización segura. Al reconectar se actualiza el permiso al instante.',
  },
  {
    icono: KeyRound,
    titulo: 'Tokens',
    texto:
      'La plataforma vigila cada conexión (monitoreo cada 30 minutos) y renueva los tokens automáticamente. Si uno venció, se avisa al proveedor para reconectar.',
  },
  {
    icono: TrendingUp,
    titulo: 'Captura y cancelación',
    texto:
      'Las operaciones se capturan solas a las 72 horas hábiles de la entrega, con confirmación al proveedor. Soporte también puede solicitar la captura o cancelación de una operación puntual.',
  },
  {
    icono: LayoutDashboard,
    titulo: 'Dashboard del proveedor',
    texto:
      'Semáforo de estado de la cuenta, operaciones retenidas y pendientes de captura, con el detalle de cada movimiento en un solo lugar.',
  },
  {
    icono: ShieldCheck,
    titulo: 'Panel admin',
    texto:
      'Visibilidad total: cuentas conectadas, tokens inválidos, capturas y fallas con alertas priorizadas para operar sin demoras.',
  },
];

const itemsComienzo = [
  {
    icono: BellRing,
    titulo: 'Doble notificación',
    texto:
      'Cliente y proveedor confirman desde la plataforma cuando el trabajo empieza. Cada parte notifica una vez y ambas ven el mismo registro.',
  },
  {
    icono: CalendarClock,
    titulo: 'Inicio efectivo',
    texto:
      'El servicio comienza con la segunda notificación: esa fecha queda guardada y arranca el conteo del anticipo.',
  },
  {
    icono: Hourglass,
    titulo: '72 horas calendario',
    texto:
      'Pasadas 72 horas desde el inicio efectivo, el 30% del presupuesto se libera automáticamente al proveedor.',
  },
  {
    icono: Landmark,
    titulo: 'Horario bancario hábil',
    texto:
      'La liberación ocurre solo en horario hábil (lunes a viernes de 8 a 20 y sábados de 9 a 13, hora Argentina): fuera de ese horario se ejecuta en la siguiente ventana.',
  },
  {
    icono: Wallet,
    titulo: 'Panel del proveedor',
    texto:
      'El proveedor ve el anticipo estimado, la fecha de liberación y los montos bruto, comisión y neto, sin cálculos manuales.',
  },
  {
    icono: Timer,
    titulo: 'Panel admin',
    texto:
      'Métricas de notificaciones, anticipos liberados y pendientes, estado del cron y alertas de casos demorados.',
  },
];

const novedadesCards = [
  {
    titulo: 'Anticipo del 30% para servicios largos',
    texto: 'La landing completa del nuevo modelo, con beneficios y preguntas frecuentes.',
    href: '/novedades/anticipo-30',
    icono: Percent,
  },
  {
    titulo: 'Guía del comienzo del servicio',
    texto: 'Cómo notificar el inicio, qué es el inicio efectivo y cómo se libera el anticipo.',
    href: '/ayuda/comienzo-del-servicio',
    icono: BellRing,
  },
  {
    titulo: 'Retención y liberación de pagos',
    texto: 'Todo sobre custodia, conformidad manual y automática, retenciones y plazos.',
    href: '/ayuda/retencion-liberacion',
    icono: Lock,
  },
  {
    titulo: 'Panel admin de Mercado Pago',
    texto: 'Estado del marketplace, tokens, capturas y alertas (para administradores).',
    href: '/dashboard/admin/mercado-pago',
    icono: LayoutDashboard,
  },
  {
    titulo: 'Panel admin de inicio del servicio',
    texto: 'Notificaciones, anticipos y métricas del nuevo flujo (para administradores).',
    href: '/dashboard/admin/inicio-servicio',
    icono: Timer,
  },
];

const FAQ_REGEX = /retenci[oó]n|liberaci[oó]n|conformidad|hito|reclamo|disputa/i;

function filtrarFaqsPagos(faqs: Faq[]): Faq[] {
  return faqs
    .filter((f) => FAQ_REGEX.test(`${f.pregunta} ${f.respuesta}`))
    .slice(0, 8);
}

export default function CambiosPlataformaLanding() {
  const user = useAuthStore((s) => s.user);
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [cargandoFaqs, setCargandoFaqs] = useState(true);
  const [faqAbierta, setFaqAbierta] = useState<number | null>(null);

  const esSuperAdmin = (user?.usuario_roles || []).some(
    (ur) => ur.activo && ur.rol?.nombre === 'super_admin',
  );

  useEffect(() => {
    const cargarFaqs = async () => {
      try {
        const res = await api.get('/centro-ayuda');
        const raw = extractData<Faq[] | { data?: Faq[] }>(res);
        const lista = Array.isArray(raw) ? raw : raw.data || [];
        setFaqs(filtrarFaqsPagos(lista));
      } catch {
        setFaqs([]);
      } finally {
        setCargandoFaqs(false);
      }
    };
    cargarFaqs();
  }, []);

  return (
    <div className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 border-b border-slate-800">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden="true" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-3 py-1 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Novedades
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Qué cambió en <span className="text-cyan-400">la plataforma</span>
          </h1>
          <p className="text-lg text-slate-400 mt-4 max-w-2xl mx-auto">
            Todas las mejoras recientes en un solo lugar.
          </p>
        </div>
      </section>

      {/* Pagos y seguridad */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-3xl font-bold text-white">
          Pagos y seguridad
        </h2>
        <p className="text-slate-400 mt-2 max-w-3xl">
          Custodia con reglas claras: el dinero solo se mueve cuando corresponde
          y todo queda trazado.
        </p>
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {pagosSeguridad.map(({ icono: Icono, titulo, texto }) => (
            <Card key={titulo}>
              <div className="p-6">
                <Icono className="w-6 h-6 text-cyan-400 mb-4" />
                <h3 className="font-bold text-white">{titulo}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {texto}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* FAQ de pagos */}
        <div className="mt-10 max-w-3xl">
          <h3 className="text-xl font-bold text-white">
            Preguntas frecuentes de pagos
          </h3>
          <div className="mt-4 space-y-3" data-testid="faq-pagos">
            {cargandoFaqs &&
              [1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            {!cargandoFaqs && faqs.length === 0 && (
              <p className="text-sm text-slate-400 py-4">
                Visitá el{' '}
                <Link href="/ayuda" className="text-cyan-400 hover:text-cyan-300">
                  Centro de Ayuda
                </Link>{' '}
                para ver todas las preguntas sobre pagos.
              </p>
            )}
            {!cargandoFaqs &&
              faqs.map((faq) => (
                <Card key={faq.id_faq}>
                  <button
                    onClick={() =>
                      setFaqAbierta(faqAbierta === faq.id_faq ? null : faq.id_faq)
                    }
                    className="w-full flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-white pr-4">
                      {faq.pregunta}
                    </span>
                    {faqAbierta === faq.id_faq ? (
                      <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {faqAbierta === faq.id_faq && (
                    <p className="mt-4 pt-4 border-t border-slate-700/50 text-sm text-slate-300 leading-relaxed">
                      {faq.respuesta}
                    </p>
                  )}
                </Card>
              ))}
          </div>
        </div>
      </section>

      {/* Marketplace */}
      <section className="bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-3xl font-bold text-white">Marketplace</h2>
          <p className="text-slate-400 mt-2 max-w-3xl">
            Cobros con la cuenta de Mercado Pago del proveedor, con toda la
            operación monitoreada.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {itemsMarketplace.map(({ icono: Icono, titulo, texto }) => (
              <Card key={titulo}>
                <div className="p-6">
                  <Icono className="w-6 h-6 text-cyan-400 mb-4" />
                  <h3 className="font-bold text-white">{titulo}</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    {texto}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comienzo del servicio + anticipo del 30% */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <h2 className="text-3xl font-bold text-white">
          Comienzo del servicio + anticipo del 30%
        </h2>
        <p className="text-slate-400 mt-2 max-w-3xl">
          El nuevo flujo, paso por paso: de la doble confirmación a la
          liberación automática.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {itemsComienzo.map(({ icono: Icono, titulo, texto }) => (
            <Card key={titulo}>
              <div className="p-6">
                <Icono className="w-6 h-6 text-cyan-400 mb-4" />
                <h3 className="font-bold text-white">{titulo}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  {texto}
                </p>
              </div>
            </Card>
          ))}
        </div>
        <p className="text-center text-sm mt-8">
          <Link
            href="/ayuda/comienzo-del-servicio"
            className="text-cyan-400 hover:text-cyan-300"
          >
            Ver la guía completa del comienzo del servicio
          </Link>
        </p>
      </section>

      {/* Novedades recientes */}
      <section className="bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h2 className="text-3xl font-bold text-white">Novedades recientes</h2>
          <p className="text-slate-400 mt-2">
            Accesos directos a todo lo que se lanzó.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {novedadesCards.map(({ icono: Icono, titulo, texto, href }) => (
              <Link key={href} href={href} className="group">
                <Card className="h-full transition-colors group-hover:border-cyan-500/40">
                  <div className="p-6 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <Icono className="w-6 h-6 text-cyan-400" />
                      <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                    <h3 className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {titulo}
                    </h3>
                    <p className="text-sm text-slate-400 mt-2 leading-relaxed flex-1">
                      {texto}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-3xl font-bold text-white">
          Viví el nuevo modelo desde tu dashboard
        </h2>
        <p className="text-slate-400 mt-2">
          Revisá tus transacciones, conectá tu cuenta o mirá las métricas del
          lanzamiento.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard/transacciones">
            <Button size="lg">
              Ver mis transacciones
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/dashboard/mercado-pago">
            <Button size="lg" variant="outline">
              Conectar Mercado Pago
            </Button>
          </Link>
          {esSuperAdmin && (
            <Link href="/dashboard/admin">
              <Button size="lg" variant="outline">
                Ir al panel admin
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
