'use client';

import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip, Semaforo } from './Semaforo';
import { fmtNum } from '@/lib/control-total';
import type {
  AlertaEmail,
  BucketTendenciaEmail,
  InteligenciaEmail,
  PuntoTendenciaEmail,
  RangoEmail,
  SeveridadAlertaEmail,
} from '@/lib/control-total';
import { AlertTriangle, TrendingUp } from 'lucide-react';

const RANGOS: Array<{ id: RangoEmail; label: string }> = [
  { id: '24h', label: '24 h' },
  { id: '7d', label: '7 días' },
  { id: '30d', label: '30 días' },
  { id: '90d', label: '90 días' },
];

const TONO_ALERTA: Record<SeveridadAlertaEmail, 'red' | 'yellow' | 'slate'> = {
  alta: 'red',
  media: 'yellow',
  baja: 'slate',
};

type ClaveSerie = 'tasa_apertura' | 'tasa_click' | 'tasa_rebote';

const SERIES: Array<{ key: ClaveSerie; label: string; color: string }> = [
  { key: 'tasa_apertura', label: 'Open Rate', color: '#22d3ee' },
  { key: 'tasa_click', label: 'Click Rate', color: '#34d399' },
  { key: 'tasa_rebote', label: 'Bounce Rate', color: '#f87171' },
];

function fmtPct(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return '—';
  return `${valor.toLocaleString('es-AR', { maximumFractionDigits: 2 })}%`;
}

function colorEntrega(valor: number): string {
  if (valor >= 98) return 'text-emerald-300';
  if (valor >= 95) return 'text-yellow-300';
  return 'text-red-400';
}

function colorRebote(valor: number): string {
  if (valor <= 1) return 'text-emerald-300';
  if (valor <= 5) return 'text-yellow-300';
  return 'text-red-400';
}

function colorQueja(valor: number): string {
  return valor <= 0.1 ? 'text-emerald-300' : 'text-red-400';
}

function colorApertura(valor: number): string {
  if (valor >= 20) return 'text-emerald-300';
  if (valor >= 10) return 'text-yellow-300';
  return 'text-red-400';
}

function fmtBucket(fecha: string, bucket: BucketTendenciaEmail): string {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  return bucket === 'hour'
    ? d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
      })
    : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function TendenciaChart({
  puntos,
  bucket,
}: {
  puntos: PuntoTendenciaEmail[];
  bucket: BucketTendenciaEmail;
}) {
  if (!puntos.length) {
    return <p className="text-sm text-slate-500">Sin datos en el período.</p>;
  }

  const ancho = 640;
  const alto = 190;
  const margenX = 30;
  const margenY = 20;
  const maximo = Math.ceil(
    Math.max(
      100,
      ...puntos.flatMap((punto) => [
        punto.tasa_apertura,
        punto.tasa_click,
        punto.tasa_rebote,
      ]),
    ) / 25,
  ) * 25;
  const x = (indice: number) =>
    margenX +
    (indice * (ancho - margenX * 2)) / Math.max(puntos.length - 1, 1);
  const y = (valor: number) =>
    alto - margenY - (Math.min(valor, maximo) / maximo) * (alto - margenY * 2);
  const lineas = SERIES.map((serie) => ({
    ...serie,
    d: puntos
      .map(
        (punto, indice) =>
          `${indice === 0 ? 'M' : 'L'} ${x(indice).toFixed(2)} ${y(
            punto[serie.key],
          ).toFixed(2)}`,
      )
      .join(' '),
  }));
  const guias: number[] = [];
  for (let valor = 0; valor <= maximo; valor += 25) guias.push(valor);
  const indicesEtiqueta = [
    ...new Set([0, Math.floor((puntos.length - 1) / 2), puntos.length - 1]),
  ];

  return (
    <div>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="w-full h-48"
        role="img"
        aria-label="Tendencia de entregabilidad de email"
      >
        {guias.map((valor) => (
          <g key={valor}>
            <line
              x1={margenX}
              x2={ancho - margenX}
              y1={y(valor)}
              y2={y(valor)}
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
            <text x={4} y={y(valor) + 3} fill="#64748b" fontSize="9">
              {valor}%
            </text>
          </g>
        ))}

        {lineas.map((linea) => (
          <path
            key={linea.key}
            d={linea.d}
            fill="none"
            stroke={linea.color}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {puntos.length <= 31 &&
          lineas.flatMap((linea) =>
            puntos.map((punto, indice) => (
              <circle
                key={`${linea.key}-${punto.fecha}`}
                cx={x(indice)}
                cy={y(punto[linea.key])}
                r="2"
                fill={linea.color}
              />
            )),
          )}

        {indicesEtiqueta.map((indice) => (
          <text
            key={indice}
            x={x(indice)}
            y={alto - 4}
            fill="#64748b"
            fontSize="9"
            textAnchor={
              indice === 0
                ? 'start'
                : indice === puntos.length - 1
                  ? 'end'
                  : 'middle'
            }
          >
            {fmtBucket(puntos[indice].fecha, bucket)}
          </text>
        ))}
      </svg>

      <div className="flex flex-wrap gap-3 mt-1">
        {SERIES.map((serie) => (
          <span
            key={serie.key}
            className="text-[10px] text-slate-400 inline-flex items-center gap-1"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: serie.color }}
            />
            {serie.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TarjetaMetrica({
  label,
  valor,
  color,
  detalle,
}: {
  label: string;
  valor: string;
  color: string;
  detalle?: string;
}) {
  return (
    <div className="bg-slate-900/40 rounded-lg p-3">
      <p className="text-[10px] text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{valor}</p>
      {detalle && <p className="text-[10px] text-slate-500 mt-1">{detalle}</p>}
    </div>
  );
}

function AlertasEmail({ alertas }: { alertas: AlertaEmail[] }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3 className="font-medium text-white text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          Alertas automáticas
        </h3>
        <Chip tono={alertas.length ? 'red' : 'emerald'}>
          {alertas.length ? `${alertas.length} activas` : 'sin alertas'}
        </Chip>
      </div>

      {alertas.length === 0 ? (
        <p className="text-sm text-slate-500">
          Sin alertas: rebote ≤ 5%, quejas ≤ 0.1% y Open Rate ≥ 20%.
        </p>
      ) : (
        <ul className="space-y-2">
          {alertas.map((alerta) => (
            <li
              key={alerta.codigo}
              className="rounded-lg border border-slate-800 bg-slate-900/40 p-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Chip tono={TONO_ALERTA[alerta.severidad]}>
                  {alerta.severidad}
                </Chip>
                <span className="text-sm text-slate-200">{alerta.titulo}</span>
                <span className="text-xs text-slate-500 ml-auto">
                  {fmtPct(alerta.valor)} {alerta.operador} {fmtPct(alerta.limite)}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{alerta.detalle}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function InteligenciaEmailSeccion({
  inteligencia,
  rango,
  onRangoChange,
}: {
  inteligencia: InteligenciaEmail;
  rango: RangoEmail;
  onRangoChange: (rango: RangoEmail) => void;
}) {
  const { resumen, tendencia, bucket, alertas } = inteligencia;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="font-medium text-white text-sm">Reputación</h3>
          <Semaforo valor={resumen.semaforo} label={`Email: ${resumen.semaforo}`} />
          <Chip tono="slate">{RANGOS.find((r) => r.id === rango)?.label}</Chip>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <TarjetaMetrica
            label="Delivery Rate"
            valor={fmtPct(resumen.tasa_entrega)}
            color={colorEntrega(resumen.tasa_entrega)}
            detalle={`${fmtNum(resumen.entregados)} entregados`}
          />
          <TarjetaMetrica
            label="Bounce Rate"
            valor={fmtPct(resumen.tasa_rebote)}
            color={colorRebote(resumen.tasa_rebote)}
            detalle={`${fmtNum(resumen.rebotes)} rebotes`}
          />
          <TarjetaMetrica
            label="Complaint Rate"
            valor={fmtPct(resumen.tasa_queja)}
            color={colorQueja(resumen.tasa_queja)}
            detalle={`${fmtNum(resumen.quejas)} quejas`}
          />
          <TarjetaMetrica
            label="Open Rate"
            valor={fmtPct(resumen.tasa_apertura)}
            color={colorApertura(resumen.tasa_apertura)}
            detalle={`${fmtNum(resumen.aperturas)} aperturas`}
          />
          <TarjetaMetrica
            label="CTR"
            valor={fmtPct(resumen.ctr)}
            color={resumen.ctr > 0 ? 'text-emerald-300' : 'text-slate-100'}
            detalle={`${fmtNum(resumen.clicks)} clicks`}
          />
        </div>

        <p className="text-[11px] text-slate-500 mt-4">
          Umbrales: rebote &gt; 5%, quejas &gt; 0.1% y Open Rate &lt; 20%.
          Las tasas de apertura y click usan entregados como denominador; el
          CTR usa aperturas.
        </p>
      </Card>

      <Card>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h3 className="font-medium text-white text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Tendencias
          </h3>
          <div className="ml-auto flex flex-wrap gap-1">
            {RANGOS.map((opcion) => (
              <Button
                key={opcion.id}
                variant={opcion.id === rango ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => onRangoChange(opcion.id)}
              >
                {opcion.label}
              </Button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-2">
          {fmtNum(resumen.enviados)} envíos, {fmtNum(resumen.entregados)}{' '}
          entregados y {fmtNum(resumen.aperturas)} aperturas en el período.
        </p>

        <TendenciaChart puntos={tendencia} bucket={bucket} />

        <p className="text-[11px] text-slate-500 mt-2">
          Agrupación {bucket === 'hour' ? 'por hora' : 'por día'}. Las tasas son
          eventos del período, no destinatarios únicos.
        </p>
      </Card>

      <AlertasEmail alertas={alertas} />
    </div>
  );
}
