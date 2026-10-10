'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import api, { extractData } from '@/lib/api';
import { reportarBusquedaFallida } from '@/lib/catalogo';
import { iconoCategoria, iconoServicio } from '@/lib/iconos';
import { Search, ChevronRight, Box, FilePlus } from 'lucide-react';
import { LlaveIcon } from '@/components/ui/LlaveIcon';
import type { Servicio, Categoria } from '@/types';

interface SearchSuggestion {
  type: 'categoria' | 'servicio';
  label: string;
  value: string;
  count?: number;
}

export default function ServiciosContent() {
  const router = useRouter();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [servRes, catRes] = await Promise.all([
          api.get('/servicios', { params: { activo: true } }),
          api.get('/catalogo/categorias', { params: { activa: true } }),
        ]);
        const servRaw = extractData<Servicio[] | { data?: Servicio[] }>(servRes);
        const catRaw = extractData<Categoria[] | { data?: Categoria[] }>(catRes);
        setServicios((Array.isArray(servRaw) ? servRaw : servRaw.data) || []);
        const cats = (Array.isArray(catRaw) ? catRaw : catRaw.data) || [];
        setCategorias(cats);

        const params = new URLSearchParams(window.location.search);
        const catSlug = params.get('categoria') || '';
        const q = params.get('q') || '';
        if (q) setBusqueda(q);
        
        if (catSlug) {
          const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/-/g, ' ').toLowerCase();
          const match = cats.find((c) => {
            const n = norm(c.nombre);
            const slug = norm(catSlug);
            return n === slug || n.startsWith(slug) || slug.startsWith(n);
          });
          if (match) setCategoria(match.id_categoria.toString());
        }
      } catch (e) {
        console.error('Error fetching servicios:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return servicios.filter((s) => {
      const matchBusqueda = !busqueda || s.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const matchCategoria = !categoria || s.id_categoria?.toString() === categoria;
      return matchBusqueda && matchCategoria;
    });
  }, [servicios, busqueda, categoria]);

  const filteredCategorias = useMemo(() => {
    if (!busqueda) return [];
    return categorias.filter((c) => 
      c.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [categorias, busqueda]);

  const sinResultados = !loading && (busqueda || categoria) &&
    filtered.length === 0 && filteredCategorias.length === 0;

  useEffect(() => {
    if (!sinResultados || !busqueda.trim()) return;
    const catId = categoria ? parseInt(categoria, 10) : undefined;
    reportarBusquedaFallida({
      consulta: busqueda.trim(),
      tipo: 'servicio',
      ...(catId ? { id_categoria: catId } : {}),
    });
  }, [sinResultados, busqueda, categoria]);

  const opcionesCategorias = useMemo(
    () => categorias.map((c) => ({ value: c.id_categoria.toString(), label: c.nombre })),
    [categorias],
  );

  const generateSuggestions = useCallback(() => {
    if (!busqueda.trim()) {
      setSuggestions([]);
      return;
    }

    const query = busqueda.toLowerCase();
    const sug: SearchSuggestion[] = [];

    // Categoría suggestions
    const catMatches = categorias
      .filter((c) => c.nombre.toLowerCase().includes(query))
      .slice(0, 3)
      .map((c) => ({
        type: 'categoria' as const,
        label: c.nombre,
        value: c.id_categoria.toString(),
        count: servicios.filter(s => s.id_categoria?.toString() === c.id_categoria.toString()).length,
      }));

    // Servicio suggestions
    const servMatches = servicios
      .filter((s) => s.nombre.toLowerCase().includes(query))
      .slice(0, 5)
      .map((s) => ({
        type: 'servicio' as const,
        label: s.nombre,
        value: s.id_servicio.toString(),
      }));

    sug.push(...catMatches, ...servMatches);
    setSuggestions(sug);
  }, [busqueda, categorias, servicios]);

  useEffect(() => {
    generateSuggestions();
    setShowSuggestions(busqueda.length > 0);
  }, [generateSuggestions, busqueda.length]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBusqueda(value);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'categoria') {
      setCategoria(suggestion.value);
      setBusqueda('');
      router.push(`/servicios?categoria=${suggestion.value}`);
    } else {
      router.push(`/servicios/${suggestion.value}`);
    }
    setShowSuggestions(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busqueda.trim()) {
      router.push(`/servicios?q=${encodeURIComponent(busqueda.trim())}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node) &&
          suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="bg-slate-900/50 border-b border-slate-800 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-white mb-6">Buscar Servicios</h1>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="¿Qué servicio buscás? (ej: plomería, electricidad, plomero...)"
                    value={busqueda}
                    onChange={handleSearchChange}
                    onFocus={() => busqueda && setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full pl-11 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                      {suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(sug)}
                          className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-slate-700/50 last:border-0"
                        >
                          <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            sug.type === 'categoria' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
                          }`}>
                            {sug.type === 'categoria' ? (
                              iconoCategoria(sug.label) ? (
                                <Image src={iconoCategoria(sug.label)!} alt="" width={32} height={32} unoptimized className="w-8 h-8 object-contain" />
                              ) : (
                                <Box className="w-8 h-8" />
                              )
                            ) : (
                              <Search className="w-8 h-8" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-white font-medium truncate block">{sug.label}</span>
                            {sug.type === 'categoria' && sug.count && (
                              <span className="text-xs text-slate-500">{sug.count} servicios</span>
                            )}
                            {sug.type === 'servicio' && (
                              <span className="text-xs text-slate-500">Servicio individual</span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-500" />
                        </button>
                      ))}
                      {suggestions.length === 0 && busqueda && (
                        <div className="px-4 py-3 text-center text-slate-500">
                          No se encontraron sugerencias para {'"'}{busqueda}{'"'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="w-full md:w-64">
                  <Select
                    options={opcionesCategorias}
                    placeholder="Todas las categorías"
                    value={categoria}
                    onChange={(e) => {
                      setCategoria(e.target.value);
                      setShowSuggestions(false);
                      if (e.target.value) {
                        router.push(`/servicios?categoria=${e.target.value}`);
                      } else {
                        router.push('/servicios');
                      }
                    }}
                  />
                </div>
              </div>
              
              {showSuggestions && suggestions.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Click en una sugerencia o seguí escribiendo para refinar
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {busqueda || categoria ? (
                <p className="text-slate-400 mb-6">
                  {filtered.length} servicio{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''} 
                  {filteredCategorias.length > 0 && (
                    <> + {filteredCategorias.length} categorí{filteredCategorias.length === 1 ? 'a' : 'as'} relacionada{filteredCategorias.length === 1 ? '' : 's'} </>
                  )}
                </p>
              ) : (
                <p className="text-slate-400 mb-6">{servicios.length} servicios disponibles en {categorias.length} categorías</p>
              )}

              {sinResultados ? (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">No se encontraron resultados</h2>
                  <p className="text-slate-400 mb-6">Intentá con otros términos de búsqueda</p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      href="/proveedores/solicitud"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-medium transition-colors"
                    >
                      <FilePlus className="w-4 h-4" />
                      Solicitar {'"'}{busqueda.trim()}{'"'} como nuevo servicio
                    </Link>
                    <Link
                      href="/proveedores"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-medium transition-colors"
                    >
                      Buscar proveedores
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Categorías como bloques si hay coincidencia en búsqueda */}
                  {busqueda && filteredCategorias.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Box className="w-5 h-5 text-purple-400" />
                        Categorías relacionadas
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredCategorias.map((cat) => {
                          const count = servicios.filter(s => s.id_categoria?.toString() === cat.id_categoria.toString()).length;
                          const catHref = '/servicios?categoria=' + cat.id_categoria;
                          return (
                            <Link key={cat.id_categoria} href={catHref} className="group">
                              <Card className="p-4 text-center relative overflow-hidden min-h-[12rem] flex flex-col justify-end hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 bg-slate-800/50 border-slate-700">
                                {iconoCategoria(cat.nombre) && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-110">
                                    <Image src={iconoCategoria(cat.nombre)!} alt="" width={96} height={96} unoptimized className="w-24 h-24 object-contain" />
                                  </div>
                                )}
                                <div className="relative">
                                  <h4 className="font-medium text-white mb-1">{cat.nombre}</h4>
                                  <p className="text-xs text-slate-400">{count} servicio{count === 1 ? '' : 's'}</p>
                                </div>
                              </Card>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Servicios individuales */}
                  {filtered.length > 0 && (
                    <div>
                      {busqueda && filteredCategorias.length > 0 && (
                        <h3 className="text-lg font-semibold text-white mb-4">Servicios encontrados</h3>
                      )}
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((s) => {
                          const servHref = '/servicios/' + s.id_servicio;
                          const icono = iconoServicio(s.nombre, s.categoria?.nombre);
                          return (
                            <Link key={s.id_servicio} href={servHref} className="group">
                              <Card hover className="h-full relative overflow-hidden">
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover:scale-105">
                                    {icono ? (
                                      <Image src={icono} alt="" width={96} height={96} unoptimized className="w-24 h-24 object-contain" />
                                    ) : (
                                      <span className="text-[6rem] leading-none">🔧</span>
                                    )}
                                  </div>
                                <div className="relative">
                                  <h3 className="text-sm font-semibold text-white mb-2">{s.nombre}</h3>
                                  <div className="flex items-center justify-between text-sm mt-6">
                                    <div className="flex items-center gap-1 text-slate-400">
                                      <LlaveIcon className="w-4 h-4 text-yellow-400" />
                                      <span>4.8</span>
                                    </div>
                                    <span className="text-cyan-400 font-medium">
                                      {s.servicios_proveedor?.length || 0} proveedores
                                    </span>
                                  </div>
                                </div>
                              </Card>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}