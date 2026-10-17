'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { obtenerMetricasInicioServicio } from '@/lib/mercadopago';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  Handshake,
  RefreshCw,
  Download,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  CalendarClock,
} from 'lucide-react';
import type { MetricasInicioServicio } from '@/types';

const saludConfig: Record<
  MetricasInicioServicio['salud'],
  { label: string; chip: string; icono: typeof ShieldCheck }
> = {
  saludable: {
    label: 'Saludable',
    chip: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    icono: ShieldCheck,
  },
  atencion: {
    label: 'Requiere atención',
    chip: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    icono: ShieldAlert,
  },
  critico: {
    label: 'Crítico',
    chip: 'text-red-400 bg-red-500/10 border-red-500/20',
    icono: ShieldX,
  },
};

function Kpi({
  titulo,
  valor,
  meta,
  acento = 'text-white',
}: {
  titulo: string;
  valor: string;
  meta?: string;
  acento?: string;
}) {
  return (
    <div className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-4">
      <p className="text-xs text-slate-400">{titulo}</p>
      <p className={`text-xl font-bold mt-1 ${acento}`}>{valor}</p>
      {meta && <p className="text-xs text-slate-500 mt-1">{meta}</p>}
    </div>
  );
}

function DonutInicio({
  m,
}: {
  m: MetricasInicioServicio;
}) {
  const segmentos = [
    {
      label: 'Una sola notificación',
      valor: m.inicio_servicio.solo_notificacion,
      color: '#facc15',
    },
    {
      label: 'Ambas confirmaron',
      valor: m.inicio_servicio.ambas_notificaciones,
      color: '#22d3ee',
    },
    {
      label: 'Forzadas por admin',
      valor: m.inicio_servicio.inicio_forzado,
      color: '#fb923c',
    },
  ];
  const total = segmentos.reduce((a, s) => a + s.valor, 0) || 1;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" className="w-32 h-32 shrink-0">
        {segmentos.map((s) => {
          const frac = s.valor / total;
          const dash = frac * 314;
          const el = (
            <circle
              key={s.label}
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke={s.color}
              strokeWidth="16"
              strokeDasharray={`${dash} ${314 - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            >
              <title>{`${s.label}: ${s.valor}`}</title>
            </circle>
          );
          offset += dash;
          return el;
        })}
        <text
          x="60"
          y="65"
          textAnchor="middle"
          className="fill-white text-lg font-bold"
        >
          {total === 1 && segmentos.every((s) => s.valor === 0) ? '—' : total}
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {segmentos.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-slate-300">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: s.color }}
            />
            {s.label}: <strong className="text-white">{s.valor}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarrasCron({
  cron,
}: {
  cron: MetricasInicioServicio['cron'];
}) {
  const filas = [
    { label: 'Candidatas ahora', valor: cron.candidatas, color: 'bg-cyan-500' },
    { label: 'Liberadas (24 h)', valor: cron.liberadas, color: 'bg-emerald-500' },
    { label: 'Excluidas por hitos', valor: cron.excluidas_hitos, color: 'bg-yellow-500' },
    {
      label: 'Excluidas por retención',
      valor: cron.excluidas_retencion,
      color: 'bg-orange-500',
    },
  ];
  const max = Math.max(...filas.map((f) => f.valor), 1);

  return (
    <div className="space-y-3">
      {filas.map((f) => (
        <div key={f.label}>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>{f.label}</span>
            <span className="text-white font-medium">{f.valor}</span>
          </div>
          <div className="h-2 rounded bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded ${f.color}`}
              style={{ width: `${(f.valor / max) * 100}%` }}
              title={String(f.valor)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaAlertas({
  titulo,
  items,
  color,
  icono: Icono,
}: {
  titulo: string;
  items: MetricasInicioServicio['alertas'][keyof MetricasInicioServicio['alertas']];
  color: string;
  icono: typeof AlertTriangle;
}) {
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Icono className={`w-4 h-4 ${color}`} />
          <h3 className="text-sm font-semibold text-white">
            {titulo} ({items.length})
          </h3>
        </div>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Sin novedades.</p>
        ) : (
          <ul className="space-y-2">
            {items.slice(0, 10).map((a) => (
              <li key={a.id_transaccion} className="text-sm text-slate-300">
                <span className="text-xs font-mono text-slate-500">
                  {a.id_transaccion.slice(0, 8)}
                </span>{' '}
                — {a.detalle}
              </li>
            ))}
            {items.length > 10 && (
              <li className="text-xs text-slate-500">
                …y {items.length - 10} más.
              </li>
            )}
          </ul>
        )}
      </div>
    </Card>
  );
}

function aCsv(m: MetricasInicioServicio): string {
  const filas: Array<[string, string | number]> = [
    ['generado_en', m.generado_en],
    ['salud', m.salud],
    ['inicio/solo_notificacion', m.inicio_servicio.solo_notificacion],
    ['inicio/ambas_notificaciones', m.inicio_servicio.ambas_notificaciones],
    ['inicio/inicio_forzado', m.inicio_servicio.inicio_forzado],
    [
      'inicio/promedio_horas',
      m.inicio_servicio.tiempo_promedio_entre_notificaciones_horas ?? '',
    ],
    ['anticipo/liberados', m.anticipo.liberados],
    ['anticipo/pendientes', m.anticipo.pendientes],
    ['anticipo/no_aplicables', m.anticipo.no_aplicables],
    ['anticipo/monto_bruto_total', m.anticipo.monto_bruto_total],
    ['anticipo/monto_neto_total', m.anticipo.monto_neto_total],
    [
      'anticipo/monto_descontado_en_liberaciones',
      m.anticipo.monto_descontado_en_liberaciones,
    ],
    ['cron/ultima_ejecucion', m.cron.ultima_ejecucion],
    ['cron/proxima_ejecucion', m.cron.proxima_ejecucion],
    ['cron/candidatas', m.cron.candidatas],
    ['cron/liberadas', m.cron.liberadas],
    ['cron/excluidas_hitos', m.cron.excluidas_hitos],
    ['cron/excluidas_retencion', m.cron.excluidas_retencion],
    ['alertas/solo_notificacion_72h', m.alertas.solo_notificacion_72h.length],
    ['alertas/demorados_por_horario', m.alertas.demorados_por_horario.length],
    ['alertas/inconsistencias', m.alertas.inconsistencias.length],
  ];
  return [
    'clave,valor',
    ...filas.map(([k, v]) => `${k},${String(v).replace('.', ',')}`),
  ].join('\n');
}

export default function InicioServicioAdminPage() {
  const [metricas, setMetricas] = useState<MetricasInicioServicio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [rangoActivo, setRangoActivo] = useState<{
    desde?: string;
    hasta?: string;
  }>({});

  const cargar = useCallback(
    async (rango: { desde?: string; hasta?: string }) => {
      setCargando(true);
      setError(null);
      try {
        const params =
          rango.desde || rango.hasta
            ? { desde: rango.desde, hasta: rango.hasta }
            : undefined;
        const datos = await obtenerMetricasInicioServicio(params);
        setMetricas(datos);
      } catch {
        setError('No se pudieron cargar las métricas del anticipo.');
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    void cargar({});
  }, [cargar]);

  const aplicarRango = () => {
    if (!desde || !hasta) return;
    const rango = {
      desde: `${desde}T00:00:00.000Z`,
      hasta: `${hasta}T23:59:59.999Z`,
    };
    setRangoActivo(rango);
    void cargar(rango);
  };

  const limpiarRango = () => {
    setDesde('');
    setHasta('');
    setRangoActivo({});
    void cargar({});
  };

  const exportarCsv = () => {
    if (!metricas) return;
    const blob = new Blob([aCsv(metricas)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `inicio-servicio-metricas-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  const cfgSalud = metricas ? saludConfig[metricas.salud] : null;
  const IconoSalud = cfgSalud?.icono ?? ShieldCheck;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Handshake className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">
            Inicio del servicio y anticipo del 30%
          </h1>
        </div>
        {cfgSalud && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${cfgSalud.chip}`}
          >
            <IconoSalud className="w-3.5 h-3.5" />
            {cfgSalud.label}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void cargar(rangoActivo)}
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Actualizar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={exportarCsv}
            disabled={!metricas}
          >
            <Download className="w-4 h-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1" htmlFor="is-desde">
              Rango de creación desde
            </label>
            <input
              id="is-desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1" htmlFor="is-hasta">
              hasta
            </label>
            <input
              id="is-hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5"
            />
          </div>
          <Button size="sm" onClick={aplicarRango} disabled={!desde || !hasta}>
            Aplicar rango
          </Button>
          <Button variant="ghost" size="sm" onClick={limpiarRango}>
            Últimos 30 días
          </Button>
        </div>
      </Card>

      {error && (
        <div
          className="text-sm rounded-lg border px-4 py-3 text-red-400 bg-red-400/10 border-red-400/20"
          role="alert"
        >
          {error}
        </div>
      )}

      {cargando && !metricas ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="p-6 space-y-3">
                <div className="h-5 w-56 bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-full bg-slate-800/70 rounded animate-pulse" />
              </div>
            </Card>
          ))}
        </div>
      ) : metricas ? (
        <>
          {/* A. Inicio del servicio */}
          <Card>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Handshake className="w-5 h-5 text-cyan-400" />
                <h2 className="font-semibold text-white">Inicio del servicio</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DonutInicio m={metricas} />
                <div className="grid grid-cols-2 gap-3 self-center">
                  <Kpi
                    titulo="Una sola notificación"
                    valor={String(metricas.inicio_servicio.solo_notificacion)}
                    acento="text-yellow-400"
                  />
                  <Kpi
                    titulo="Ambas notificaciones"
                    valor={String(metricas.inicio_servicio.ambas_notificaciones)}
                    acento="text-cyan-400"
                  />
                  <Kpi
                    titulo="Inicio forzado por admin"
                    valor={String(metricas.inicio_servicio.inicio_forzado)}
                    acento="text-orange-400"
                  />
                  <Kpi
                    titulo="Promedio entre notificaciones"
                    valor={
                      metricas.inicio_servicio
                        .tiempo_promedio_entre_notificaciones_horas != null
                        ? `${metricas.inicio_servicio.tiempo_promedio_entre_notificaciones_horas} h`
                        : '—'
                    }
                    meta="horas calendario"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* B. Anticipo del 30% */}
          <Card>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                <h2 className="font-semibold text-white">
                  Liberación anticipada del 30%
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <Kpi
                  titulo="Anticipos liberados"
                  valor={String(metricas.anticipo.liberados)}
                  acento="text-emerald-400"
                />
                <Kpi
                  titulo="Anticipos pendientes"
                  valor={String(metricas.anticipo.pendientes)}
                  acento="text-yellow-400"
                />
                <Kpi
                  titulo="No aplicables (< 3 días)"
                  valor={String(metricas.anticipo.no_aplicables)}
                  acento="text-slate-400"
                />
                <Kpi
                  titulo="Monto bruto anticipado"
                  valor={formatCurrency(metricas.anticipo.monto_bruto_total)}
                />
                <Kpi
                  titulo="Monto neto anticipado"
                  valor={formatCurrency(metricas.anticipo.monto_neto_total)}
                  acento="text-emerald-400"
                  meta="menos comisión del 8%"
                />
                <Kpi
                  titulo="Descontado en liberaciones finales"
                  valor={formatCurrency(
                    metricas.anticipo.monto_descontado_en_liberaciones,
                  )}
                  meta="evita sobre-liberación"
                />
              </div>
            </div>
          </Card>

          {/* C. Cron */}
          <Card>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-cyan-400" />
                <h2 className="font-semibold text-white">
                  Cron de anticipación
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-3 self-start">
                  <Kpi
                    titulo="Última ejecución"
                    valor={formatDateTime(metricas.cron.ultima_ejecucion)}
                    meta="cada hora"
                  />
                  <Kpi
                    titulo="Próxima ejecución"
                    valor={formatDateTime(metricas.cron.proxima_ejecucion)}
                  />
                </div>
                <BarrasCron cron={metricas.cron} />
              </div>
            </div>
          </Card>

          {/* D. Alertas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ListaAlertas
              titulo="Una sola notificación > 72 h"
              items={metricas.alertas.solo_notificacion_72h}
              color="text-yellow-400"
              icono={AlertTriangle}
            />
            <ListaAlertas
              titulo="Anticipos demorados"
              items={metricas.alertas.demorados_por_horario}
              color="text-orange-400"
              icono={CalendarClock}
            />
            <ListaAlertas
              titulo="Inconsistencias de datos"
              items={metricas.alertas.inconsistencias}
              color="text-red-400"
              icono={Info}
            />
          </div>

          <p className="text-xs text-slate-500">
            Métricas generadas el {formatDateTime(metricas.generado_en)}. El
            anticipo se libera solo en horario bancario hábil y nunca supera el
            30% del presupuesto.
          </p>
        </>
      ) : null}
    </div>
  );
}
