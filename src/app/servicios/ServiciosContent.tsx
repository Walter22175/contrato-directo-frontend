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
    <div className="min-h-screen bg-void-navy">
      <main className="flex-1">
        <div className="border-b border-inkline-violet/60 bg-deep-indigo/50 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="galileo-eyebrow text-signal-teal">Catálogo</p>
            <h1 className="mb-6 mt-3 text-3xl font-extralight text-pure-white sm:text-4xl">Buscar Servicios</h1>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-mist-lilac" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="¿Qué servicio buscás? (ej: plomería, electricidad, plomero...)"
                    value={busqueda}
                    onChange={handleSearchChange}
                    onFocus={() => busqueda && setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    className="w-full rounded-full border border-inkline-violet bg-deep-indigo/80 py-3.5 pl-14 pr-5 text-base font-light text-pure-white placeholder:text-mist-lilac transition-colors focus:border-pulse-cobalt focus:outline-none focus:ring-2 focus:ring-pulse-cobalt/40"
                  />
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <div ref={suggestionsRef} className="absolute left-0 right-0 top-full z-50 mt-3 max-h-96 overflow-y-auto rounded-[28px] border border-inkline-violet bg-deep-indigo shadow-2xl shadow-black/50">
                      {suggestions.map((sug, i) => (
                        <button
                          key={i}
                          onClick={() => handleSuggestionClick(sug)}
                          className="flex w-full items-center gap-3 border-b border-inkline-violet/40 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/5"
                        >
                          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border ${
                            sug.type === 'categoria' ? 'border-inkline-violet/40 bg-glacier-white' : 'border-pulse-cobalt/30 bg-pulse-cobalt/10 text-pulse-cobalt'
                          }`}>
                            {sug.type === 'categoria' ? (
                              iconoCategoria(sug.label) ? (
                                <Image src={iconoCategoria(sug.label)!} alt="" width={32} height={32} unoptimized className="h-7 w-7 object-contain" />
                              ) : (
                                <Box className="h-6 w-6 text-deep-indigo" />
                              )
                            ) : (
                              <Search className="h-6 w-6" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate font-normal text-pure-white">{sug.label}</span>
                            {sug.type === 'categoria' && sug.count && (
                              <span className="text-xs font-light text-mist-lilac">{sug.count} servicios</span>
                            )}
                            {sug.type === 'servicio' && (
                              <span className="text-xs font-light text-mist-lilac">Servicio individual</span>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-mist-lilac" />
                        </button>
                      ))}
                      {suggestions.length === 0 && busqueda && (
                        <div className="px-4 py-3 text-center text-sm font-light text-mist-lilac">
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
                    className="py-3.5"
                  />
                </div>
              </div>
              
              {showSuggestions && suggestions.length > 0 && (
                <p className="mt-3 pl-2 text-xs font-light text-mist-lilac">
                  Click en una sugerencia o seguí escribiendo para refinar
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-[35px] border border-inkline-violet/40 bg-deep-indigo/60" />
              ))}
            </div>
          ) : (
            <>
              {busqueda || categoria ? (
                <p className="mb-6 text-sm font-light text-quartz-lavender">
                  {filtered.length} servicio{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''} 
                  {filteredCategorias.length > 0 && (
                    <> + {filteredCategorias.length} categorí{filteredCategorias.length === 1 ? 'a' : 'as'} relacionada{filteredCategorias.length === 1 ? '' : 's'} </>
                  )}
                </p>
              ) : (
                <p className="mb-6 text-sm font-light text-quartz-lavender">{servicios.length} servicios disponibles en {categorias.length} categorías</p>
              )}

              {sinResultados ? (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-inkline-violet/60 bg-deep-indigo/70">
                    <Search className="h-8 w-8 text-mist-lilac" />
                  </div>
                  <h2 className="mb-2 text-2xl font-extralight text-pure-white">No se encontraron resultados</h2>
                  <p className="mb-8 text-sm font-light text-mist-lilac">Intentá con otros términos de búsqueda</p>
                  <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/proveedores/solicitud"
                      className="inline-flex items-center gap-2 rounded-full bg-pulse-cobalt px-5 py-2.5 text-sm font-light text-pure-white transition-colors hover:bg-[#2c3bd0]"
                    >
                      <FilePlus className="h-4 w-4" />
                      Solicitar {'"'}{busqueda.trim()}{'"'} como nuevo servicio
                    </Link>
                    <Link
                      href="/proveedores"
                      className="inline-flex items-center gap-2 rounded-full border border-inkline-violet bg-white/5 px-5 py-2.5 text-sm font-light text-quartz-lavender transition-colors hover:border-dusk-iris hover:text-white"
                    >
                      Buscar proveedores
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {/* Categorías como bloques si hay coincidencia en búsqueda */}
                  {busqueda && filteredCategorias.length > 0 && (
                    <div className="mb-10">
                      <h3 className="mb-4 flex items-center gap-2 text-lg font-light text-pure-white">
                        <Box className="h-5 w-5 text-pulse-cobalt" />
                        Categorías relacionadas
                      </h3>
                      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {filteredCategorias.map((cat) => {
                          const count = servicios.filter(s => s.id_categoria?.toString() === cat.id_categoria.toString()).length;
                          const catHref = '/servicios?categoria=' + cat.id_categoria;
                          return (
                            <Link key={cat.id_categoria} href={catHref} className="group">
                              <Card className="flex min-h-[12rem] flex-col items-center justify-center p-6 text-center transition-colors group-hover:border-pulse-cobalt/60">
                                {iconoCategoria(cat.nombre) && (
                                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-inkline-violet/40 bg-glacier-white transition-transform duration-300 group-hover:scale-110">
                                    <Image src={iconoCategoria(cat.nombre)!} alt="" width={96} height={96} unoptimized className="h-12 w-12 object-contain" />
                                  </div>
                                )}
                                <h4 className="mb-1 text-base font-light text-pure-white">{cat.nombre}</h4>
                                <p className="text-xs font-light text-mist-lilac">{count} servicio{count === 1 ? '' : 's'}</p>
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
                        <h3 className="mb-4 text-lg font-light text-pure-white">Servicios encontrados</h3>
                      )}
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filtered.map((s) => {
                          const servHref = '/servicios/' + s.id_servicio;
                          const icono = iconoServicio(s.nombre, s.categoria?.nombre);
                          return (
                            <Link key={s.id_servicio} href={servHref} className="group">
                              <Card hover className="flex h-full flex-col p-6">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] border border-inkline-violet/50 bg-glacier-white transition-transform duration-300 group-hover:scale-105">
                                    {icono ? (
                                      <Image src={icono} alt="" width={96} height={96} unoptimized className="h-12 w-12 object-contain" />
                                    ) : (
                                      <span className="text-3xl">🔧</span>
                                    )}
                                  </div>
                                  <span className="max-w-[58%] truncate rounded-full border border-inkline-violet/60 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-mist-lilac" title={s.categoria?.nombre || 'Servicio'}>
                                    {s.categoria?.nombre || 'Servicio'}
                                  </span>
                                </div>
                                <h3 className="mt-5 text-lg font-light text-pure-white transition-colors group-hover:text-cyan-200">{s.nombre}</h3>
                                <div className="mt-6 flex items-center justify-between border-t border-inkline-violet/40 pt-4 text-sm">
                                  <div className="flex items-center gap-1.5 text-quartz-lavender">
                                    <LlaveIcon className="h-4 w-4 text-yellow-400" />
                                    <span className="font-light">4.8</span>
                                  </div>
                                  <span className="font-light text-signal-teal">
                                    {s.servicios_proveedor?.length || 0} proveedores
                                  </span>
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