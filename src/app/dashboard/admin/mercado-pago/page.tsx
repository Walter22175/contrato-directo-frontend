'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { obtenerMetricasMercadoPago } from '@/lib/mercadopago';
import { mensajeError } from '@/lib/api';
import type {
  AlertaCuentaMercadoPago,
  MetricasMercadoPago,
  SerieDiariaPagoMp,
} from '@/types';
import {
  Activity,
  AlertTriangle,
  CreditCard,
  Download,
  KeyRound,
  LineChart,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';

type NivelSalud = 'ok' | 'atencion' | 'critico';

const COLORES_STATUS: Record<string, string> = {
  captured: 'bg-cyan-400',
  captured_marketplace: 'bg-cyan-400',
  authorized: 'bg-yellow-400',
  cancelled: 'bg-red-400',
  canceled: 'bg-red-400',
  pending: 'bg-slate-400',
  in_process: 'bg-slate-400',
  capture_requested: 'bg-orange-400',
  cancel_requested: 'bg-orange-500',
};

const LABEL_STATUS: Record<string, string> = {
  captured: 'Capturado',
  captured_marketplace: 'Capturado (marketplace)',
  authorized: 'Autorizado',
  cancelled: 'Cancelado',
  canceled: 'Cancelado',
  pending: 'Pendiente',
  in_process: 'En proceso',
  capture_requested: 'Captura solicitada',
  cancel_requested: 'Cancelación solicitada',
};

const LABEL_OPERACION: Record<string, string> = {
  capture: 'Capturas',
  cancel: 'Cancelaciones',
  refresh: 'Refresh de token',
  monitor: 'Monitoreo de token',
  oauth: 'OAuth / onboarding',
};

const LABEL_FALLA: Record<string, string> = {
  invalid_token: 'Token inválido',
  expired_token: 'Token vencido',
  unauthorized: 'No autorizado',
  capture: 'Capturas',
  cancel: 'Cancelaciones',
  refresh: 'Refresh',
};

function evaluarSalud(m: MetricasMercadoPago): {
  nivel: NivelSalud;
  texto: string;
} {
  const criticas =
    m.alertas.token_invalido.length +
    m.alertas.habilitado_token_roto.length +
    m.fallas_token.ultimas_24h;
  const atencion =
    m.alertas.sin_refresh_token.length + m.fallas_token.ultimos_30d;
  if (criticas > 0) {
    return {
      nivel: 'critico',
      texto: criticas === 1 ? '1 problema crítico' : `${criticas} problemas críticos`,
    };
  }
  if (atencion > 0) {
    return {
      nivel: 'atencion',
      texto: atencion === 1 ? '1 elemento a revisar' : `${atencion} elementos a revisar`,
    };
  }
  return { nivel: 'ok', texto: 'Sistema operativo' };
}

function Kpi({
  titulo,
  valor,
  icono: Icon,
  color,
  destacado,
}: {
  titulo: string;
  valor: number;
  icono: typeof Activity;
  color: string;
  destacado?: boolean;
}) {
  return (
    <Card>
      <div className="p-4 flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400 truncate">{titulo}</p>
          <p
            className={`text-xl font-bold ${destacado ? 'text-red-400' : 'text-white'}`}
          >
            {valor}
          </p>
        </div>
      </div>
    </Card>
  );
}

function BarrasHorizontales({
  items,
}: {
  items: { etiqueta: string; valor: number; color: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.valor));
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">Sin datos</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.etiqueta}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300">{item.etiqueta}</span>
            <span className="text-slate-400 font-medium">{item.valor}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${item.color}`}
              style={{ width: `${(item.valor / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const SERIES_DIARIAS: {
  campo: Exclude<keyof SerieDiariaPagoMp, 'fecha'>;
  color: string;
  etiqueta: string;
}[] = [
  { campo: 'creados', color: '#94a3b8', etiqueta: 'Creados' },
  { campo: 'capturados', color: '#22d3ee', etiqueta: 'Capturados' },
  { campo: 'cancelados', color: '#f87171', etiqueta: 'Cancelados' },
];

function GraficoLineas({ dias }: { dias: SerieDiariaPagoMp[] }) {
  if (dias.length === 0) {
    return <p className="text-sm text-slate-500">Sin datos en el período</p>;
  }
  const ancho = 600;
  const alto = 180;
  const padX = 10;
  const padY = 14;
  const max = Math.max(
    1,
    ...dias.flatMap((d) => SERIES_DIARIAS.map((s) => d[s.campo])),
  );
  const x = (i: number) =>
    padX + (dias.length <= 1 ? 0 : (i / (dias.length - 1)) * (ancho - 2 * padX));
  const y = (v: number) =>
    alto - padY - (v / max) * (alto - 2 * padY);
  const mostrarPuntos = dias.length <= 60;

  return (
    <div>
      <ul className="flex flex-wrap items-center gap-4 mb-3 text-xs">
        {SERIES_DIARIAS.map((s) => (
          <li key={s.etiqueta} className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 rounded"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-slate-300">{s.etiqueta}</span>
          </li>
        ))}
      </ul>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="w-full h-44"
        role="img"
        aria-label="Evolución diaria de creados, capturados y cancelados"
      >
        <line
          x1={padX}
          y1={alto - padY}
          x2={ancho - padX}
          y2={alto - padY}
          stroke="#334155"
          strokeWidth="1"
        />
        {SERIES_DIARIAS.map((s) => (
          <g key={s.campo}>
            <polyline
              points={dias
                .map((d, i) => `${x(i)},${y(d[s.campo])}`)
                .join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {mostrarPuntos &&
              dias.map((d, i) => (
                <circle key={`${s.campo}-${d.fecha}`} cx={x(i)} cy={y(d[s.campo])} r="2.5" fill={s.color}>
                  <title>{`${d.fecha} · ${s.etiqueta}: ${d[s.campo]}`}</title>
                </circle>
              ))}
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>{dias[0].fecha}</span>
        <span>{dias[dias.length - 1].fecha}</span>
      </div>
    </div>
  );
}

function DonutCuentas({ cuentas }: { cuentas: MetricasMercadoPago['cuentas'] }) {
  const conectadas = cuentas.conectadas;
  const sinConectar = Math.max(0, cuentas.total - conectadas);
  const total = Math.max(1, cuentas.total);
  const radio = 42;
  const circ = 2 * Math.PI * radio;
  const pctConectadas = conectadas / total;
  const pctSinConectar = sinConectar / total;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-28 h-28 flex-shrink-0">
        <circle
          cx="50"
          cy="50"
          r={radio}
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
        />
        <circle
          cx="50"
          cy="50"
          r={radio}
          fill="none"
          stroke="#22d3ee"
          strokeWidth="12"
          strokeDasharray={`${pctConectadas * circ} ${circ}`}
          transform="rotate(-90 50 50)"
          strokeLinecap="butt"
        />
        <circle
          cx="50"
          cy="50"
          r={radio}
          fill="none"
          stroke="#475569"
          strokeWidth="12"
          strokeDasharray={`${pctSinConectar * circ} ${circ}`}
          strokeDashoffset={-pctConectadas * circ}
          transform="rotate(-90 50 50)"
          strokeLinecap="butt"
        />
        <text
          x="50"
          y="54"
          textAnchor="middle"
          className="fill-white text-lg font-bold"
          style={{ fontSize: 18 }}
        >
          {cuentas.total}
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-cyan-400" />
          <span className="text-slate-300">Conectadas</span>
          <span className="text-white font-medium">{conectadas}</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-slate-600" />
          <span className="text-slate-300">Sin conectar</span>
          <span className="text-white font-medium">{sinConectar}</span>
        </li>
      </ul>
    </div>
  );
}

function ListaAlertas({
  titulo,
  descripcion,
  icono: Icon,
  color,
  items,
}: {
  titulo: string;
  descripcion: string;
  icono: typeof Users;
  color: string;
  items: AlertaCuentaMercadoPago[];
}) {
  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`w-4 h-4 ${color}`} />
          <h3 className="font-medium text-white text-sm">{titulo}</h3>
          <span
            className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
              items.length > 0
                ? 'bg-red-500/10 text-red-400'
                : 'bg-slate-700/40 text-slate-400'
            }`}
          >
            {items.length}
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-3">{descripcion}</p>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Sin incidencias</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {items.map((cuenta) => (
              <li
                key={cuenta.id_usuario}
                className="flex items-center justify-between gap-2 text-xs bg-slate-800/60 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-slate-200 truncate">
                    {cuenta.nombre || 'Proveedor'}
                  </p>
                  <p className="text-slate-500 truncate">{cuenta.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {cuenta.marketplace_habilitado && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300">
                      Habilitada
                    </span>
                  )}
                  <span className="text-slate-500">
                    {cuenta.mp_user_id || '—'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function aCsv(metricas: MetricasMercadoPago): string {
  const filas: string[] = [
    'seccion,clave,valor',
    `general,generado_en,${metricas.generado_en}`,
    `cuentas,total,${metricas.cuentas.total}`,
    `cuentas,conectadas,${metricas.cuentas.conectadas}`,
    `cuentas,habilitadas_marketplace,${metricas.cuentas.habilitadas_marketplace}`,
    `cuentas,token_invalido,${metricas.cuentas.token_invalido}`,
    `pagos,capturados,${metricas.pagos.capturados}`,
    `pagos,cancelados,${metricas.pagos.cancelados}`,
    `pagos,capturas_solicitadas,${metricas.pagos.capturas_solicitadas}`,
    `pagos,auto_capturas_disparadas,${metricas.pagos.auto_capturas_disparadas}`,
    `fallas_token,ultimas_24h,${metricas.fallas_token.ultimas_24h}`,
    `fallas_token,ultimos_30d,${metricas.fallas_token.ultimos_30d}`,
  ];
  for (const [status, cantidad] of Object.entries(metricas.pagos.por_mp_status)) {
    filas.push(`pagos_por_status,${status},${cantidad}`);
  }
  for (const [tipo, cantidad] of Object.entries(metricas.fallas_token.por_tipo)) {
    filas.push(`fallas_por_tipo,${tipo},${cantidad}`);
  }
  for (const [clave, cantidad] of Object.entries({
    token_invalido: metricas.alertas.token_invalido.length,
    sin_refresh_token: metricas.alertas.sin_refresh_token.length,
    habilitado_token_roto: metricas.alertas.habilitado_token_roto.length,
  })) {
    filas.push(`alertas,${clave},${cantidad}`);
  }
  return filas.join('\n');
}

export default function MercadoPagoAdminPage() {
  const [metricas, setMetricas] = useState<MetricasMercadoPago | null>(null);
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
        const datos = await obtenerMetricasMercadoPago(params);
        setMetricas(datos);
      } catch (e) {
        setError(
          mensajeError(e, 'No se pudieron cargar las métricas de Mercado Pago.'),
        );
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
    enlace.download = `mercadopago-metricas-${new Date().toISOString().slice(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  };

  const salud = metricas ? evaluarSalud(metricas) : null;
  const iconoSalud =
    salud?.nivel === 'ok'
      ? ShieldCheck
      : salud?.nivel === 'atencion'
        ? ShieldAlert
        : ShieldX;
  const colorSalud =
    salud?.nivel === 'ok'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : salud?.nivel === 'atencion'
        ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
        : 'text-red-400 bg-red-500/10 border-red-500/20';
  const IconoSalud = iconoSalud;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">
            Mercado Pago — Marketplace
          </h1>
        </div>
        {salud && (
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${colorSalud}`}
          >
            <IconoSalud className="w-3.5 h-3.5" />
            {salud.texto}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => void cargar(rangoActivo)}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Actualizar
          </Button>
          <Button variant="secondary" size="sm" onClick={exportarCsv} disabled={!metricas}>
            <Download className="w-4 h-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1" htmlFor="mp-desde">
              Fallas de token desde
            </label>
            <input
              id="mp-desde"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1" htmlFor="mp-hasta">
              hasta
            </label>
            <input
              id="mp-hasta"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg text-sm text-white px-3 py-1.5"
            />
          </div>
          <Button
            size="sm"
            onClick={aplicarRango}
            disabled={!desde || !hasta || cargando}
          >
            Aplicar rango
          </Button>
          {(rangoActivo.desde || desde || hasta) && (
            <Button variant="ghost" size="sm" onClick={limpiarRango}>
              Limpiar
            </Button>
          )}
          {metricas && (
            <span className="text-xs text-slate-500 ml-auto">
              Actualizado{' '}
              {new Date(metricas.generado_en).toLocaleString('es-AR', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </span>
          )}
        </div>
      </Card>

      {error && (
        <Card>
          <div className="p-5 flex items-center gap-2 text-red-400 text-sm">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        </Card>
      )}

      {cargando && !metricas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {metricas && (
        <>
          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
              <Users className="w-5 h-5 text-cyan-400" />
              Cuentas
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1">
                <Card>
                  <div className="p-5">
                    <h3 className="text-sm font-medium text-slate-300 mb-4">
                      Distribución
                    </h3>
                    <DonutCuentas cuentas={metricas.cuentas} />
                  </div>
                </Card>
              </div>
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 content-start">
                <Kpi
                  titulo="Conectadas"
                  valor={metricas.cuentas.conectadas}
                  icono={CreditCard}
                  color="bg-cyan-500/10 text-cyan-400"
                />
                <Kpi
                  titulo="Habilitadas marketplace"
                  valor={metricas.cuentas.habilitadas_marketplace}
                  icono={Wallet}
                  color="bg-emerald-500/10 text-emerald-400"
                />
                <Kpi
                  titulo="Con token inválido"
                  valor={metricas.cuentas.token_invalido}
                  icono={KeyRound}
                  color="bg-red-500/10 text-red-400"
                  destacado={metricas.cuentas.token_invalido > 0}
                />
              </div>
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
              <LineChart className="w-5 h-5 text-cyan-400" />
              Pagos
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 content-start">
                <Kpi
                  titulo="Capturados"
                  valor={metricas.pagos.capturados}
                  icono={ShieldCheck}
                  color="bg-cyan-500/10 text-cyan-400"
                />
                <Kpi
                  titulo="Cancelados"
                  valor={metricas.pagos.cancelados}
                  icono={XCircle}
                  color="bg-red-500/10 text-red-400"
                />
                <Kpi
                  titulo="Capturas solicitadas"
                  valor={metricas.pagos.capturas_solicitadas}
                  icono={Activity}
                  color="bg-orange-500/10 text-orange-400"
                />
                <Kpi
                  titulo="Auto-capturas"
                  valor={metricas.pagos.auto_capturas_disparadas}
                  icono={RefreshCw}
                  color="bg-yellow-500/10 text-yellow-400"
                />
              </div>
              <Card>
                <div className="p-5">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">
                    Por estado (mp_status)
                  </h3>
                  <BarrasHorizontales
                    items={Object.entries(metricas.pagos.por_mp_status).map(
                      ([status, valor]) => ({
                        etiqueta: LABEL_STATUS[status] || status,
                        valor,
                        color: COLORES_STATUS[status] || 'bg-slate-400',
                      }),
                    )}
                  />
                </div>
              </Card>
            </div>
            <Card className="mt-4">
              <div className="p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
                  <h3 className="text-sm font-medium text-slate-300">
                    Evolución diaria
                  </h3>
                  <span className="text-xs text-slate-500">
                    {new Date(
                      metricas.pagos.serie_diaria.desde,
                    ).toLocaleDateString('es-AR')}{' '}
                    —{' '}
                    {new Date(
                      metricas.pagos.serie_diaria.hasta,
                    ).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <GraficoLineas dias={metricas.pagos.serie_diaria.dias} />
              </div>
            </Card>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
              <AlertTriangle className="w-5 h-5 text-cyan-400" />
              Fallas de token
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="grid grid-cols-2 gap-4 content-start">
                <Kpi
                  titulo="Últimas 24 h"
                  valor={metricas.fallas_token.ultimas_24h}
                  icono={AlertTriangle}
                  color="bg-red-500/10 text-red-400"
                  destacado={metricas.fallas_token.ultimas_24h > 0}
                />
                <Kpi
                  titulo="Últimos 30 días"
                  valor={metricas.fallas_token.ultimos_30d}
                  icono={LineChart}
                  color="bg-yellow-500/10 text-yellow-400"
                />
              </div>
              <Card>
                <div className="p-5">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">
                    Por tipo (30 días)
                  </h3>
                  <BarrasHorizontales
                    items={Object.entries(metricas.fallas_token.por_tipo).map(
                      ([tipo, valor]) => ({
                        etiqueta: LABEL_FALLA[tipo] || LABEL_OPERACION[tipo] || tipo,
                        valor,
                        color: 'bg-red-400/80',
                      }),
                    )}
                  />
                </div>
              </Card>
              {metricas.fallas_token.rango && (
                <Card>
                  <div className="p-5">
                    <h3 className="text-sm font-medium text-slate-300 mb-1">
                      Rango seleccionado
                    </h3>
                    <p className="text-xs text-slate-500 mb-4">
                      {new Date(metricas.fallas_token.rango.desde).toLocaleDateString(
                        'es-AR',
                      )}{' '}
                      —{' '}
                      {new Date(metricas.fallas_token.rango.hasta).toLocaleDateString(
                        'es-AR',
                      )}
                    </p>
                    <p className="text-2xl font-bold text-white mb-4">
                      {metricas.fallas_token.rango.total} fallas
                    </p>
                    <BarrasHorizontales
                      items={Object.entries(metricas.fallas_token.rango.por_tipo).map(
                        ([tipo, valor]) => ({
                          etiqueta: LABEL_FALLA[tipo] || LABEL_OPERACION[tipo] || tipo,
                          valor,
                          color: 'bg-red-400/80',
                        }),
                      )}
                    />
                  </div>
                </Card>
              )}
            </div>
          </section>

          <section>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              Alertas de cuentas
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <ListaAlertas
                titulo="Token inválido"
                descripcion="La conexión fue rechazada por Mercado Pago: deben reconectar."
                icono={KeyRound}
                color="text-red-400"
                items={metricas.alertas.token_invalido}
              />
              <ListaAlertas
                titulo="Sin refresh token"
                descripcion="Sin renovación automática: el token puede vencer sin aviso."
                icono={RefreshCw}
                color="text-yellow-400"
                items={metricas.alertas.sin_refresh_token}
              />
              <ListaAlertas
                titulo="Habilitadas con token roto"
                descripcion="Marketplace activo pero no pueden cobrar con su token."
                icono={ShieldX}
                color="text-red-400"
                items={metricas.alertas.habilitado_token_roto}
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
