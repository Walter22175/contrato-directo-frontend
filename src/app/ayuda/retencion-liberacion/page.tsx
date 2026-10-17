'use client';

import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import {
  Lock,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { useConfigPublica } from '@/hooks/useConfigPublica';

const secciones = [
  {
    icono: Lock,
    titulo: 'Retención del pago',
    puntos: [
      'La plataforma retiene el pago hasta que el cliente confirma la entrega del trabajo realizado.',
      'La retención es temporal y automática: comienza al momento del pago y finaliza sola cuando se cumple la conformidad o el plazo de liberación.',
      'El proveedor mantiene la titularidad del pago durante toda la retención: el importe retenido le corresponde por el trabajo ya realizado.',
      'La plataforma no puede disponer del dinero: los fondos retenidos no integran patrimonio de Contrato Directo ni pueden ser utilizados ni ejecutados por la plataforma.',
    ],
  },
  {
    icono: CheckCircle,
    titulo: 'Liberación manual',
    puntos: [
      'Cuando el cliente confirma la entrega, se libera el pago al proveedor.',
      'La liberación es inmediata y definitiva: una vez confirmada la conformidad, el pago no puede volver a quedar retenido por esa contratación.',
      'Se registra la fecha y hora de la liberación en la transacción, con trazabilidad para ambas partes.',
      'La acreditación en la cuenta del proveedor se realiza dentro de las 24 horas hábiles siguientes, menos la comisión acordada ({COMISION}%).',
    ],
  },
  {
    icono: Clock,
    titulo: 'Liberación automática (72 hs hábiles)',
    puntos: [
      'Si el cliente no responde dentro del plazo, el sistema libera el pago automáticamente, sin necesidad de gestión manual.',
      'Las horas hábiles se calculan según el calendario de feriados oficiales y los horarios operativos de la plataforma: solo corren días hábiles (lunes a viernes dentro del horario operativo), sin contar sábados, domingos ni feriados.',
      'El proveedor debe haber marcado "entrega realizada" para que el plazo comience a correr; sin ese registro no se genera liberación automática.',
      'La liberación automática genera el mismo registro de fecha y hora que la liberación manual.',
    ],
  },
  {
    icono: XCircle,
    titulo: 'Cancelación',
    puntos: [
      'El cliente puede rechazar la entrega dentro del plazo de conformidad, indicando el motivo del rechazo.',
      'El pago se cancela y se devuelve íntegramente al cliente por el mismo medio de pago utilizado.',
      'Se registran la causa y la fecha de la cancelación en la transacción.',
      'Si hay una disputa sobre el rechazo, el monto queda retenido hasta la resolución de mediación; la cancelación se aplica al resolverse la controversia.',
    ],
  },
];

export default function RetencionLiberacionPage() {
  const { comision_porcentaje } = useConfigPublica();
  return (
    <main className="flex-1">
      <div className="bg-slate-900/50 border-b border-slate-800 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-3 text-sm text-slate-400 mb-4">
            <Link href="/ayuda" className="hover:text-cyan-400 transition-colors">
              Ayuda
            </Link>
            <span>/</span>
            <span className="text-white">Retención y Liberación</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Retención, Liberación y Cancelación
              </h1>
              <p className="text-slate-400 mt-1">
                Condiciones aplicables al sistema de pagos con custodia
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-6">
          <p className="text-sm text-slate-400 leading-relaxed">
            Los siguientes términos describen el funcionamiento del sistema de
            pagos con custodia (escrow) de Contrato Directo y se aplican a toda
            contratación realizada a través de la plataforma, complementando los
            Términos y Condiciones y la Política de Privacidad.
          </p>

          {secciones.map(({ icono: Icono, titulo, puntos }) => (
            <Card key={titulo}>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Icono className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xl font-bold text-white">{titulo}</h2>
                </div>
                <ul className="space-y-3 text-sm text-slate-300 list-disc list-inside">
                  {puntos.map((p) => (
                    <li key={p}>
                      {p.replace('{COMISION}', String(comision_porcentaje))}
                    </li>
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
