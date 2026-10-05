'use client';

import { useState, useEffect, useCallback } from 'react';
import api, { extractData } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import {
  Briefcase,
  Search,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Gavel,
} from 'lucide-react';

type RespuestaApi<T> = T & { data?: T };

type ErrorApi = { response?: { data?: { message?: string } } };

const mensajeDeError = (error: unknown, fallback: string): string =>
  (error as ErrorApi | undefined)?.response?.data?.message || fallback;

interface ResultadoEvaluacion {
  creadas?: number;
  data?: { creadas?: number };
}

interface ResultadoRevision {
  periodo?: string;
}

interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
}

interface Servicio {
  id_servicio: number;
  nombre: string;
  id_categoria: number;
  activo: boolean;
}

interface MetricasCatalogo {
  catalogo: {
    categorias: { total: number; activas: number };
    servicios: { total: number; activos: number };
  };
  busquedasFallidas: {
    total30d: number;
    rubros30d: number;
    servicios15d: number;
    umbrales: {
      rubro: { cantidad: number; dias: number };
      servicio: { cantidad: number; dias: number };
    };
  };
  solicitudes: {
    pendientes: number;
    enRevision: number;
    aprobadas: number;
    rechazadas: number;
    vencidas: number;
    automaticasPorUmbral: number;
    proximasAVencer: number;
  };
  sla: {
    pendientesImplementacion: number;
    legalDias: number;
    implementacionDias: number;
  };
  revisionesTrimestrales: number;
  exito?: {
    incorporacion: {
      tiempo_promedio_dias_habiles: number | null;
      objetivo_dias_habiles: number;
      cumple: boolean | null;
      solicitudes_implementadas: number;
    };
    tasa_aprobacion: {
      porcentaje: number | null;
      rango_objetivo: [number, number];
      cumple: boolean | null;
      aprobadas: number;
      rechazadas: number;
    };
    busquedas_fallidas: {
      periodo_actual_30d: number;
      periodo_anterior_30d: number;
      variacion_pct: number | null;
      objetivo_reduccion_pct: number;
      cumple: boolean | null;
    };
    crecimiento_catalogo: {
      rubros_incorporados: number;
      servicios_incorporados: number;
      objetivo: { rubros_min: number; servicios_min: number; plazo: string };
      cumple: boolean;
    };
    satisfaccion_proveedores: {
      promedio: number | null;
      encuestas: number;
      objetivo_min: number;
      cumple: boolean | null;
    };
  };
}

interface RevisionTrimestral {
  id_revision: number;
  periodo: string;
  fecha_revision: string;
  estado: string;
  resumen?: Record<string, number>;
  rubros_baja_demanda?: { nombre: string; promedio_mensual: number }[];
  servicios_baja_demanda?: { nombre: string }[];
  propuestas_umbrales?: { nombre_propuesto: string; estado: string }[];
}

interface BusquedaFallida {
  id_busqueda: number;
  consulta: string;
  tipo: 'rubro' | 'servicio';
  fecha: string;
  categoria?: { id_categoria: number; nombre: string };
}

interface TemaUmbral {
  clave: string;
  total: number;
  consulta_reciente: string;
}

interface TemasResponse {
  umbrales: {
    rubro: { cantidad: number; dias: number };
    servicio: { cantidad: number; dias: number };
  };
  rubros: TemaUmbral[];
  servicios: TemaUmbral[];
}

interface SolicitudRubro {
  id_solicitud: number;
  nombre_propuesto: string;
  tipo: string;
  descripcion?: string;
  justificacion?: string;
  estado: string;
  origen: string;
  fecha_solicitud: string;
  fecha_limite_legal?: string;
  fecha_limite_implementacion?: string;
  observaciones?: string;
  implementada?: boolean;
  solicitante?: { id_usuario: string; nombre: string; apellido: string };
  votos?: { voto: string }[];
  apoyos?: { id_apoyo: number }[];
}

type Tab = 'categorias' | 'servicios' | 'dinamico';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'categorias', label: 'Categorías', icon: <Briefcase className="w-4 h-4" /> },
  { key: 'servicios', label: 'Servicios', icon: <Briefcase className="w-4 h-4" /> },
  { key: 'dinamico', label: 'Catálogo Dinámico', icon: <TrendingUp className="w-4 h-4" /> },
];

const ESTADO_SOLICITUD: Record<string, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'text-yellow-400 bg-yellow-500/10' },
  en_revision: { label: 'En revisión', cls: 'text-blue-400 bg-blue-500/10' },
  aprobado: { label: 'Aprobado', cls: 'text-green-400 bg-green-500/10' },
  rechazado: { label: 'Rechazado', cls: 'text-red-400 bg-red-500/10' },
  vencida: { label: 'Vencida', cls: 'text-orange-400 bg-orange-500/10' },
};

export default function AdminServiciosPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('categorias');
  const [busqueda, setBusqueda] = useState('');

  const [metricas, setMetricas] = useState<MetricasCatalogo | null>(null);
  const [busquedas, setBusquedas] = useState<BusquedaFallida[]>([]);
  const [temas, setTemas] = useState<TemasResponse | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudRubro[]>([]);
  const [revisiones, setRevisiones] = useState<RevisionTrimestral[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<'activas' | 'resueltas'>('activas');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'rubro' | 'servicio'>('todos');
  const [filtroServicios, setFiltroServicios] = useState<'activos' | 'todos'>('activos');
  const [evaluando, setEvaluando] = useState(false);
  const [accionando, setAccionando] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [loadingDinamico, setLoadingDinamico] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, servRes] = await Promise.allSettled([
        api.get<RespuestaApi<Categoria[]>>('/catalogo/categorias'),
        api.get<RespuestaApi<Servicio[]>>('/servicios'),
      ]);
      const catsData = catsRes.status === 'fulfilled' ? extractData<RespuestaApi<Categoria[]> | null>(catsRes.value) : null;
      const servData = servRes.status === 'fulfilled' ? extractData<RespuestaApi<Servicio[]> | null>(servRes.value) : null;
      setCategorias(catsData?.data || catsData || []);
      setServicios(servData?.data || servData || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchDinamico = useCallback(async () => {
    setLoadingDinamico(true);
    try {
      const [metRes, busRes, temRes, solRes, revRes] = await Promise.allSettled([
        api.get<RespuestaApi<MetricasCatalogo>>('/catalogo/metricas'),
        api.get<RespuestaApi<BusquedaFallida[]>>('/catalogo/busquedas-fallidas', { params: { limit: 100 } }),
        api.get<RespuestaApi<TemasResponse>>('/catalogo/busquedas-fallidas/temas'),
        api.get<RespuestaApi<SolicitudRubro[]>>('/solicitud-rubro'),
        api.get<RespuestaApi<RevisionTrimestral[]>>('/catalogo/revisiones-trimestrales'),
      ]);
      if (metRes.status === 'fulfilled') {
        const d = extractData<RespuestaApi<MetricasCatalogo> | null>(metRes.value);
        setMetricas(d?.data || d || null);
      }
      if (busRes.status === 'fulfilled') {
        const d = extractData<RespuestaApi<BusquedaFallida[]> | null>(busRes.value);
        setBusquedas(d?.data || d || []);
      }
      if (temRes.status === 'fulfilled') {
        const d = extractData<RespuestaApi<TemasResponse> | null>(temRes.value);
        setTemas(d?.data || d || null);
      }
      if (solRes.status === 'fulfilled') {
        const d = extractData<RespuestaApi<SolicitudRubro[]> | null>(solRes.value);
        setSolicitudes(d?.data || d || []);
      }
      if (revRes.status === 'fulfilled') {
        const d = extractData<RespuestaApi<RevisionTrimestral[]> | null>(revRes.value);
        setRevisiones(d?.data || d || []);
      }
    } catch {} finally {
      setLoadingDinamico(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (tab === 'dinamico') fetchDinamico(); }, [tab, fetchDinamico]);

  const evaluarUmbrales = async () => {
    setEvaluando(true);
    setMsg(null);
    try {
      const res = await api.post<ResultadoEvaluacion>('/catalogo/busquedas-fallidas/evaluar-umbrales');
      const d = extractData<ResultadoEvaluacion | null>(res);
      const creadas = d?.creadas ?? d?.data?.creadas ?? 0;
      setMsg({ tipo: 'ok', texto: creadas > 0 ? `${creadas} solicitud(es) creada(s) por umbrales` : 'Umbrales evaluados: sin solicitudes nuevas' });
      await fetchDinamico();
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeDeError(e, 'Error al evaluar umbrales') });
    } finally {
      setEvaluando(false);
    }
  };

  const resolverSolicitud = async (id: number, accion: 'aprobado' | 'rechazado') => {
    setAccionando(id);
    setMsg(null);
    try {
      await api.patch(`/solicitud-rubro/${id}/resolver`, {
        estado: accion,
        observaciones: accion === 'aprobado' ? 'Aprobado desde panel de catálogo dinámico' : 'Rechazado desde panel de catálogo dinámico',
      });
      setMsg({ tipo: 'ok', texto: `Solicitud ${accion === 'aprobado' ? 'aprobada' : 'rechazada'}` });
      await fetchDinamico();
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeDeError(e, 'Error al resolver solicitud') });
    } finally {
      setAccionando(null);
    }
  };

  const generarRevision = async () => {
    setEvaluando(true);
    setMsg(null);
    try {
      const res = await api.post<ResultadoRevision>('/catalogo/revisiones-trimestrales/generar');
      const d = extractData<ResultadoRevision | null>(res);
      setMsg({ tipo: 'ok', texto: `Revisión ${d?.periodo ?? ''} generada correctamente` });
      await fetchDinamico();
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeDeError(e, 'Error al generar revisión trimestral') });
    } finally {
      setEvaluando(false);
    }
  };

  const marcarRevisada = async (id: number) => {
    setAccionando(id);
    setMsg(null);
    try {
      await api.patch(`/catalogo/revisiones-trimestrales/${id}/revisada`);
      setMsg({ tipo: 'ok', texto: 'Revisión trimestral marcada como revisada' });
      await fetchDinamico();
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeDeError(e, 'Error al marcar revisión') });
    } finally {
      setAccionando(null);
    }
  };

  const toggleServicioActivo = async (s: Servicio) => {
    setAccionando(s.id_servicio);
    setMsg(null);
    try {
      await api.patch(`/servicios/${s.id_servicio}`, { activo: !s.activo });
      setServicios((prev) =>
        prev.map((x) =>
          x.id_servicio === s.id_servicio ? { ...x, activo: !x.activo } : x
        )
      );
      setMsg({
        tipo: 'ok',
        texto: `Servicio "${s.nombre}" ${s.activo ? 'inactivado' : 'activado'} correctamente`,
      });
    } catch (e) {
      setMsg({ tipo: 'error', texto: mensajeDeError(e, 'Error al actualizar el servicio') });
    } finally {
      setAccionando(null);
    }
  };

  const catsFiltradas = categorias.filter((c) =>
    !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const servFiltrados = servicios.filter((s) =>
    (filtroServicios === 'todos' || s.activo) &&
    (!busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase()))
  );

  const busquedasFiltradas = busquedas.filter((b) =>
    filtroTipo === 'todos' || b.tipo === filtroTipo
  );

  const solicitudesVisibles = solicitudes.filter((s) =>
    filtroEstado === 'activas'
      ? ['pendiente', 'en_revision', 'vencida'].includes(s.estado)
      : ['aprobado', 'rechazado'].includes(s.estado)
  );

  const m = metricas;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gestión de Servicios</h1>
      </div>

      <div className="flex gap-1 border-b border-slate-700">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab !== 'dinamico' && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder={`Buscar ${tab}...`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          {tab === 'servicios' && (
            <div className="flex gap-1">
              {(['activos', 'todos'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFiltroServicios(t)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filtroServicios === t
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'activos' ? 'Activos' : 'Todos'}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {msg && (
        <div className={`px-4 py-3 rounded-lg text-sm ${
          msg.tipo === 'ok' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
        }`}>
          {msg.texto}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : tab === 'categorias' ? (
        catsFiltradas.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No se encontraron categorías</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {catsFiltradas.map((c) => (
              <Card key={c.id_categoria}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{c.nombre}</h3>
                      {c.descripcion && <p className="text-xs text-slate-500">{c.descripcion}</p>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    c.activa ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-slate-500/10'
                  }`}>
                    {c.activa ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : tab === 'servicios' ? (
        servFiltrados.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">
                {servicios.length > 0 && filtroServicios === 'activos'
                  ? 'No hay servicios activos. Usá el filtro "Todos" para ver y activar servicios inactivos.'
                  : 'No se encontraron servicios'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {servFiltrados.map((s) => (
              <Card key={s.id_servicio}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-slate-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{s.nombre}</h3>
                      <p className="text-xs text-slate-500">Categoría #{s.id_categoria}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      s.activo ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-slate-500/10'
                    }`}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      onClick={() => toggleServicioActivo(s)}
                      disabled={accionando === s.id_servicio}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${
                        s.activo
                          ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400'
                          : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                      }`}
                      title={s.activo ? 'Inactivar servicio' : 'Activar servicio'}
                    >
                      {s.activo ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      {accionando === s.id_servicio ? '...' : s.activo ? 'Inactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : loadingDinamico ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        /* ====================================================================
           TAB CATÁLOGO DINÁMICO
        ==================================================================== */
        <div className="space-y-6">
          {/* Métricas */}
          {m && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-xs text-slate-400 mb-1">Búsquedas fallidas (30d)</p>
                <p className="text-2xl font-bold text-white">{m.busquedasFallidas?.total30d ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Rubro: {m.busquedasFallidas?.rubros30d ?? 0} · Servicio: {m.busquedasFallidas?.servicios15d ?? 0}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-slate-400 mb-1">Solicitudes pendientes</p>
                <p className="text-2xl font-bold text-yellow-400">{m.solicitudes?.pendientes ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">
                  En revisión: {m.solicitudes?.enRevision ?? 0} · Prox. a vencer: {m.solicitudes?.proximasAVencer ?? 0}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-slate-400 mb-1">Aprobadas / Rechazadas</p>
                <p className="text-2xl font-bold text-green-400">{m.solicitudes?.aprobadas ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Rechazadas: {m.solicitudes?.rechazadas ?? 0} · Vencidas: {m.solicitudes?.vencidas ?? 0}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-slate-400 mb-1">Revisiones trimestrales</p>
                <p className="text-2xl font-bold text-white">{m.revisionesTrimestrales ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Automáticas: {m.solicitudes?.automaticasPorUmbral ?? 0} · SLA impl.: {m.sla?.pendientesImplementacion ?? 0}
                </p>
              </Card>
            </div>
          )}

          {/* Métricas de éxito (Objetivo 5) */}
          {m?.exito && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-semibold text-white">Métricas de éxito del catálogo dinámico</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Incorporación aprobada &lt; {m.exito.incorporacion?.objetivo_dias_habiles ?? 15} días hábiles</p>
                  <p className={`text-xl font-bold ${m.exito.incorporacion?.cumple ? 'text-green-400' : m.exito.incorporacion?.tiempo_promedio_dias_habiles == null ? 'text-slate-400' : 'text-red-400'}`}>
                    {m.exito.incorporacion?.tiempo_promedio_dias_habiles != null ? `${m.exito.incorporacion.tiempo_promedio_dias_habiles} d.h.` : 'Sin datos'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{m.exito.incorporacion?.solicitudes_implementadas ?? 0} implementadas</p>
                </div>
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Tasa de aprobación objetivo 60-80%</p>
                  <p className={`text-xl font-bold ${m.exito.tasa_aprobacion?.cumple ? 'text-green-400' : m.exito.tasa_aprobacion?.porcentaje == null ? 'text-slate-400' : 'text-red-400'}`}>
                    {m.exito.tasa_aprobacion?.porcentaje != null ? `${m.exito.tasa_aprobacion.porcentaje}%` : 'Sin datos'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{m.exito.tasa_aprobacion?.aprobadas ?? 0} aprobadas · {m.exito.tasa_aprobacion?.rechazadas ?? 0} rechazadas</p>
                </div>
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Búsquedas fallidas -30% (30d vs. previos)</p>
                  <p className={`text-xl font-bold ${m.exito.busquedas_fallidas?.cumple ? 'text-green-400' : m.exito.busquedas_fallidas?.variacion_pct == null ? 'text-slate-400' : 'text-red-400'}`}>
                    {m.exito.busquedas_fallidas?.variacion_pct != null
                      ? `${m.exito.busquedas_fallidas.variacion_pct > 0 ? '+' : ''}${m.exito.busquedas_fallidas.variacion_pct}%`
                      : 'Sin datos'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Actual: {m.exito.busquedas_fallidas?.periodo_actual_30d ?? 0} · Anterior: {m.exito.busquedas_fallidas?.periodo_anterior_30d ?? 0}
                  </p>
                </div>
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Crecimiento del catálogo (trimestre)</p>
                  <p className={`text-xl font-bold ${m.exito.crecimiento_catalogo?.cumple ? 'text-green-400' : 'text-yellow-400'}`}>
                    {m.exito.crecimiento_catalogo?.rubros_incorporados ?? 0} rubros / {m.exito.crecimiento_catalogo?.servicios_incorporados ?? 0} servicios
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Objetivo: ≥{m.exito.crecimiento_catalogo?.objetivo?.rubros_min ?? 2} rubros, ≥{m.exito.crecimiento_catalogo?.objetivo?.servicios_min ?? 10} servicios
                  </p>
                </div>
                <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Satisfacción del proceso &gt; 4.0</p>
                  <p className={`text-xl font-bold ${m.exito.satisfaccion_proveedores?.cumple ? 'text-green-400' : m.exito.satisfaccion_proveedores?.promedio == null ? 'text-slate-400' : 'text-red-400'}`}>
                    {m.exito.satisfaccion_proveedores?.promedio != null ? `${m.exito.satisfaccion_proveedores.promedio} / 5` : 'Sin datos'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{m.exito.satisfaccion_proveedores?.encuestas ?? 0} evaluaciones</p>
                </div>
              </div>
            </Card>
          )}

          {/* Temas en umbral + evaluar */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">Temas en umbral</h2>
                {temas && (
                  <span className="text-xs text-slate-500">
                    (rubro ≥{temas.umbrales?.rubro?.cantidad} en {temas.umbrales?.rubro?.dias} días · servicio ≥{temas.umbrales?.servicio?.cantidad} en {temas.umbrales?.servicio?.dias} días)
                  </span>
                )}
              </div>
              <button
                onClick={evaluarUmbrales}
                disabled={evaluando}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${evaluando ? 'animate-spin' : ''}`} />
                {evaluando ? 'Evaluando...' : 'Evaluar umbrales'}
              </button>
            </div>
            {temas && (temas.rubros?.length || temas.servicios?.length) ? (
              <div className="space-y-3">
                {temas.rubros?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-purple-400 uppercase mb-2">Rubros candidatos</p>
                    <div className="flex flex-wrap gap-2">
                      {temas.rubros.map((t) => (
                        <span key={t.clave} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-sm text-purple-300">
                          {t.consulta_reciente || t.clave} <span className="text-purple-400/70">({t.total})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {temas.servicios?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-cyan-400 uppercase mb-2">Servicios candidatos</p>
                    <div className="flex flex-wrap gap-2">
                      {temas.servicios.map((t) => (
                        <span key={t.clave} className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-sm text-cyan-300">
                          {t.consulta_reciente || t.clave} <span className="text-cyan-400/70">({t.total})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Ningún tema alcanzó el umbral todavía.</p>
            )}
          </Card>

          {/* Solicitudes de rubro */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Solicitudes de rubro</h2>
                <span className="text-xs text-slate-500">({solicitudesVisibles.length} {filtroEstado === 'activas' ? 'activas' : 'resueltas'})</span>
              </div>
              <div className="flex gap-1">
                {(['activas', 'resueltas'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFiltroEstado(t)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      filtroEstado === t ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'activas' ? 'Activas' : 'Resueltas'}
                  </button>
                ))}
              </div>
            </div>
            {solicitudesVisibles.length === 0 ? (
              <p className="text-sm text-slate-400">
                {filtroEstado === 'activas' ? 'No hay solicitudes pendientes de revisión.' : 'No hay solicitudes resueltas.'}
              </p>
            ) : (
              <div className="space-y-3">
                {solicitudesVisibles.map((s) => {
                  const est = ESTADO_SOLICITUD[s.estado] || { label: s.estado, cls: 'text-slate-400 bg-slate-500/10' };
                  const minApoyos = s.tipo === 'rubro' ? 5 : 2;
                  const apoyosActuales = s.apoyos?.length ?? 0;
                  return (
                    <div key={s.id_solicitud} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-medium text-white">{s.nombre_propuesto}</h3>
                            <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">{s.tipo}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${est.cls}`}>{est.label}</span>
                            {s.origen === 'umbral_automatico' && (
                              <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400">Automática</span>
                            )}
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              apoyosActuales >= minApoyos ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
                            }`}>
                              Apoyos: {apoyosActuales}/{minApoyos}
                            </span>
                            {s.votos && s.votos.length > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">
                                Votos: {s.votos.filter((v) => v.voto === 'aprobar').length} a favor · {s.votos.filter((v) => v.voto === 'rechazar').length} en contra
                              </span>
                            )}
                          </div>
                          {s.justificacion && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{s.justificacion}</p>
                          )}
                          {s.observaciones && ['aprobado', 'rechazado'].includes(s.estado) && (
                            <p className="text-xs text-slate-500 mt-1 italic">Motivo: {s.observaciones}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            Solicitado: {new Date(s.fecha_solicitud).toLocaleDateString('es-AR')}
                            {s.fecha_limite_legal && ` · SLA legal: ${new Date(s.fecha_limite_legal).toLocaleDateString('es-AR')}`}
                            {s.estado === 'aprobado' && s.fecha_limite_implementacion &&
                              ` · SLA impl.: ${new Date(s.fecha_limite_implementacion).toLocaleDateString('es-AR')}`}
                            {s.solicitante && ` · ${s.solicitante.nombre} ${s.solicitante.apellido}`}
                          </p>
                        </div>
                        {['pendiente', 'en_revision', 'vencida'].includes(s.estado) && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => resolverSolicitud(s.id_solicitud, 'aprobado')}
                              disabled={accionando === s.id_solicitud}
                              className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                              title={apoyosActuales < minApoyos
                                ? `Requiere ${minApoyos} apoyos de proveedores verificados (${apoyosActuales}/${minApoyos})`
                                : 'Aprobar'}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => resolverSolicitud(s.id_solicitud, 'rechazado')}
                              disabled={accionando === s.id_solicitud}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                              title="Rechazar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Revisiones trimestrales */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-semibold text-white">Revisión trimestral del catálogo</h2>
                <span className="text-xs text-slate-500">({revisiones.length})</span>
              </div>
              <button
                onClick={generarRevision}
                disabled={evaluando}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${evaluando ? 'animate-spin' : ''}`} />
                {evaluando ? 'Generando...' : 'Generar ahora'}
              </button>
            </div>
            {revisiones.length === 0 ? (
              <p className="text-sm text-slate-400">
                No hay revisiones trimestrales generadas. La próxima se ejecuta automáticamente el 1 de enero/abril/julio/octubre a las 3:00 AM.
              </p>
            ) : (
              <div className="space-y-3">
                {revisiones.map((r) => (
                  <div key={r.id_revision} className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-medium text-white">{r.periodo}</h3>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                            {new Date(r.fecha_revision).toLocaleDateString('es-AR')}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            r.estado === 'revisada' ? 'text-green-400 bg-green-500/10' : 'text-yellow-400 bg-yellow-500/10'
                          }`}>
                            {r.estado === 'revisada' ? 'Revisada' : 'Pendiente de revisión'}
                          </span>
                        </div>
                        {r.resumen && (
                          <p className="text-xs text-slate-500 mt-1">
                            {Object.entries(r.resumen).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                          </p>
                        )}
                        {(r.rubros_baja_demanda?.length || r.servicios_baja_demanda?.length || r.propuestas_umbrales?.length) ? (
                          <div className="mt-2 space-y-1 text-xs text-slate-400">
                            {r.rubros_baja_demanda && r.rubros_baja_demanda.length > 0 && (
                              <p>
                                <span className="text-orange-400">Baja demanda (rubros):</span>{' '}
                                {r.rubros_baja_demanda.map((x) => `${x.nombre} (${x.promedio_mensual}/mes)`).join(', ')}
                              </p>
                            )}
                            {r.servicios_baja_demanda && r.servicios_baja_demanda.length > 0 && (
                              <p>
                                <span className="text-orange-400">Baja demanda (servicios):</span>{' '}
                                {r.servicios_baja_demanda.map((x) => x.nombre).join(', ')}
                              </p>
                            )}
                            {r.propuestas_umbrales && r.propuestas_umbrales.length > 0 && (
                              <p>
                                <span className="text-cyan-400">Propuestas por umbral:</span>{' '}
                                {r.propuestas_umbrales.map((x) => `${x.nombre_propuesto} (${x.estado})`).join(', ')}
                              </p>
                            )}
                          </div>
                        ) : null}
                      </div>
                      {r.estado !== 'revisada' && (
                        <button
                          onClick={() => marcarRevisada(r.id_revision)}
                          disabled={accionando === r.id_revision}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Marcar revisada
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Historial de búsquedas fallidas */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-white">Búsquedas fallidas recientes</h2>
                <span className="text-xs text-slate-500">({busquedasFiltradas.length})</span>
              </div>
              <div className="flex gap-1">
                {(['todos', 'rubro', 'servicio'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFiltroTipo(t)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      filtroTipo === t ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t === 'todos' ? 'Todos' : t === 'rubro' ? 'Rubros' : 'Servicios'}
                  </button>
                ))}
              </div>
            </div>
            {busquedasFiltradas.length === 0 ? (
              <p className="text-sm text-slate-400">No hay búsquedas fallidas registradas.</p>
            ) : (
              <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
                {busquedasFiltradas.map((b) => (
                  <div key={b.id_busqueda} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{'"'}{b.consulta}{'"'}</p>
                      <p className="text-xs text-slate-500">
                        {b.categoria?.nombre && `${b.categoria.nombre} · `}
                        {new Date(b.fecha).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                      b.tipo === 'rubro' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400'
                    }`}>
                      {b.tipo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
