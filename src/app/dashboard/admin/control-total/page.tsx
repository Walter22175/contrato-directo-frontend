'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Chip, Semaforo } from '@/components/control-total/Semaforo';
import { TimelineGlobalSeccion } from '@/components/control-total/TimelineGlobal';
import { VistaEspejoSeccion } from '@/components/control-total/VistaEspejo';
import { MonitorColasSeccion } from '@/components/control-total/MonitorColas';
import { MonitorCronsSeccion } from '@/components/control-total/MonitorCrons';
import { PanelTokensSeccion } from '@/components/control-total/PanelTokens';
import { PanelComisionesSeccion } from '@/components/control-total/PanelComisiones';
import { PanelRetencionSeccion } from '@/components/control-total/PanelRetencion';
import { PanelInconsistenciasSeccion } from '@/components/control-total/PanelInconsistencias';
import { AuditoriaContableSeccion } from '@/components/control-total/AuditoriaContable';
import { InspectorTransaccionSeccion } from '@/components/control-total/InspectorTransaccion';
import { useControlTotalPolling } from '@/hooks/useControlTotalPolling';
import {
  obtenerAuditoriaContable,
  obtenerEspejo,
  obtenerInspector,
  obtenerInconsistencias,
  obtenerMonitorColas,
  obtenerMonitorCrons,
  obtenerPanelComisiones,
  obtenerPanelRetencion,
  obtenerPanelTokens,
  obtenerResumenControlTotal,
  obtenerTimeline,
  fmtNum,
} from '@/lib/control-total';
import type {
  AuditoriaContable,
  Inconsistencia,
  MonitorColas,
  MonitorCrons,
  PanelComisiones,
  PanelRetencion,
  PanelTokens,
  ResumenControlTotal,
  TimelineGlobal,
  VistaEspejo,
  InspectorTransaccion,
} from '@/lib/control-total';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Eye,
  KeyRound,
  Layers,
  LineChart,
  ListTree,
  Receipt,
  RefreshCw,
  ShieldAlert,
  Timer,
  Wallet,
} from 'lucide-react';

type Tab =
  | 'timeline'
  | 'espejo'
  | 'colas'
  | 'crons'
  | 'tokens'
  | 'comisiones'
  | 'retencion'
  | 'inconsistencias'
  | 'contabilidad'
  | 'inspector';

const TABS: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: 'timeline', label: 'Timeline', icon: ListTree },
  { id: 'espejo', label: 'Espejo MP ↔ BD', icon: Eye },
  { id: 'colas', label: 'Colas', icon: Layers },
  { id: 'crons', label: 'Crons', icon: Timer },
  { id: 'tokens', label: 'Tokens', icon: KeyRound },
  { id: 'comisiones', label: 'Comisiones', icon: Receipt },
  { id: 'retencion', label: 'Retención', icon: Wallet },
  { id: 'inconsistencias', label: 'Inconsistencias', icon: ShieldAlert },
  { id: 'contabilidad', label: 'Contabilidad', icon: BarChart3 },
  { id: 'inspector', label: 'Inspector', icon: Activity },
];

function Skeleton({ alto = 'h-24' }: { alto?: string }) {
  return <div className={`${alto} bg-slate-800/50 rounded-xl animate-pulse`} />;
}

function ErrorCard({ msg }: { msg: string }) {
  return (
    <Card>
      <div className="p-2 flex items-center gap-2 text-red-400 text-sm">
        <AlertTriangle className="w-4 h-4" />
        {msg}
      </div>
    </Card>
  );
}

// ===========================================================================
// Wrappers por pestaña: cada uno hace su propio polling 15 s mientras está
// activa. Los datos de espejo/inspector se cargan bajo demanda.
// ===========================================================================

function TabTimeline({ activo }: { activo: boolean }) {
  const { datos, cargando, error } = useControlTotalPolling<TimelineGlobal>(
    () => obtenerTimeline({ limit: 300 }),
    { activo },
  );
  if (!activo) return null;
  if (cargando && !datos) return <Skeleton alto="h-64" />;
  if (error && !datos) return <ErrorCard msg={`Timeline: ${error}`} />;
  return <TimelineGlobalSeccion datos={datos} />;
}

function TabColas({ activo }: { activo: boolean }) {
  const { datos, cargando, error } = useControlTotalPolling<MonitorColas>(
    obtenerMonitorColas,
    { activo },
  );
  if (!activo) return null;
  if (cargando && !datos) return <Skeleton alto="h-64" />;
  if (error && !datos) return <ErrorCard msg={`Colas: ${error}`} />;
  return <MonitorColasSeccion datos={datos} />;
}

function TabCrons({ activo }: { activo: boolean }) {
  const { datos, cargando, error } = useControlTotalPolling<MonitorCrons>(
    obtenerMonitorCrons,
    { activo },
  );
  if (!activo) return null;
  if (cargando && !datos) return <Skeleton alto="h-64" />;
  if (error && !datos) return <ErrorCard msg={`Crons: ${error}`} />;
  return <MonitorCronsSeccion datos={datos} />;
}

function TabTokens({ activo }: { activo: boolean }) {
  const { datos, cargando, error } = useControlTotalPolling<PanelTokens>(
    obtenerPanelTokens,
    { activo },
  );
  if (!activo) return null;
  if (cargando && !datos) return <Skeleton alto="h-64" />;
  if (error && !datos) return <ErrorCard msg={`Tokens: ${error}`} />;
  return <PanelTokensSeccion datos={datos} />;
}

function TabComisiones({ activo }: { activo: boolean }) {
  const [frecuencia, setFrecuencia] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [rango, setRango] = useState<{ desde?: string; hasta?: string }>({});
  const { datos, cargando, error } = useControlTotalPolling<PanelComisiones>(
    () => obtenerPanelComisiones({ ...rango, frecuencia }),
    { activo },
  );
  if (!activo) return null;
  if (cargando && !datos) return <Skeleton alto="h-64" />;
  if (error && !datos) return <ErrorCard msg={`Comisiones: ${error}`} />;
  return (
    <PanelComisionesSeccion
      datos={datos}
      frecuencia={frecuencia}
      onFrecuencia={setFrecuencia}
      onRango={(desde, hasta) => setRango({ desde, hasta })}
    />
  );
}

function TabRetencion({
  activo,
  onInspeccionar,
}: {
  activo: boolean;
  onInspeccionar: (id: string) => void;
}) {
  const [estado, setEstado] = useState('');
  const [page, setPage] = useState(1);
  const { datos, cargando, error } = useControlTotalPolling<PanelRetencion>(
    () => obtenerPanelRetencion({ estado: estado || undefined, page, limit: 20 }),
    { activo },
  );
  if (!activo) return null;
  if (cargando && !datos) return <Skeleton alto="h-64" />;
  if (error && !datos) return <ErrorCard msg={`Retención: ${error}`} />;
  return (
    <PanelRetencionSeccion
      datos={datos}
      estadoFiltro={estado}
      onEstado={(e) => {
        setEstado(e);
        setPage(1);
      }}
      onPagina={setPage}
      onInspeccionar={onInspeccionar}
    />
  );
}

function TabInconsistencias({
  activo,
  onInspeccionar,
}: {
  activo: boolean;
  onInspeccionar: (id: string) => void;
}) {
  const { datos, cargando, error } = useControlTotalPolling<Inconsistencia[]>(
    obtenerInconsistencias,
    { activo },
  );
  if (!activo) return null;
  if (cargando && !datos) return <Skeleton alto="h-40" />;
  if (error && !datos) return <ErrorCard msg={`Inconsistencias: ${error}`} />;
  return <PanelInconsistenciasSeccion datos={datos} onInspeccionar={onInspeccionar} />;
}

function TabContabilidad({ activo }: { activo: boolean }) {
  const [frecuencia, setFrecuencia] = useState<'dia' | 'semana' | 'mes'>('mes');
  const [rango, setRango] = useState<{ desde?: string; hasta?: string }>({});
  const { datos, cargando, error } = useControlTotalPolling<AuditoriaContable>(
    () => obtenerAuditoriaContable({ ...rango, frecuencia }),
    { activo },
  );
  if (!activo) return null;
  if (cargando && !datos) return <Skeleton alto="h-64" />;
  if (error && !datos) return <ErrorCard msg={`Contabilidad: ${error}`} />;
  return (
    <AuditoriaContableSeccion
      datos={datos}
      frecuencia={frecuencia}
      onFrecuencia={setFrecuencia}
      onRango={(desde, hasta) => setRango({ desde, hasta })}
    />
  );
}

// ===========================================================================
// Página principal
// ===========================================================================

export default function ControlTotalPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const roles = (user?.usuario_roles || [])
    .filter((ur) => ur.activo)
    .map((ur) => ur.rol?.nombre)
    .filter(Boolean);
  const esSuperAdmin = roles.includes('super_admin');

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !esSuperAdmin)) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, esSuperAdmin, router]);

  const [tab, setTab] = useState<Tab>('timeline');
  const [espejo, setEspejo] = useState<VistaEspejo | null>(null);
  const [inspector, setInspector] = useState<InspectorTransaccion | null>(null);
  const [cargandoEspejo, setCargandoEspejo] = useState(false);

  const {
    datos: resumen,
    cargando: cargandoResumen,
    error: errorResumen,
    refrescar: refrescarResumen,
    ultimoRefresco,
  } = useControlTotalPolling<ResumenControlTotal>(obtenerResumenControlTotal, {
    activo: isAuthenticated && esSuperAdmin,
  });

  const inspeccionar = useCallback(
    async (id: string) => {
      if (!id) return;
      setTab('inspector');
      setCargandoEspejo(true);
      try {
        const [ins, esp] = await Promise.all([
          obtenerInspector(id),
          obtenerEspejo(id),
        ]);
        setInspector(ins);
        setEspejo(esp);
      } catch {
        setInspector(null);
        setEspejo(null);
      } finally {
        setCargandoEspejo(false);
      }
    },
    [],
  );

  if (isLoading || !esSuperAdmin) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Panel de Control Total</h1>
        </div>
        {resumen && <Semaforo valor={resumen.semaforo} label={`Sistema: ${resumen.semaforo}`} />}
        {resumen && (
          <Chip tono={resumen.modo_colas === 'redis' ? 'cyan' : 'orange'}>
            colas: {resumen.modo_colas === 'redis' ? 'Redis' : 'inline'}
          </Chip>
        )}
        {resumen && (
          <Chip tono={resumen.marketplace_habilitado ? 'emerald' : 'slate'}>
            marketplace {resumen.marketplace_habilitado ? 'activado' : 'desactivado'}
          </Chip>
        )}
        <div className="ml-auto flex items-center gap-2">
          {ultimoRefresco && (
            <span className="text-xs text-slate-500">
              <Clock className="w-3 h-3 inline mr-1" />
              {ultimoRefresco.toLocaleTimeString('es-AR')} · auto 15 s
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={() => void refrescarResumen()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {cargandoResumen && !resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-20 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
      {errorResumen && !resumen && <ErrorCard msg={`Resumen: ${errorResumen}`} />}
      {resumen && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {(
            [
              ['En custodia', resumen.pagos_en_custodia, 'text-yellow-300'],
              ['Eventos 24 h', resumen.eventos_24h, 'text-slate-100'],
              ['Errores 24 h', resumen.errores_24h, resumen.errores_24h > 0 ? 'text-red-400' : 'text-emerald-300'],
              ['Inconsist. críticas', resumen.inconsistencias_criticas, resumen.inconsistencias_criticas > 0 ? 'text-red-400' : 'text-emerald-300'],
              ['Inconsist. total', resumen.inconsistencias_totales, 'text-slate-100'],
              ['Tokens con problema', resumen.tokens_problema, resumen.tokens_problema > 0 ? 'text-red-400' : 'text-emerald-300'],
              ['Marketplace', resumen.marketplace_habilitado ? 'ON' : 'OFF', resumen.marketplace_habilitado ? 'text-emerald-300' : 'text-slate-400'],
            ] as const
          ).map(([label, valor, color]) => (
            <Card key={label} className="!p-0">
              <div className="p-3">
                <p className="text-[10px] text-slate-500 mb-1 truncate">{label}</p>
                <p className={`text-xl font-bold ${color}`}>
                  {typeof valor === 'number' ? fmtNum(valor) : valor}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pestañas */}
      <div className="flex flex-wrap gap-1 border-b border-slate-800 pb-2">
        {TABS.map((t) => {
          const Icon = t.icon;
          const activa = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-t-lg border-b-2 transition-colors ${
                activa
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Contenido por pestaña */}
      <TabTimeline activo={tab === 'timeline'} />

      {tab === 'espejo' && (
        <div className="space-y-4">
          {cargandoEspejo && <Skeleton alto="h-40" />}
          <VistaEspejoSeccion datos={espejo} onInspeccionar={inspeccionar} />
          <Card>
            <p className="text-xs text-slate-500">
              Usa el Timeline para saltar a una transacción, o pega un id abajo. El espejo
              compara el estado real de Mercado Pago con el estado interno de la BD y marca
              divergencias (🟢 sin motivos, 🟡 menores, 🔴 críticas).
            </p>
          </Card>
        </div>
      )}

      <TabColas activo={tab === 'colas'} />
      <TabCrons activo={tab === 'crons'} />
      <TabTokens activo={tab === 'tokens'} />
      <TabComisiones activo={tab === 'comisiones'} />
      <TabRetencion activo={tab === 'retencion'} onInspeccionar={inspeccionar} />
      <TabInconsistencias activo={tab === 'inconsistencias'} onInspeccionar={inspeccionar} />
      <TabContabilidad activo={tab === 'contabilidad'} />

      {tab === 'inspector' && (
        <div className="space-y-4">
          {cargandoEspejo && <Skeleton alto="h-40" />}
          <InspectorTransaccionSeccion
            datos={inspector}
            onBuscar={inspeccionar}
            buscando={cargandoEspejo}
          />
        </div>
      )}

      <p className="text-[11px] text-slate-600 flex items-center gap-1">
        <LineChart className="w-3 h-3" />
        Acceso restringido a SUPER_ADMIN. Los tokens de Mercado Pago nunca se muestran.
        Datos de control_evento (migración 1791990000000) y estado en vivo de colas/crons.
      </p>
    </div>
  );
}
