'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card } from '@/components/ui/Card';
import api, { extractData } from '@/lib/api';
import {
  Search, Star, Shield, Award, ChevronLeft, ChevronRight,
  SlidersHorizontal, X, ArrowUpDown, Clock, TrendingUp, Users
} from 'lucide-react';
import type { PerfilProveedor, Usuario, Categoria } from '@/types';

type ProveedorConPerfil = PerfilProveedor & { usuario?: Partial<Usuario> };

type SortOption = 'valoracion' | 'nombre' | 'antiguedad' | 'transacciones';
type SortDir = 'asc' | 'desc';

interface Filters {
  busqueda: string;
  categorias: number[];
  valoracionMin: number;
  rangoPrecio: string;
  antiguedad: string;
  distintivo: string;
}

const ITEMS_PER_PAGE = 20;

const rangoPrecioOptions = [
  { value: '', label: 'Todos' },
  { value: 'bajo', label: 'Bajo' },
  { value: 'medio', label: 'Medio' },
  { value: 'alto', label: 'Alto' },
];

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

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'valoracion', label: 'Valoración' },
  { value: 'nombre', label: 'Nombre' },
  { value: 'antiguedad', label: 'Antigüedad' },
  { value: 'transacciones', label: 'Transacciones' },
];

const STORAGE_KEY = 'proveedores_preferencias';

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<ProveedorConPerfil[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('valoracion');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [sugerencias, setSugerencias] = useState<string[]>([]);
  const [showSugerencias, setShowSugerencias] = useState(false);
  const [historial, setHistorial] = useState<string[]>([]);

  const [filters, setFilters] = useState<Filters>({
    busqueda: '',
    categorias: [],
    valoracionMin: 0,
    rangoPrecio: '',
    antiguedad: '',
    distintivo: '',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.filters) setFilters(parsed.filters);
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [provRes, catRes] = await Promise.allSettled([
        api.get('/proveedores'),
        api.get('/catalogo/categorias'),
      ]);
      const provData = provRes.status === 'fulfilled' ? extractData<any>(provRes.value) : null;
      const catData = catRes.status === 'fulfilled' ? extractData<any>(catRes.value) : null;
      setProveedores(provData?.data || provData || []);
      setCategorias(catData?.data || catData || []);
    } catch {
      setProveedores([]);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addHistorial = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...historial.filter((h) => h !== term)].slice(0, 5);
    setHistorial(updated);
    try { localStorage.setItem('proveedores_historial', JSON.stringify(updated)); } catch {}
  };

  const stats = useMemo(() => {
    const total = proveedores.length;
    const rubros = new Set(proveedores.map((p) => p.rubro_principal).filter(Boolean)).size;
    const promedio = proveedores.length
      ? (proveedores.reduce((acc, p) => acc + (p.calificacion_promedio || 0), 0) / proveedores.length).toFixed(1)
      : '0.0';
    return { total, rubros, promedio };
  }, [proveedores]);

  const filtered = useMemo(() => {
    let result = proveedores.filter((p) => {
      const search = filters.busqueda.toLowerCase();
      if (search) {
        const matchNombre = p.usuario?.nombre?.toLowerCase().includes(search);
        const matchApellido = p.usuario?.apellido?.toLowerCase().includes(search);
        const matchRubro = p.rubro_principal?.toLowerCase().includes(search);
        const matchDesc = p.descripcion?.toLowerCase().includes(search);
        if (!matchNombre && !matchApellido && !matchRubro && !matchDesc) return false;
      }
      if (filters.categorias.length > 0 && p.rubro_principal) {
        const catMatch = categorias.find((c) =>
          filters.categorias.includes(c.id_categoria) && c.nombre === p.rubro_principal
        );
        if (!catMatch) return false;
      }
      if (filters.valoracionMin > 0 && (p.calificacion_promedio || 0) < filters.valoracionMin) return false;
      if (filters.antiguedad) {
        const meses = p.antiguedad_meses || 0;
        switch (filters.antiguedad) {
          case '0-3': if (meses >= 3) return false; break;
          case '3-6': if (meses < 3 || meses >= 6) return false; break;
          case '6-12': if (meses < 6 || meses >= 12) return false; break;
          case '12+': if (meses < 12) return false; break;
        }
      }
      if (filters.distintivo === 'verificado' && !p.sello_verificado) return false;
      if (filters.distintivo === 'destacado' && !p.proveedor_destacado) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'valoracion': cmp = (a.calificacion_promedio || 0) - (b.calificacion_promedio || 0); break;
        case 'nombre': cmp = (a.usuario?.nombre || '').localeCompare(b.usuario?.nombre || ''); break;
        case 'antiguedad': cmp = (a.antiguedad_meses || 0) - (b.antiguedad_meses || 0); break;
        case 'transacciones': cmp = (a.cantidad_valoraciones || 0) - (b.cantidad_valoraciones || 0); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [proveedores, filters, sortBy, sortDir, categorias]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  useEffect(() => { setPage(1); }, [filters, sortBy, sortDir]);

  const toggleCategoria = (id: number) => {
    setFilters((f) => ({
      ...f,
      categorias: f.categorias.includes(id)
        ? f.categorias.filter((c) => c !== id)
        : [...f.categorias, id],
    }));
  };

  const clearFilters = () => {
    setFilters({ busqueda: '', categorias: [], valoracionMin: 0, rangoPrecio: '', antiguedad: '', distintivo: '' });
  };

  const handleSearch = (value: string) => {
    setFilters((f) => ({ ...f, busqueda: value }));
    if (value.length >= 2) {
      const matches = proveedores
        .map((p) => [p.usuario?.nombre, p.rubro_principal].filter(Boolean))
        .flat()
        .filter((n): n is string => Boolean(n))
        .filter((n) => n.toLowerCase().includes(value.toLowerCase()));
      setSugerencias([...new Set(matches)].slice(0, 5));
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

  const activeFiltersCount = [
    filters.categorias.length > 0,
    filters.valoracionMin > 0,
    filters.rangoPrecio !== '',
    filters.antiguedad !== '',
    filters.distintivo !== '',
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
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
          <div className="flex flex-wrap gap-6 mb-6 text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="w-4 h-4 text-cyan-400" />
              <span><span className="text-white font-semibold">{stats.total}</span> proveedores</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span><span className="text-white font-semibold">{stats.rubros}</span> rubros</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Promedio: <span className="text-white font-semibold">{stats.promedio}</span></span>
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
                  <label className="text-xs text-slate-400 mb-2 block">Rubro</label>
                  <div className="flex flex-wrap gap-2">
                    {categorias.map((c) => (
                      <button
                        key={c.id_categoria}
                        onClick={() => toggleCategoria(c.id_categoria)}
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
                    <label className="text-xs text-slate-400 mb-1 block">Valoración mínima</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onClick={() => setFilters((f) => ({ ...f, valoracionMin: f.valoracionMin === n ? 0 : n }))}
                          className="p-1"
                          aria-label={`${n} estrellas o más`}
                        >
                          <Star className={`w-5 h-5 ${
                            n <= filters.valoracionMin ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'
                          }`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Antigüedad */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Antigüedad</label>
                    <select
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
                    <label className="text-xs text-slate-400 mb-1 block">Distintivo</label>
                    <select
                      value={filters.distintivo}
                      onChange={(e) => setFilters((f) => ({ ...f, distintivo: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm"
                    >
                      {distintivoOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ordenamiento */}
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Ordenar por</label>
                    <div className="flex gap-1">
                      <select
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
                        aria-label="Cambiar dirección"
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
          ) : paginated.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No se encontraron proveedores</h2>
              <p className="text-slate-400 mb-6">Intentá con otros filtros o términos de búsqueda</p>
              <Link
                href="/proveedores/solicitud"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Solicitar nuevo rubro
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400 mb-4">
                {filtered.length} proveedor{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
              </p>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginated.map((prov) => (
                  <Link key={prov.id_perfil_proveedor} href={`/proveedores/${prov.id_usuario}`}>
                    <Card hover className="h-full">
                      <div className="p-5">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xl font-bold">
                              {prov.usuario?.nombre?.[0] || 'P'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white truncate">
                                {prov.usuario?.nombre} {prov.usuario?.apellido}
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
                              <Star
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
                            {prov.calificacion_promedio?.toFixed(1) || '0.0'}
                          </span>
                          <span className="text-xs text-slate-500">
                            ({prov.cantidad_valoraciones} reseñas)
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
                            {prov.tasa_cumplimiento?.toFixed(0) || '95'}% cumplimiento
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {prov.antiguedad_meses} meses
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
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
      </main>
      <Footer />
    </div>
  );
}
