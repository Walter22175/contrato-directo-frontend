'use client';

import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import {
  Megaphone,
  Settings,
  ThumbsUp,
  MousePointerClick,
  ArrowLeft,
  Handshake,
  Wallet,
  ExternalLink,
} from 'lucide-react';

const pasosFuncionamiento = [
  'Cliente y proveedor notifican el comienzo del servicio desde la plataforma.',
  'El inicio efectivo es la segunda notificación, la más tardía de las dos.',
  'Pasadas 72 horas calendario desde ese inicio, se libera el 30% a la cuenta del proveedor, exclusivamente en horario bancario hábil.',
  'La liberación nunca es unilateral: si una parte no notificó el comienzo, no se libera nada.',
  'El resto del pago sigue igual: se libera con la conformidad del cliente o automáticamente a las 72 horas hábiles.',
];

const beneficios = [
  'Mejor flujo de caja: el proveedor cobra una parte mientras trabaja.',
  'Seguridad para ambas partes: sin la notificación de cliente y proveedor no hay liberación.',
  'Transparencia: cada estado queda registrado con fecha y hora en la transacción.',
  'Sobre el monto anticipado se aplica la comisión habitual, en las mismas condiciones que el resto del pago.',
  'Las contrataciones por hitos quedan fuera de este anticipo y mantienen su liberación hito a hito.',
];

const pasosAccion = [
  {
    texto: 'Cuando empieces a trabajar, notificá el comienzo del servicio desde la transacción.',
    href: '/dashboard/inicio-servicio',
  },
  {
    texto: 'Seguí el estado en el panel de inicio de servicio de tu dashboard.',
    href: '/dashboard/inicio-servicio',
  },
  {
    texto: 'Si querés que el cobro llegue directo a tu cuenta, conectá Mercado Pago.',
    href: '/dashboard/mercado-pago',
  },
];

export default function NovedadAnticipo30Page() {
  return (
    <main className="flex-1">
      <div className="bg-slate-900/50 border-b border-slate-800 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
            <Link href="/ayuda" className="hover:text-cyan-400 transition-colors">
              Ayuda
            </Link>
            <span>/</span>
            <Link href="/ayuda" className="hover:text-cyan-400 transition-colors">
              Novedades
            </Link>
            <span>/</span>
            <span className="text-white">Anticipo del 30%</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <span className="inline-block text-xs font-semibold uppercase tracking-wide bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded px-2 py-0.5 mb-1">
                Novedad
              </span>
              <h1 className="text-3xl font-bold text-white">
                Anticipo del 30% para servicios largos
              </h1>
              <p className="text-slate-400 mt-1">
                Cobrá una parte del presupuesto apenas arrancado el trabajo
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <p className="text-sm text-slate-300 leading-relaxed">
                Estrenamos una novedad pensada para los proveedores: si
                trabajás en servicios de más de 3 días, ahora podés cobrar el{' '}
                <strong>30% del presupuesto</strong> apenas pasado el comienzo
                del trabajo. Es <strong>automático</strong>,{' '}
                <strong>seguro</strong> y <strong>transparente</strong> de
                punta a punta.
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">
                  A. Cómo funciona
                </h2>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 list-disc list-inside">
                {pasosFuncionamiento.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ThumbsUp className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">
                  B. Por qué te conviene
                </h2>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 list-disc list-inside">
                {beneficios.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MousePointerClick className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">
                  C. Qué tenés que hacer
                </h2>
              </div>
              <ol className="space-y-3 text-sm text-slate-300 list-decimal list-inside">
                {pasosAccion.map((p) => (
                  <li key={p.texto}>
                    <Link
                      href={p.href}
                      className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                    >
                      {p.texto}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">
                  El resto del pago no cambia
                </h2>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                El 70% restante se libera con la conformidad del cliente o de
                forma automática a las 72 horas hábiles, igual que siempre. El
                anticipo no modifica plazos, hitos ni cancelaciones.
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Handshake className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">
                  Querés conocer los detalles
                </h2>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                En el Centro de Ayuda explicamos paso a paso el comienzo
                notificado, la liberación anticipada y las condiciones
                aplicables.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/ayuda/comienzo-del-servicio"
                  className="inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Comienzo del servicio y anticipo
                </Link>
                <Link
                  href="/dashboard/inicio-servicio"
                  className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg border border-slate-700 transition-colors"
                >
                  Ir a mi dashboard
                </Link>
                <Link
                  href="/dashboard/tickets"
                  className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg border border-slate-700 transition-colors"
                >
                  Abrir un ticket
                </Link>
              </div>
            </div>
          </Card>

          <div className="text-center">
            <Link
              href="/ayuda"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Centro de Ayuda
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
