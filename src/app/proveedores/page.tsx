'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import api, { extractData } from '@/lib/api';
import { reportarBusquedaFallida } from '@/lib/catalogo';
import {
  Search, Shield, Award, ChevronLeft, ChevronRight,
  SlidersHorizontal, ArrowUpDown, Clock, TrendingUp, Users, MessageSquare
} from 'lucide-react';
import { LlaveIcon } from '@/components/ui/LlaveIcon';
import type { PerfilProveedor, Categoria } from '@/types';

type ProveedorLista = Partial<PerfilProveedor> & {
  id_usuario: string;
  id_perfil_proveedor?: number;
  nombre?: string;
  apellido?: string;
};

interface MetaBusqueda {
  total: number;
  pagina: number;
  por_pagina: number;
  total_paginas: number;
  total_proveedores: number;
  total_registrados: number;
  total_rubros: number;
  promedio_general: number;
  precio_promedio: number | null;
}

interface RespuestaLista<T> {
  data?: T[];
  meta?: Partial<MetaBusqueda>;
}

type SortOption = 'valoracion' | 'nombre' | 'antiguedad' | 'transacciones';
type SortDir = 'asc' | 'desc';

interface Filters {
  busqueda: string;
  categorias: number[];
  valoracionMin: number;
  rangoPrecio: string;
  antiguedad: string;
  distintivo: string;
  disponibilidad: string;
}

const ITEMS_PER_PAGE = 20;
const BUSQUEDA_RETARDO = 350;

const antiguedadOptions = [
  { value: '', label: 'Cualquiera' },
  { value: '0-3', label: 'Menos de 3 meses' },
  { value: '3-6', label: '3 a 6 meses' },
  { value: '6-12', label: '6 a 12 meses' },
  { value: '12+', label: 'Más de 12 meses' },
];

const distintivoOptions = [
  { value: '', label: 'Todos' },
  { value: 'verificado', label: 'Proveedor Verificado' },
  { value: 'destacado', label: 'Proveedor Destacado' },
];

const precioOptions = [
  { value: '', label: 'Cualquiera' },
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
];

const disponibilidadOptions = [
  { value: '', label: 'Cualquiera' },
  { value: 'si', label: 'Con servicios disponibles' },
  { value: 'no', label: 'Incluye sin disponibilidad' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'valoracion', label: 'Valoración' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'antiguedad', label: 'Antigüedad' },
  { value: 'transacciones', label: 'Transacciones' },
];

const STORAGE_KEY = 'proveedores_preferencias';

const filtrosIniciales: Filters = {
  busqueda: '',
  categorias: [],
  valoracionMin: 0,
  rangoPrecio: '',
  antiguedad: '',
  distintivo: '',
  disponibilidad: '',
};

function formatearAntiguedad(meses?: number) {
  const total = meses || 0;
  if (total < 1) return 'Menos de 1 mes';
  if (total < 12) return `${total} ${total === 1 ? 'mes' : 'meses'}`;
  const anios = Math.floor(total / 12);
  const resto = total % 12;
  const anioTexto = `${anios} ${anios === 1 ? 'año' : 'años'}`;
  return resto > 0 ? `${anioTexto} y ${resto} ${resto === 1 ? 'mes' : 'meses'}` : anioTexto;
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<ProveedorLista[]>([]);
  const [meta, setMeta] = useState<MetaBusqueda | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('valoracion');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [historial, setHistorial] = useState<string[]>([]);

  const [filters, setFilters] = useState<Filters>(filtrosIniciales);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.filters) setFilters({ ...filtrosIniciales, ...parsed.filters });
        if (parsed.sortBy) setSortBy(parsed.sortBy);
        if (parsed.sortDir) setSortDir(parsed.sortDir);
      }
      const hist = localStorage.getItem('proveedores_historial');
      if (hist) setHistorial(JSON.parse(hist));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ filters, sortBy, sortDir }));
    } catch {}
  }, [filters, sortBy, sortDir]);

  const construirParams = useCallback(() => {
    const params: Record<string, string | number | boolean> = {
      pagina: page,
      por_pagina: ITEMS_PER_PAGE,
      ordenar_por: sortBy,
      orden_direccion: sortDir,
    };
    const busqueda = filters.busqueda.trim();
    if (busqueda) params.q = busqueda;
    if (filters.categorias.length > 0) params.id_categorias = filters.categorias.join(',');
    if (filters.valoracionMin > 0) params.valoracion_minima = filters.valoracionMin;
    if (filters.rangoPrecio) params.rango_precio = filters.rangoPrecio;
    if (filters.distintivo === 'verificado') params.verificado = true;
    if (filters.distintivo === 'destacado') params.destacado = true;
    if (filters.disponibilidad === 'si') params.disponible = true;
    if (filters.disponibilidad === 'no') params.disponible = false;

    switch (filters.antiguedad) {
      case '0-3': params.antiguedad_max_meses = 3; break;
      case '3-6': params.antiguedad_min_meses = 3; params.antiguedad_max_meses = 6; break;
      case '6-12': params.antiguedad_min_meses = 6; params.antiguedad_max_meses = 12; break;
      case '12+': params.antiguedad_min_meses = 12; break;
    }
    return params;
  }, [filters, page, sortBy, sortDir]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [provRes, catRes] = await Promise.allSettled([
        api.get('/proveedores', { params: construirParams() }),
        api.get('/catalogo/categorias'),
      ]);

      if (provRes.status === 'fulfilled') {
        const body = extractData<RespuestaLista<ProveedorLista>>(provRes.value);
        setProveedores(Array.isArray(body) ? body : body?.data || []);
        setMeta((!Array.isArray(body) && body?.meta ? body.meta : null) as MetaBusqueda | null);
      } else {
        setProveedores([]);
      }

      if (catRes.status === 'fulfilled') {
        const cats = extractData<RespuestaLista<Categoria>>(catRes.value);
        setCategorias(Array.isArray(cats) ? cats : cats?.data || []);
      }
    } catch {
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  }, [construirParams]);

  useEffect(() => {
    if (!filters.busqueda) {
      fetchData();
      return;
    }
    const timer = setTimeout(() => { fetchData(); }, BUSQUEDA_RETARDO);
    return () => clearTimeout(timer);
  }, [fetchData, filters.busqueda]);

  useEffect(() => { setPage(1); }, [filters, sortBy, sortDir]);

  const addHistorial = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...historial.filter((h) => h !== term)].slice(0, 5);
    setHistorial(updated);
    try { localStorage.setItem('proveedores_historial', JSON.stringify(updated)); } catch {}
  };

  const totalPages = Math.max(meta?.total_paginas || 1, 1);
  const totalResultados = meta?.total ?? proveedores.length;
  const sinResultados = !loading && !!filters.busqueda.trim() && proveedores.length === 0;

  const rubrosSugeridos = useMemo(() => {
    const palabras = filters.busqueda.toLowerCase().split(/\s+/).filter(Boolean);
    const similares = categorias.filter((c) =>
      palabras.some((p) => c.nombre.toLowerCase().includes(p))
    );
    return (similares.length > 0 ? similares : categorias).slice(0, 4);
  }, [categorias, filters.busqueda]);

  useEffect(() => {
    if (!sinResultados) return;
    const matchCategoria = categorias.find((c) =>
      c.nombre.toLowerCase().includes(filters.busqueda.trim().toLowerCase())
    );
    reportarBusquedaFallida({
      consulta: filters.busqueda.trim(),
      tipo: matchCategoria ? 'rubro' : 'servicio',
      ...(matchCategoria ? { id_categoria: matchCategoria.id_categoria } : {}),
    });
  }, [sinResultados, filters.busqueda, categorias]);

  const toggleCategoria = (id: number) => {
    setFilters((f) => ({
      ...f,
      categorias: f.categorias.includes(id)
        ? f.categorias.filter((c) => c !== id)
        : [...f.categorias, id],
    }));
  };

  const clearFilters = () => setFilters(filtrosIniciales);

  const handleSearch = (value: string) => {
    setFilters((f) => ({ ...f, busqueda: value }));
    if (value.length >= 2) {
      const nombres = proveedores
        .map((p) => [p.nombre, p.apellido, p.rubro_principal].filter(Boolean))
        .flat()
        .filter((n): n is string => Boolean(n))
        .filter((n) => n.toLowerCase().includes(value.toLowerCase()));
      setSugerencias([...new Set(nombres)].slice(0, 5));
      setShowSugerencias(true);
    } else {
      setShowSugerencias(false);
    }
  };

  const selectSugerencia = (s: string) => {
    setFilters((f) => ({ ...f, busqueda: s }));
    setShowSugerencias(false);
    addHistorial(s);
  };

  const handleSearchSubmit = () => {
    setShowSugerencias(false);
    addHistorial(filters.busqueda);
  };

  const aplicarRubro = (id: number) => {
    setFilters((f) => ({ ...f, busqueda: '', categorias: [id] }));
  };

  const activeFiltersCount = [
    filters.categorias.length > 0,
    filters.valoracionMin > 0,
    filters.rangoPrecio !== '',
    filters.antiguedad !== '',
    filters.distintivo !== '',
    filters.disponibilidad !== '',
  ].filter(Boolean).length;

  return (
    <>
      {/* Hero with search */}
      <div className="bg-slate-900/50 border-b border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-2">Encontrá tu Proveedor</h1>
          <p className="text-slate-400 mb-6">Buscá por nombre, rubro o servicio</p>

          {/* Search bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar proveedores..."
                value={filters.busqueda}
                onChange={(e) => handleSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowSugerencias(false), 200)}
                onFocus={() => filters.busqueda.length >= 2 && setShowSugerencias(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Buscar proveedores"
              />
              {showSugerencias && sugerencias.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  {sugerencias.map((s, i) => (
                    <button
                      key={i}
                      onMouseDown={() => selectSugerencia(s)}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                    >
                      <Search className="w-4 h-4 text-slate-500" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              aria-label="Filtros avanzados"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 bg-cyan-500 text-white text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Search history */}
          {historial.length > 0 && !filters.busqueda && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">Recientes:</span>
              {historial.map((h, i) => (
                <button
                  key={i}
                  onClick={() => selectSugerencia(h)}
                  className="text-xs px-2 py-1 bg-slate-800/50 text-slate-400 rounded-lg hover:text-white transition-colors"
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats bar */}
        <div className="flex flex-wrap gap-6 mb-6 text-sm" aria-live="polite">
          <div className="flex items-center gap-2 text-slate-400">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>
              <span className="text-white font-semibold">{meta?.total_registrados ?? 0}</span> registrados ·{' '}
              <span className="text-white font-semibold">{meta?.total_proveedores ?? 0}</span> activos
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <span><span className="text-white font-semibold">{meta?.total_rubros ?? 0}</span> rubros</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <LlaveIcon className="w-4 h-4 text-yellow-400" />
            <span>Promedio: <span className="text-white font-semibold">
              {Number(meta?.promedio_general ?? 0).toFixed(1)}
            </span></span>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <Card className="mb-6">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Filtros Avanzados</h3>
                <button onClick={clearFilters} className="text-xs text-slate-400 hover:text-white">
                  Limpiar todo
                </button>
              </div>

              {/* Categorías */}
              <div>
                <label htmlFor="filtro-rubro" className="text-xs text-slate-400 mb-2 block">Rubro</label>
                <div id="filtro-rubro" className="flex flex-wrap gap-2">
                  {categorias.map((c) => (
                    <button
                      key={c.id_categoria}
                      onClick={() => toggleCategoria(c.id_categoria)}
                      aria-pressed={filters.categorias.includes(c.id_categoria)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filters.categorias.includes(c.id_categoria)
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:text-white'
                      }`}
                    >
                      {c.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Valoración mínima */}
                <div>
                  <span id="filtro-valoracion" className="text-xs text-slate-400 mb-1 block">Valoración mínima</span>
                  <div className="flex items-center gap-1" role="group" aria-labelledby="filtro-valoracion">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setFilters((f) => ({ ...f, valoracionMin: f.valoracionMin === n ? 0 : n }))}
                        className="p-1"
                        aria-label={`${n} llaves o más`}
                        aria-pressed={filters.valoracionMin === n}
                      >
                        <LlaveIcon className={`w-5 h-5 ${
                          n <= filters.valoracionMin ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rango de precios */}
                <div>
                  <label htmlFor="filtro-precio" className="text-xs text-slate-400 mb-1 block">Rango de precios</label>
                  <select
                    id="filtro-precio"
                    value={filters.rangoPrecio}
                    onChange={(e) => setFilters((f) => ({ ...f, rangoPrecio: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    {precioOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Antigüedad */}
                <div>
                  <label htmlFor="filtro-antiguedad" className="text-xs text-slate-400 mb-1 block">Antigüedad</label>
                  <select
                    id="filtro-antiguedad"
                    value={filters.antiguedad}
                    onChange={(e) => setFilters((f) => ({ ...f, antiguedad: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    {antiguedadOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Distintivo */}
                <div>
                  <label htmlFor="filtro-distintivo" className="text-xs text-slate-400 mb-1 block">Distintivo</label>
                  <select
                    id="filtro-distintivo"
                    value={filters.distintivo}
                    onChange={(e) => setFilters((f) => ({ ...f, distintivo: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    {distintivoOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Disponibilidad */}
                <div>
                  <label htmlFor="filtro-disponibilidad" className="text-xs text-slate-400 mb-1 block">Disponibilidad</label>
                  <select
                    id="filtro-disponibilidad"
                    value={filters.disponibilidad}
                    onChange={(e) => setFilters((f) => ({ ...f, disponibilidad: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                  >
                    {disponibilidadOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Ordenamiento */}
                <div>
                  <label htmlFor="filtro-orden" className="text-xs text-slate-400 mb-1 block">Ordenar por</label>
                  <div className="flex gap-1">
                    <select
                      id="filtro-orden"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                    >
                      {sortOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                      className="px-2 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-400 hover:text-white"
                      aria-label={`Dirección: ${sortDir === 'asc' ? 'ascendente' : 'descendente'}`}
                    >
                      <ArrowUpDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : proveedores.length === 0 ? (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No se encontraron proveedores</h2>
            <p className="text-slate-400 mb-4">Intentá con otros filtros o términos de búsqueda</p>

            {rubrosSugeridos.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-slate-500 mb-2">Rubros similares disponibles:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {rubrosSugeridos.map((r) => (
                    <button
                      key={r.id_categoria}
                      onClick={() => aplicarRubro(r.id_categoria)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/40 transition-colors"
                    >
                      {r.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/proveedores/solicitud"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Solicitar nuevo rubro
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-400 mb-4" aria-live="polite">
              {totalResultados} proveedor{totalResultados !== 1 ? 'es' : ''} encontrado{totalResultados !== 1 ? 's' : ''}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proveedores.map((prov) => (
                <Card key={prov.id_perfil_proveedor ?? prov.id_usuario} hover className="h-full">
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xl font-bold">
                          {prov.nombre?.[0] || 'P'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white truncate">
                            <Link href={`/proveedores/${prov.id_usuario}`} className="hover:text-cyan-300">
                              {prov.nombre} {prov.apellido}
                            </Link>
                          </h3>
                          {prov.proveedor_destacado && (
                            <Award className="w-4 h-4 text-yellow-400 flex-shrink-0" aria-label="Proveedor destacado" />
                          )}
                        </div>
                        <p className="text-sm text-slate-400 truncate">{prov.rubro_principal || 'Proveedor'}</p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <LlaveIcon
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(prov.calificacion_promedio || 0)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-600'
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-white font-medium">
                        {Number(prov.calificacion_promedio ?? 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({prov.cantidad_valoraciones ?? 0} reseñas)
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-4">
                      {prov.sello_verificado && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
                          <Shield className="w-3 h-3" />
                          Verificado
                        </span>
                      )}
                      {prov.proveedor_destacado && (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-lg">
                          <Award className="w-3 h-3" />
                          Destacado
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                      {prov.descripcion || 'Proveedor verificado en la plataforma'}
                    </p>

                    {/* Footer stats */}
                    <div className="pt-4 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {prov.tasa_cumplimiento !== null && prov.tasa_cumplimiento !== undefined
                          ? `${Math.round(prov.tasa_cumplimiento)}% cumplimiento`
                          : 'Sin datos de cumplimiento'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatearAntiguedad(prov.antiguedad_meses)}
                      </span>
                    </div>

                    {/* Contacto */}
                    <Link
                      href={`/proveedores/${prov.id_usuario}/servicios`}
                      className="mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition-colors"
                      aria-label={`Ver servicios y contacto de ${prov.nombre || 'este proveedor'}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Contacto y servicios
                    </Link>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      aria-current={page === pageNum ? 'page' : undefined}
                      aria-label={`Página ${pageNum}`}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
