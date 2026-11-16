'use client';

import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { mensajeError } from '@/lib/api';
import {
  descargarAuditoriaCsv,
  fmtFechaAuditoria,
  fmtNumAuditoria,
  obtenerAuditoria,
  obtenerResumenAuditoria,
} from '@/lib/auditoria';
import type {
  AuditoriaLog,
  AuditoriaMeta,
  AuditoriaQuery,
  AuditoriaResumen,
  ResultadoAuditoria,
} from '@/lib/auditoria';

const LIMIT = 25;

const RESULTADOS: Array<{ value: '' | ResultadoAuditoria; label: string }> = [
  { value: '', label: 'Todos los resultados' },
  { value: 'exito', label: 'Éxito' },
  { value: 'error', label: 'Error' },
  { value: 'denegado', label: 'Denegado' },
];

const ESTILO_RESULTADO: Record<string, string> = {
  exito: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  denegado: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
};

const ETIQUETA_RESULTADO: Record<string, string> = {
  exito: 'Éxito',
  error: 'Error',
  denegado: 'Denegado',
};

type Borrador = {
  desde: string;
  hasta: string;
  resultado: '' | ResultadoAuditoria;
  search: string;
  accion: string;
  entidad: string;
};

function fechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function rangoInicial(): { desde: string; hasta: string } {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - 6);
  return { desde: fechaISO(desde), hasta: fechaISO(hasta) };
}

function borradorInicial(): Borrador {
  const rango = rangoInicial();
  return {
    desde: rango.desde,
    hasta: rango.hasta,
    resultado: '',
    search: '',
    accion: '',
    entidad: '',
  };
}

function filtrosIniciales(): AuditoriaQuery {
  const rango = rangoInicial();
  return { fecha_desde: rango.desde, fecha_hasta: rango.hasta };
}

const META_VACIA: AuditoriaMeta = {
  total: 0,
  page: 1,
  limit: LIMIT,
  total_pages: 0,
};

export default function AdminAuditoriaPage() {
  const [borrador, setBorrador] = useState<Borrador>(borradorInicial);
  const [filtros, setFiltros] = useState<AuditoriaQuery>(filtrosIniciales);
  const [pagina, setPagina] = useState(1);
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [meta, setMeta] = useState<AuditoriaMeta>(META_VACIA);
  const [resumen, setResumen] = useState<AuditoriaResumen | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [lista, totales] = await Promise.all([
        obtenerAuditoria({ ...filtros, page: pagina, limit: LIMIT }),
        obtenerResumenAuditoria(filtros),
      ]);
      setLogs(Array.isArray(lista?.data) ? lista.data : []);
      setMeta(lista?.meta ?? META_VACIA);
      setResumen(totales ?? null);
    } catch (e) {
      setError(mensajeError(e, 'No se pudo cargar la auditoría'));
      setLogs([]);
      setMeta(META_VACIA);
      setResumen(null);
    } finally {
      setCargando(false);
    }
  }, [filtros, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const aplicarFiltros = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPagina(1);
    setFiltros({
      fecha_desde: borrador.desde || undefined,
      fecha_hasta: borrador.hasta || undefined,
      resultado: borrador.resultado || undefined,
      search: borrador.search.trim() || undefined,
      accion: borrador.accion.trim() || undefined,
      entidad: borrador.entidad.trim() || undefined,
    });
  };

  const limpiarFiltros = () => {
    const nuevo = borradorInicial();
    setBorrador(nuevo);
    setPagina(1);
    setFiltros(filtrosIniciales());
  };

  const cambiarPagina = (nueva: number) => {
    setPagina(nueva);
    setExpandido(null);
  };

  const totalPaginas = Math.max(1, meta.total_pages);
  const hayFiltros =
    Boolean(borrador.search.trim()) ||
    Boolean(borrador.accion.trim()) ||
    Boolean(borrador.entidad.trim()) ||
    Boolean(borrador.resultado);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Auditoría</h1>
          <p className="mt-1 text-slate-400">
            Trazabilidad de acciones críticas: quién, qué, cuándo, rol activo y resultado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => descargarAuditoriaCsv(logs)}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void cargar()}
            isLoading={cargando}
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </div>

      <Card>
        <form onSubmit={aplicarFiltros} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input
              id="auditoria-desde"
              label="Desde"
              type="date"
              value={borrador.desde}
              onChange={(e) =>
                setBorrador((prev) => ({ ...prev, desde: e.target.value }))
              }
            />
            <Input
              id="auditoria-hasta"
              label="Hasta"
              type="date"
              value={borrador.hasta}
              onChange={(e) =>
                setBorrador((prev) => ({ ...prev, hasta: e.target.value }))
              }
            />
            <Select
              id="auditoria-resultado"
              label="Resultado"
              value={borrador.resultado}
              options={RESULTADOS}
              onChange={(e) =>
                setBorrador((prev) => ({
                  ...prev,
                  resultado: e.target.value as '' | ResultadoAuditoria,
                }))
              }
            />
            <Input
              id="auditoria-search"
              label="Búsqueda libre"
              type="search"
              placeholder="Descripción o metadata"
              value={borrador.search}
              onChange={(e) =>
                setBorrador((prev) => ({ ...prev, search: e.target.value }))
              }
            />
            <Input
              id="auditoria-accion"
              label="Acción"
              placeholder="ej. login, contrato_creado"
              value={borrador.accion}
              onChange={(e) =>
                setBorrador((prev) => ({ ...prev, accion: e.target.value }))
              }
            />
            <Input
              id="auditoria-entidad"
              label="Entidad"
              placeholder="ej. usuario, contrato"
              value={borrador.entidad}
              onChange={(e) =>
                setBorrador((prev) => ({ ...prev, entidad: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" size="sm" isLoading={cargando}>
              Aplicar filtros
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={limpiarFiltros}
              disabled={!hayFiltros && !borrador.desde && !borrador.hasta}
            >
              Limpiar
            </Button>
            <p className="ml-auto text-xs text-slate-500">
              Retención recomendada: 730 días · zona horaria Argentina
            </p>
          </div>
        </form>
      </Card>

      {error && (
        <Card>
          <div className="flex items-center gap-2 text-sm text-red-300">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-5">
            <p className="text-xs text-slate-400">Eventos en el período</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {cargando && !resumen ? '—' : fmtNumAuditoria(resumen?.total)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5 text-red-300" />
              Errores
            </p>
            <p className="mt-1 text-2xl font-bold text-red-300">
              {fmtNumAuditoria(resumen?.errores)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <ShieldAlert className="h-3.5 w-3.5 text-yellow-300" />
              Denegados
            </p>
            <p className="mt-1 text-2xl font-bold text-yellow-300">
              {fmtNumAuditoria(resumen?.denegados)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              Acciones distintas
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-300">
              {fmtNumAuditoria(resumen?.por_accion?.length)}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="p-5">
            <CardTitle>Acciones más frecuentes</CardTitle>
            <div className="mt-4 space-y-2">
              {(resumen?.por_accion ?? []).slice(0, 6).map((item) => (
                <div
                  key={item.accion}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/40 px-3 py-2"
                >
                  <span className="truncate font-mono text-xs text-cyan-300">
                    {item.accion}
                  </span>
                  <span className="text-xs text-slate-300">
                    {fmtNumAuditoria(item.total)}
                  </span>
                </div>
              ))}
              {(resumen?.por_accion?.length ?? 0) === 0 && (
                <p className="text-sm text-slate-500">Sin acciones en el período.</p>
              )}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <CardTitle>Entidades más auditadas</CardTitle>
            <div className="mt-4 space-y-2">
              {(resumen?.por_entidad ?? []).slice(0, 6).map((item) => (
                <div
                  key={item.entidad}
                  className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/40 px-3 py-2"
                >
                  <span className="truncate font-mono text-xs text-slate-300">
                    {item.entidad}
                  </span>
                  <span className="text-xs text-slate-300">
                    {fmtNumAuditoria(item.total)}
                  </span>
                </div>
              ))}
              {(resumen?.por_entidad?.length ?? 0) === 0 && (
                <p className="text-sm text-slate-500">Sin entidades en el período.</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Acción</th>
                <th className="px-3 py-3 font-medium">Entidad</th>
                <th className="px-3 py-3 font-medium">Usuario / rol</th>
                <th className="px-3 py-3 font-medium">Resultado</th>
                <th className="px-3 py-3 font-medium">IP</th>
                <th className="px-3 py-3 text-right font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {cargando && logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    Cargando eventos de auditoría...
                  </td>
                </tr>
              )}
              {!cargando && logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                    No hay eventos para los filtros seleccionados.
                  </td>
                </tr>
              )}
              {logs.map((log) => {
                const abierto = expandido === log.id;
                return (
                  <Fragment key={log.id}>
                    <tr className="border-b border-slate-800/80 align-top hover:bg-white/[0.02]">
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-400">
                        {fmtFechaAuditoria(log.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-mono text-xs text-cyan-300">
                          {log.accion}
                        </span>
                        {log.descripcion && (
                          <p className="mt-1 max-w-xs text-xs text-slate-500">
                            {log.descripcion}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-300">
                        <span className="font-mono">{log.entidad}</span>
                        {log.entidad_id && (
                          <p
                            className="mt-1 max-w-[180px] truncate font-mono text-[10px] text-slate-500"
                            title={log.entidad_id}
                          >
                            {log.entidad_id}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-300">
                        <span
                          className="block max-w-[160px] truncate font-mono text-[10px] text-slate-400"
                          title={log.user_id ?? undefined}
                        >
                          {log.user_id ?? 'anónimo'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {log.rol_activo ?? 'sin rol'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-medium ${
                            ESTILO_RESULTADO[log.resultado] ??
                            'border-slate-600 bg-slate-600/20 text-slate-300'
                          }`}
                        >
                          {ETIQUETA_RESULTADO[log.resultado] ?? log.resultado}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-[10px] text-slate-500">
                        {log.ip ?? '-'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setExpandido(abierto ? null : log.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300"
                          aria-expanded={abierto}
                        >
                          {abierto ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                          {abierto ? 'Ocultar' : 'Ver'}
                        </button>
                      </td>
                    </tr>
                    {abierto && (
                      <tr className="border-b border-slate-800/80 bg-slate-900/40">
                        <td colSpan={7} className="px-3 py-4">
                          <pre className="max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[11px] text-slate-400">
                            {JSON.stringify(
                              {
                                request_id: log.request_id,
                                user_id: log.user_id,
                                user_agent: log.user_agent,
                                entidad_id: log.entidad_id,
                                metadata: log.metadata_json,
                              },
                              null,
                              2,
                            )}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            Mostrando {logs.length} de {fmtNumAuditoria(meta.total)} eventos
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cambiarPagina(pagina - 1)}
              disabled={pagina <= 1 || cargando}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-xs text-slate-400">
              Página {meta.page || pagina} de {totalPaginas}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cambiarPagina(pagina + 1)}
              disabled={pagina >= totalPaginas || cargando}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
