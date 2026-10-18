'use client';

import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import {
  Megaphone,
  Settings,
  ShieldCheck,
  MousePointerClick,
  ArrowLeft,
  Eye,
  SlidersHorizontal,
  FileCheck,
  Ban,
  ExternalLink,
  Handshake,
} from 'lucide-react';

const pasosFuncionamiento = [
  'Cliente y proveedor notifican el comienzo del servicio desde la plataforma.',
  'El inicio efectivo es la segunda notificación, la más tardía de las dos.',
  'A las 72 horas calendario desde ese inicio, se libera al proveedor el 30% del presupuesto.',
  'El resto del pago (el 70%) sigue retenido hasta tu conformidad.',
];

const beneficios = [
  {
    icono: Eye,
    titulo: 'Mayor transparencia',
    texto: 'El inicio del servicio queda registrado con fecha y hora, visible para ambas partes.',
  },
  {
    icono: SlidersHorizontal,
    titulo: 'Mayor control',
    texto: 'El servicio solo se considera iniciado cuando ambas partes lo confirman.',
  },
  {
    icono: FileCheck,
    titulo: 'Tus derechos se conservan',
    texto: 'El anticipo no afecta tus derechos: el 70% sigue retenido hasta tu conformidad y conservás íntegros tus derechos de rechazo, reclamo y reembolso.',
  },
  {
    icono: Ban,
    titulo: 'Podés rechazar',
    texto: 'Si el proveedor notifica el inicio sin haber comenzado el trabajo, podés rechazarlo desde la transacción.',
  },
];

const pasosAccion = [
  {
    texto: 'Cuando veas que el trabajo empieza, notificá el inicio desde la transacción.',
    href: '/dashboard/transacciones',
  },
  {
    texto: 'Seguí el estado en Mis Transacciones.',
    href: '/dashboard/transacciones',
  },
  {
    texto: 'Consultá la guía completa del comienzo del servicio.',
    href: '/ayuda/comienzo-del-servicio',
  },
];

export default function NovedadComienzoServicioPage() {
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
            <span className="text-white">Comienzo del servicio</span>
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
                Nuevo sistema de confirmación del comienzo del servicio
              </h1>
              <p className="text-slate-400 mt-1">
                Más control y transparencia sobre cuándo empieza realmente el
                trabajo
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
                Queremos que cada contratación arranque con los pies en la
                tierra: ahora el comienzo del servicio se{' '}
                <strong>confirma desde la plataforma, por ambas partes</strong>
                . Es simple, rápido y te da más control y transparencia sobre
                cuándo empieza realmente el trabajo.
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
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">
                  B. Beneficios para vos como cliente
                </h2>
              </div>
              <ul className="space-y-4">
                {beneficios.map(({ icono: Icono, titulo, texto }) => (
                  <li key={titulo} className="flex items-start gap-3">
                    <Icono className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {titulo}
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {texto}
                      </p>
                    </div>
                  </li>
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
                <Handshake className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">
                  Tu tranquilidad es la prioridad
                </h2>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Este cambio no modifica tus garantías: el pago sigue en
                custodia, el 70% permanece retenido hasta tu conformidad y
                conservás íntegramente tu derecho a rechazo, reclamo y
                reembolso. Solo hacemos explícito y trazable el momento en que
                el servicio comienza.
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/ayuda/comienzo-del-servicio"
                  className="inline-flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Ver la guía de ayuda
                </Link>
                <Link
                  href="/dashboard/transacciones"
                  className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium px-4 py-2 rounded-lg border border-slate-700 transition-colors"
                >
                  Ir a Mis Transacciones
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
