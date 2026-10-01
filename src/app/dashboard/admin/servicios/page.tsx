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
  busquedas: {
    total_30d: number;
    rubro_30d: number;
    servicio_15d: number;
    top: { consulta: string; total: number }[];
  };
  solicitudes: {
    pendientes: number;
    en_revision: number;
    aprobadas: number;
    rechazadas: number;
    vencidas: number;
    automaticas: number;
    pendientes_implementacion: number;
    proximas_a_vencer: number;
  };
  revisiones_trimestrales: number;
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
  solicitante?: { id_usuario: string; nombre: string; apellido: string };
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
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'rubro' | 'servicio'>('todos');
  const [evaluando, setEvaluando] = useState(false);
  const [accionando, setAccionando] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [loadingDinamico, setLoadingDinamico] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catsRes, servRes] = await Promise.allSettled([
        api.get('/catalogo/categorias'),
        api.get('/servicios'),
      ]);
      const catsData = catsRes.status === 'fulfilled' ? extractData<any>(catsRes.value) : null;
      const servData = servRes.status === 'fulfilled' ? extractData<any>(servRes.value) : null;
      setCategorias(catsData?.data || catsData || []);
      setServicios(servData?.data || servData || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchDinamico = useCallback(async () => {
    setLoadingDinamico(true);
    try {
      const [metRes, busRes, temRes, solRes] = await Promise.allSettled([
        api.get('/catalogo/metricas'),
        api.get('/catalogo/busquedas-fallidas', { params: { limit: 100 } }),
        api.get('/catalogo/busquedas-fallidas/temas'),
        api.get('/solicitud-rubro'),
      ]);
      if (metRes.status === 'fulfilled') {
        const d = extractData<any>(metRes.value);
        setMetricas(d?.data || d || null);
      }
      if (busRes.status === 'fulfilled') {
        const d = extractData<any>(busRes.value);
        setBusquedas(d?.data || d || []);
      }
      if (temRes.status === 'fulfilled') {
        const d = extractData<any>(temRes.value);
        setTemas(d?.data || d || null);
      }
      if (solRes.status === 'fulfilled') {
        const d = extractData<any>(solRes.value);
        setSolicitudes(d?.data || d || []);
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
      const res = await api.post('/catalogo/busquedas-fallidas/evaluar-umbrales');
      const d = extractData<any>(res);
      const creadas = d?.creadas ?? d?.data?.creadas ?? 0;
      setMsg({ tipo: 'ok', texto: creadas > 0 ? `${creadas} solicitud(es) creada(s) por umbrales` : 'Umbrales evaluados: sin solicitudes nuevas' });
      await fetchDinamico();
    } catch (e: any) {
      setMsg({ tipo: 'error', texto: e?.response?.data?.message || 'Error al evaluar umbrales' });
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
    } catch (e: any) {
      setMsg({ tipo: 'error', texto: e?.response?.data?.message || 'Error al resolver solicitud' });
    } finally {
      setAccionando(null);
    }
  };

  const catsFiltradas = categorias.filter((c) =>
    !busqueda || c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const servFiltrados = servicios.filter((s) =>
    !busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const busquedasFiltradas = busquedas.filter((b) =>
    filtroTipo === 'todos' || b.tipo === filtroTipo
  );

  const solicitudesVisibles = solicitudes.filter((s) =>
    ['pendiente', 'en_revision', 'vencida'].includes(s.estado)
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
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={`Buscar ${tab}...`}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
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
              <p className="text-slate-400">No se encontraron servicios</p>
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
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    s.activo ? 'text-green-400 bg-green-500/10' : 'text-slate-400 bg-slate-500/10'
                  }`}>
                    {s.activo ? 'Activo' : 'Inactivo'}
                  </span>
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
                <p className="text-2xl font-bold text-white">{m.busquedas?.total_30d ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Rubro: {m.busquedas?.rubro_30d ?? 0} · Servicio: {m.busquedas?.servicio_15d ?? 0}
                </p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-slate-400 mb-1">Solicitudes pendientes</p>
                <p className="text-2xl font-bold text-yellow-400">{m.solicitudes?.pendientes ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">
                  En revisión: {m.solicitudes?.en_revision ?? 0}
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
                <p className="text-2xl font-bold text-white">{m.revisiones_trimestrales ?? 0}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Automáticas: {m.solicitudes?.automaticas ?? 0}
                </p>
              </Card>
            </div>
          )}

          {/* Temas en umbral + evaluar */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-semibold text-white">Temas en umbral</h2>
                {temas && (
                  <span className="text-xs text-slate-500">
                    (rubro ≥{temas.umbrales?.rubro?.cantidad}/días, servicio ≥{temas.umbrales?.servicio?.cantidad}/días)
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

          {/* Solicitudes de rubro activas */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gavel className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Solicitudes de rubro</h2>
              <span className="text-xs text-slate-500">({solicitudesVisibles.length} activas)</span>
            </div>
            {solicitudesVisibles.length === 0 ? (
              <p className="text-sm text-slate-400">No hay solicitudes pendientes de revisión.</p>
            ) : (
              <div className="space-y-3">
                {solicitudesVisibles.map((s) => {
                  const est = ESTADO_SOLICITUD[s.estado] || { label: s.estado, cls: 'text-slate-400 bg-slate-500/10' };
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
                          </div>
                          {s.justificacion && (
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{s.justificacion}</p>
                          )}
                          <p className="text-xs text-slate-500 mt-1">
                            Solicitado: {new Date(s.fecha_solicitud).toLocaleDateString('es-AR')}
                            {s.fecha_limite_legal && ` · SLA: ${new Date(s.fecha_limite_legal).toLocaleDateString('es-AR')}`}
                            {s.solicitante && ` · ${s.solicitante.nombre} ${s.solicitante.apellido}`}
                          </p>
                        </div>
                        {['pendiente', 'en_revision', 'vencida'].includes(s.estado) && (
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => resolverSolicitud(s.id_solicitud, 'aprobado')}
                              disabled={accionando === s.id_solicitud}
                              className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                              title="Aprobar"
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
                      <p className="text-sm text-white truncate">"{b.consulta}"</p>
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
