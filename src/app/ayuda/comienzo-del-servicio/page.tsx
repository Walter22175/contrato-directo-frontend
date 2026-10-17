'use client';

import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import {
  Handshake,
  User,
  HardHat,
  HelpCircle,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  PlayCircle,
  Scale,
  Percent,
  Wallet,
} from 'lucide-react';

const condicionesLegales = [
  {
    icono: Scale,
    titulo: 'Comienzo notificado',
    puntos: [
      'El comienzo del servicio debe ser notificado por ambas partes (cliente y proveedor) desde la plataforma.',
      'El inicio efectivo es la fecha y hora de la segunda notificación, es decir, la más tardía de las dos. Hasta que ambas partes no notifiquen, el servicio no se considera iniciado a los efectos de la liberación anticipada.',
      'La plataforma nunca libera dinero antes de que ambas partes notifiquen el comienzo: no existe liberación unilateral ni automática del anticipo sin la coincidencia de ambas notificaciones.',
      'Si una parte no responde a la notificación de la otra, el administrador de la plataforma puede forzar el inicio únicamente cuando exista evidencia del comienzo real del trabajo. El inicio forzado se registra en la transacción con su fecha, hora y causa.',
    ],
  },
  {
    icono: Percent,
    titulo: 'Liberación anticipada del 30%',
    puntos: [
      'Cumplidas las 72 horas calendario desde el inicio efectivo del servicio, la plataforma libera anticipadamente el 30% del monto total al proveedor, exclusivamente en horario bancario hábil.',
      'Sobre el monto anticipado se aplica la comisión habitual del 8%, en las mismas condiciones que el resto del pago.',
      'Toda liberación anticipada se registra con fecha y hora en la transacción, con trazabilidad para ambas partes.',
      'La liberación anticipada no afecta los derechos del cliente: el 70% restante permanece en custodia hasta la conformidad del cliente o su conformidad automática, y el cliente conserva íntegramente su derecho a rechazo, reclamo y reembolso sobre el monto no liberado.',
      'La liberación anticipada no modifica ni reemplaza el resto del flujo de pagos: conformidad, plazos, hitos y cancelaciones se rigen por las condiciones generales de la plataforma.',
    ],
  },
  {
    icono: Wallet,
    titulo: 'Resto del pago',
    puntos: [
      'El 70% restante se libera conforme al flujo ordinario: con la conformidad manual del cliente se libera dentro de las 24 horas hábiles siguientes; ante falta de respuesta, la conformidad se presume automática a las 72 horas hábiles desde que el proveedor marcó la entrega realizada y el pago se libera en ese término.',
      'Para evitar sobre-liberaciones, de liberarse el resto del pago se descuenta el monto ya anticipado: la suma de lo anticipado y lo liberado ordinariamente nunca puede superar el 100% del monto total.',
      'Las contrataciones organizadas por hitos quedan excluidas de la liberación anticipada del 30%: en esos casos se mantiene el flujo de liberación hito a hito según la conformidad de cada etapa.',
    ],
  },
];

const secciones = [
  {
    icono: User,
    titulo: 'Tu rol como cliente',
    puntos: [
      'Notificar el inicio confirma que el proveedor comenzó el trabajo.',
      'Si no notificás, el sistema te enviará recordatorios por email y en la plataforma.',
      'Si el proveedor notifica y el servicio no empezó, podés rechazarlo desde la transacción.',
      'La liberación anticipada del 30% no te quita derechos: el resto del pago queda retenido hasta tu conformidad.',
    ],
  },
  {
    icono: HardHat,
    titulo: 'Tu rol como proveedor',
    puntos: [
      'Notificar el inicio habilita la liberación anticipada del 30% del pago.',
      'Si el cliente no notifica, el sistema le envía recordatorios.',
      'Solo aplica a servicios de más de 3 días: si el servicio dura menos, no hay anticipo.',
      'La conformidad y la liberación del resto del pago siguen funcionando igual.',
    ],
  },
  {
    icono: HelpCircle,
    titulo: '¿Por qué existe este anticipo?',
    puntos: [
      'Para servicios largos (más de 3 días), donde el proveedor avanza sin cobrar nada.',
      'Mejora el flujo de caja del proveedor sin esperar al final del trabajo.',
      'Protege al cliente: el 30% solo se libera cuando ambas partes confirman el comienzo.',
      'Evita liberaciones prematuras: nunca se libera de forma unilateral.',
    ],
  },
  {
    icono: AlertCircle,
    titulo: '¿Qué pasa si no notifico?',
    puntos: [
      'El servicio no se considera iniciado.',
      'No se libera el 30% anticipado.',
      'El administrador puede forzar el inicio si hay evidencia del comienzo real del trabajo.',
      'El flujo normal (conformidad y liberación del 100%) sigue funcionando sin cambios.',
    ],
  },
];

export default function ComienzoDelServicioPage() {
  return (
    <main className="flex-1">
      <div className="bg-slate-900/50 border-b border-slate-800 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
            <Link href="/ayuda" className="hover:text-cyan-400 transition-colors">
              Ayuda
            </Link>
            <span>/</span>
            <span className="text-white">Comienzo del servicio</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
              <Handshake className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Comienzo del servicio y anticipo del 30%
              </h1>
              <p className="text-slate-400 mt-1">
                Cómo se notifica el inicio y cómo funciona la liberación
                anticipada
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <PlayCircle className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">
                  ¿Cómo funciona el comienzo del servicio?
                </h2>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Cliente y proveedor notifican cuando el trabajo empieza. El
                inicio efectivo es la <strong>segunda notificación</strong> (la
                más tardía de las dos).
              </p>
              <p className="text-sm text-slate-300 leading-relaxed mt-3">
                A las <strong>72 horas calendario</strong> desde ese inicio, se
                libera automáticamente el <strong>30%</strong> del pago al
                proveedor, siempre en <strong>horario bancario hábil</strong>.
              </p>
              <p className="text-sm text-slate-300 leading-relaxed mt-3">
                El resto del pago sigue el flujo normal: se libera con tu
                conformidad o 72 horas hábiles después, como siempre.
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white">
                  Cuando ambas partes notificaron
                </h2>
              </div>
              <ul className="space-y-3 text-sm text-slate-300 list-disc list-inside">
                <li>
                  Inicio efectivo: la fecha de la <strong>segunda
                  notificación</strong> (la más tardía).
                </li>
                <li>
                  Fecha estimada de liberación del 30%:{' '}
                  <strong>72 horas calendario</strong> después del inicio,
                  en horario bancario hábil.
                </li>
                <li>
                  <strong>
                    El 30% se liberará automáticamente en horario bancario
                    hábil.
                  </strong>{' '}
                  El resto del pago se libera con tu conformidad o 72 horas
                  hábiles después.
                </li>
              </ul>
            </div>
          </Card>

          {secciones.map(({ icono: Icono, titulo, puntos }) => (
            <Card key={titulo}>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icono className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold text-white">{titulo}</h2>
                </div>
                <ul className="space-y-3 text-sm text-slate-300 list-disc list-inside">
                  {puntos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}

          <p className="text-sm text-slate-400 leading-relaxed">
            Los siguientes términos describen el funcionamiento del comienzo
            notificado y de la liberación anticipada del 30% de Contrato
            Directo y se aplican a toda contratación realizada a través de la
            plataforma, complementando los Términos y Condiciones y la Política
            de Privacidad.
          </p>

          {condicionesLegales.map(({ icono: Icono, titulo, puntos }) => (
            <Card key={titulo}>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icono className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold text-white">{titulo}</h2>
                </div>
                <ul className="space-y-3 text-sm text-slate-300 list-disc list-inside">
                  {puntos.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}

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
