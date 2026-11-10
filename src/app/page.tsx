'use client';

import PromocionCarousel from '@/components/layout/PromocionCarousel';
import GaleriaClientes from '@/components/layout/GaleriaClientes';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Shield, FileText, Star, ArrowRight, ChevronRight, Box, Users, ShieldCheck, Sparkles, Award } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Promocion } from '@/types';
import type { Servicio } from '@/types';
import api, { extractData } from '@/lib/api';
import { iconoCategoria } from '@/lib/iconos';

const categories = [
  { name: 'Mantenimiento', icon: iconoCategoria('Mantenimiento y Reparaciones Domiciliarias'), fallback: '🔧', slug: 'mantenimiento' },
  { name: 'Automóviles', icon: iconoCategoria('Automóviles'), fallback: '🚗', slug: 'automoviles' },
  { name: 'Mascotas', icon: iconoCategoria('Mascotas'), fallback: '🐾', slug: 'mascotas' },
  { name: 'Tecnología', icon: iconoCategoria('Tecnología'), fallback: '💻', slug: 'tecnologia' },
  { name: 'Community Manager', icon: iconoCategoria('Community Manager'), fallback: '📱', slug: 'community-manager' },
  { name: 'Software', icon: iconoCategoria('Software'), fallback: '⚙️', slug: 'software' },
  { name: 'Paisajismo', icon: iconoCategoria('Paisajismo'), fallback: '🌿', slug: 'paisajismo' },
];

const features = [
  {
    icon: Shield,
    title: 'Pagos Seguros',
    description: 'Tu dinero está protegido hasta que el servicio sea completado y conformado.',
    href: '/ayuda/pagos-seguros',
  },
  {
    icon: FileText,
    title: 'Contratos Digitales',
    description: 'Contratos con validez legal que protegen a ambas partes.',
    href: '/ayuda/contratos-digitales',
  },
  {
    icon: Star,
    title: 'Proveedores Verificados',
    description: 'Todos nuestros proveedores pasan por un riguroso proceso de verificación.',
    href: '/ayuda/proveedores-verificados',
  },
];

interface SearchSuggestion {
  type: 'categoria' | 'servicio';
  label: string;
  value: string;
  slug?: string;
  id_servicio?: number;
}

interface TopProveedor {
  id_usuario: string;
  nombre?: string;
  apellido?: string;
  rubro_principal?: string;
  calificacion_promedio?: number | null;
  cantidad_valoraciones?: number;
  sello_verificado?: boolean;
  proveedor_destacado?: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [promocionesLoading, setPromocionesLoading] = useState(true);
  const [servicios, setServicios] = useState<Array<{id_servicio: number; nombre: string; id_categoria: number}>>([]);
  const [topProveedores, setTopProveedores] = useState<TopProveedor[]>([]);
  const [topLoading, setTopLoading] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchPromociones = useCallback(async () => {
    try {
      // /promociones/vigentes es público y está pensado para el home;
      // /promociones requiere rol admin. Ambos retornan { data, meta }.
      const res = await api.get('/promociones/vigentes');
      const raw = extractData<Promocion[] | { data?: Promocion[] }>(res);
      const lista = Array.isArray(raw) ? raw : raw?.data || [];
      setPromociones(Array.isArray(lista) ? lista : []);
    } catch { setPromociones([]); } finally {
      setPromocionesLoading(false);
    }
  }, []);

  const fetchServicios = useCallback(async () => {
    try {
      const res = await api.get('/servicios', { params: { activo: true } });
      const data = extractData<Servicio[] | { data?: Servicio[] }>(res);
      const servs = (Array.isArray(data) ? data : data.data) || [];
      setServicios(servs.map((s) => ({ id_servicio: s.id_servicio, nombre: s.nombre, id_categoria: s.id_categoria })));
    } catch {}
  }, []);

  useEffect(() => {
    fetchPromociones();
    fetchServicios();
  }, [fetchPromociones, fetchServicios]);

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const res = await api.get('/proveedores', {
          params: { ordenar_por: 'ranking', por_pagina: 6 },
        });
        const raw = extractData<TopProveedor[] | { data?: TopProveedor[] }>(res);
        const lista = Array.isArray(raw) ? raw : raw?.data || [];
        if (activo) setTopProveedores(Array.isArray(lista) ? lista.slice(0, 6) : []);
      } catch {
        if (activo) setTopProveedores([]);
      } finally {
        if (activo) setTopLoading(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  const generateSuggestions = useCallback(() => {
    if (!heroSearch.trim()) {
      setSuggestions([]);
      setSelectedIndex(-1);
      return;
    }

    const query = heroSearch.toLowerCase();
    const sug: SearchSuggestion[] = [];

    // Categoría suggestions from local categories
    const catMatches = categories
      .filter((c) => c.name.toLowerCase().includes(query))
      .slice(0, 5)
      .map((c) => ({
        type: 'categoria' as const,
        label: c.name,
        value: c.slug,
        slug: c.slug,
      }));

    // Actual servicios from database
    const servMatches = servicios
      .filter((s) => s.nombre.toLowerCase().includes(query))
      .slice(0, 5)
      .map((s) => ({
        type: 'servicio' as const,
        label: s.nombre,
        value: s.nombre,
        id_servicio: s.id_servicio,
      }));

    sug.push(...catMatches, ...servMatches);
    setSuggestions(sug);
    setSelectedIndex(-1);
  }, [heroSearch, servicios]);

  useEffect(() => {
    generateSuggestions();
    setShowSuggestions(heroSearch.length > 0);
  }, [generateSuggestions, heroSearch.length]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setHeroSearch(value);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'categoria' && suggestion.slug) {
      router.push(`/servicios?categoria=${suggestion.slug}`);
    } else if (suggestion.type === 'servicio' && suggestion.id_servicio) {
      router.push(`/servicios/${suggestion.id_servicio}`);
    } else {
      router.push(`/servicios?q=${encodeURIComponent(suggestion.value)}`);
    }
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSuggestionClick(suggestions[selectedIndex]);
      } else {
        handleHeroSearch(e as unknown as React.FormEvent);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = heroSearch.trim();
    if (query) router.push(`/servicios?q=${encodeURIComponent(query)}`);
    setShowSuggestions(false);
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

  return (
    <div className="flex min-h-screen flex-col bg-void-navy">

      {!promocionesLoading && (
        <PromocionCarousel promociones={promociones} />
      )}

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="galileo-grid absolute inset-0 opacity-70" aria-hidden="true" />
          <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-pulse-cobalt/20 blur-[150px]" aria-hidden="true" />
          <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-signal-teal/10 blur-[130px]" aria-hidden="true" />

          <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
            <div>
              <p className="galileo-eyebrow text-signal-teal">Plataforma de servicios verificados</p>
              <h1 className="mt-6 max-w-2xl text-4xl font-extralight leading-[0.95] text-pure-white sm:text-5xl lg:text-6xl xl:text-7xl">
                Conecta. <span className="galileo-text-gradient">Acuerda.</span> Realiza.
              </h1>
              <p className="mt-6 max-w-xl text-base font-light leading-relaxed text-quartz-lavender sm:text-lg">
                La plataforma que conecta clientes con proveedores de servicios de confianza. Contratos seguros, pagos protegidos.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleHeroSearch} className="relative mt-10 max-w-2xl">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1" ref={searchInputRef}>
                    <Search className="absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-mist-lilac" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="¿Qué servicio necesitás? (ej: plomería, electricidad...)"
                      value={heroSearch}
                      onChange={handleSearchChange}
                      onFocus={() => heroSearch && setShowSuggestions(true)}
                      onKeyDown={handleKeyDown}
                      className="w-full rounded-full border border-inkline-violet bg-deep-indigo/80 py-4 pl-14 pr-5 text-base font-light text-pure-white placeholder:text-mist-lilac transition-colors focus:border-pulse-cobalt focus:outline-none focus:ring-2 focus:ring-pulse-cobalt/40"
                    />

                    {showSuggestions && suggestions.length > 0 && (
                      <div ref={suggestionsRef} className="absolute left-0 right-0 top-full z-50 mt-3 max-h-96 overflow-y-auto rounded-[28px] border border-inkline-violet bg-deep-indigo shadow-2xl shadow-black/50">
                        {suggestions.map((sug, i) => (
                          <button
                            key={i}
                            onClick={() => handleSuggestionClick(sug)}
                            onMouseEnter={() => setSelectedIndex(i)}
                            className={`flex w-full items-center gap-3 border-b border-inkline-violet/40 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/5 ${
                              i === selectedIndex ? 'bg-white/5' : ''
                            }`}
                          >
                            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border ${
                              sug.type === 'categoria'
                                ? 'border-purple-400/30 bg-purple-400/10 text-purple-400'
                                : 'border-pulse-cobalt/30 bg-pulse-cobalt/10 text-pulse-cobalt'
                            }`}>
                              {sug.type === 'categoria' ? (
                                categories.find((c) => c.name === sug.label)?.icon ? (
                                  <Image
                                    src={categories.find((c) => c.name === sug.label)!.icon!}
                                    alt=""
                                    width={32}
                                    height={32}
                                    unoptimized
                                    className="h-8 w-8 object-contain"
                                  />
                                ) : (
                                  <Box className="h-6 w-6" />
                                )
                              ) : (
                                <Search className="h-6 w-6" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block truncate font-normal text-pure-white">{sug.label}</span>
                              {sug.type === 'categoria' && (
                                <span className="text-xs text-mist-lilac">Categoría</span>
                              )}
                              {sug.type === 'servicio' && (
                                <span className="text-xs text-mist-lilac">Buscar servicio</span>
                              )}
                            </div>
                            <ChevronRight className="h-4 w-4 text-mist-lilac" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button type="submit" size="lg" className="whitespace-nowrap">
                    Buscar
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                  <p className="mt-3 text-center text-xs text-mist-lilac">
                    Usá ↑↓ para navegar, Enter para seleccionar
                  </p>
                )}
              </form>

              <div className="mt-10 flex flex-wrap gap-2">
                {['Pagos en custodia', 'Contratos con validez legal', 'Proveedores verificados'].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full border border-inkline-violet/60 bg-white/[0.03] px-4 py-2 text-xs font-light text-quartz-lavender">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal-teal" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Escultura de vidrio / panel de producto */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
              <div className="relative aspect-square overflow-hidden rounded-[48px] border border-inkline-violet/60 bg-deep-indigo/60 p-6">
                <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-pulse-cobalt/30 blur-3xl animate-pulse-glow" />
                <div className="absolute -left-12 bottom-0 h-64 w-64 rounded-full bg-signal-teal/15 blur-3xl" />
                <div className="absolute inset-10 rounded-full border border-white/10" />
                <div className="absolute inset-20 rounded-full border border-white/10" />

                <div className="relative flex h-full flex-col items-center justify-center">
                  <div className="animate-float-orb relative flex h-48 w-48 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br from-cyan-teal/70 via-pulse-cobalt/60 to-deep-indigo/90 shadow-[0_0_120px_rgba(61,80,252,0.45)] sm:h-56 sm:w-56">
                    <div className="absolute inset-5 rounded-full border border-white/20" />
                    <div className="absolute inset-14 rounded-full bg-white/15 blur-md" />
                    <ShieldCheck className="relative h-16 w-16 text-white/80" strokeWidth={1} />
                  </div>
                </div>

                <div className="absolute inset-x-5 bottom-5 rounded-[28px] border border-inkline-violet/70 bg-void-navy/85 p-5 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.22em] text-mist-lilac">Contrato digital</span>
                    <span className="rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-green-300">
                      Protegido
                    </span>
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-mist-lilac">Pago en custodia</p>
                      <p className="text-sm font-light text-quartz-lavender">Monto acordado</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-mist-lilac">Se libera</p>
                      <p className="text-sm font-light text-quartz-lavender">Al conformar</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="border-y border-inkline-violet/40 bg-deep-indigo/40 py-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="galileo-eyebrow text-signal-teal">Catálogo</p>
                <h2 className="mt-3 text-3xl font-extralight text-pure-white">Categorías populares</h2>
              </div>
              <Link href="/servicios" className="inline-flex items-center gap-2 text-sm font-light text-quartz-lavender transition-colors hover:text-white">
                Ver todos los servicios
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/servicios?categoria=${cat.slug}`}
                  className="group relative flex min-h-[10rem] flex-col items-center justify-center gap-3 overflow-hidden rounded-[28px] border border-inkline-violet/60 bg-deep-indigo/70 p-4 transition-colors hover:border-pulse-cobalt/60"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pulse-cobalt/10 via-transparent to-signal-teal/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  {cat.icon ? (
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-inkline-violet/60 bg-glacier-white transition-transform duration-300 group-hover:scale-110">
                      <Image src={cat.icon} alt="" width={96} height={96} unoptimized className="h-14 w-14 object-contain" />
                    </div>
                  ) : (
                    <span className="relative flex h-20 w-20 items-center justify-center rounded-full border border-inkline-violet/60 bg-glacier-white text-4xl">{cat.fallback}</span>
                  )}
                  <span className="relative text-center text-sm font-light text-quartz-lavender transition-colors group-hover:text-white">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Top proveedores */}
        {!topLoading && topProveedores.length > 0 && (
          <section className="border-b border-inkline-violet/40 py-20">
            <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
              <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="galileo-eyebrow text-signal-teal">Ranking</p>
                  <h2 className="mt-3 text-3xl font-extralight text-pure-white">
                    Proveedores destacados
                  </h2>
                  <p className="mt-2 max-w-xl text-sm font-light text-mist-lilac">
                    Ordenados por desempeño, valoraciones y cumplimiento.
                  </p>
                </div>
                <Link
                  href="/proveedores?ordenar_por=ranking"
                  className="inline-flex items-center gap-2 text-sm font-light text-quartz-lavender transition-colors hover:text-white"
                >
                  Ver ranking completo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topProveedores.map((proveedor, index) => (
                  <Link
                    key={proveedor.id_usuario}
                    href={`/proveedores/${proveedor.id_usuario}`}
                    className="group rounded-[28px] border border-inkline-violet/60 bg-deep-indigo/70 p-6 transition-colors hover:border-pulse-cobalt/60"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-signal-teal/30 bg-signal-teal/10 text-sm font-medium text-signal-teal">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        {proveedor.proveedor_destacado && (
                          <Award className="h-4 w-4 text-signal-teal" />
                        )}
                        {proveedor.sello_verificado && (
                          <ShieldCheck className="h-4 w-4 text-pulse-cobalt" />
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-light text-pure-white">
                      {proveedor.nombre} {proveedor.apellido}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm font-light text-mist-lilac">
                      {proveedor.rubro_principal || 'Proveedor de servicios'}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-quartz-lavender">
                      <Star className="h-4 w-4 fill-signal-teal text-signal-teal" />
                      {proveedor.calificacion_promedio != null
                        ? proveedor.calificacion_promedio.toFixed(1)
                        : 'Sin valoraciones'}
                      <span className="text-xs text-mist-lilac">
                        ({proveedor.cantidad_valoraciones ?? 0} reseñas)
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Nosotros */}
        <section id="nosotros" className="py-24">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-inkline-violet bg-white/5">
                    <Users className="h-5 w-5 text-signal-teal" strokeWidth={1.5} />
                  </div>
                  <p className="galileo-eyebrow text-signal-teal">Nosotros</p>
                </div>
                <h2 className="text-3xl font-extralight text-pure-white sm:text-4xl">Nuestra misión</h2>
                <p className="mt-6 text-base font-light leading-relaxed text-quartz-lavender">
                  Hacer de cada contacto la mejor experiencia de servicio, brindando calidad,
                  innovación y eficiencia.
                </p>
                <p className="mt-4 text-base font-light leading-relaxed text-quartz-lavender">
                  Trabajar con responsabilidad y compromiso en beneficio de nuestros clientes con
                  personal altamente capacitado y comprometidos con los valores de la empresa.
                </p>
                <p className="mt-4 text-base font-light leading-relaxed text-mist-lilac">
                  Conecta. Acuerda. Realiza. La plataforma que conecta clientes con proveedores de
                  servicios de confianza, con contratos seguros y pagos protegidos.
                </p>
                <Link href="/contacto" className="mt-8 inline-flex items-center gap-2 border-b border-quartz-lavender pb-1 text-sm font-light text-quartz-lavender transition-colors hover:border-white hover:text-white">
                  Conocé más sobre nosotros
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4">
                {features.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <Link
                      key={feat.title}
                      href={feat.href}
                      className="group flex items-start gap-5 rounded-[28px] border border-inkline-violet/60 bg-deep-indigo/60 p-6 transition-colors hover:border-pulse-cobalt/60"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-inkline-violet bg-void-navy/60 transition-transform group-hover:scale-105">
                        <Icon className="h-5 w-5 text-pulse-cobalt" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-lg font-light text-pure-white transition-colors group-hover:text-cyan-200">{feat.title}</h3>
                        <p className="mt-1 text-sm font-light leading-relaxed text-mist-lilac">{feat.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Nuestros clientes */}
        <section id="clientes" className="overflow-hidden border-y border-inkline-violet/40 bg-deep-indigo/30 py-16">
          <div className="mx-auto mb-10 max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="galileo-eyebrow text-signal-teal">Confianza</p>
              <h2 className="mt-3 text-3xl font-extralight text-pure-white">Nuestros clientes</h2>
            </div>
          </div>
          <GaleriaClientes />
        </section>

        {/* Banner Quiero ser Proveedor */}
        <section className="py-20">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="galileo-gradient relative overflow-hidden rounded-[35px] px-8 py-12 sm:px-12">
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" aria-hidden="true" />
              <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
              <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
                <div>
                  <p className="galileo-eyebrow text-white/80">Sumate a la red</p>
                  <h3 className="mt-3 text-3xl font-extralight text-white">¿Tenés un oficio o profesión?</h3>
                  <p className="mt-2 max-w-xl text-sm font-light text-white/80">
                    Sumate a Contrato Directo y empezá a conseguir clientes cerca tuyo.
                  </p>
                </div>
                <Link href="/proveedores/convertir?paso=2">
                  <Button variant="outline" size="lg">
                    Quiero ser Proveedor
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="pb-24">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="galileo-eyebrow text-signal-teal">Diferenciales</p>
              <h2 className="mt-3 text-3xl font-extralight text-pure-white sm:text-4xl">¿Por qué Contrato Directo?</h2>
              <p className="mt-4 text-base font-light leading-relaxed text-quartz-lavender">
                Tecnología, contratos y pagos pensados para que acordar un servicio sea simple y seguro.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {features.map((feat) => {
                const Icon = feat.icon;
                return (
                  <Link key={feat.title} href={feat.href} className="group">
                    <article className="flex h-full flex-col rounded-[35px] border border-inkline-violet/60 bg-deep-indigo/70 p-8 transition-colors duration-300 group-hover:border-pulse-cobalt/60">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-inkline-violet bg-void-navy/60 transition-transform group-hover:scale-105">
                        <Icon className="h-6 w-6 text-pulse-cobalt" strokeWidth={1.5} />
                      </div>
                      <h3 className="mt-6 text-xl font-light text-pure-white">{feat.title}</h3>
                      <p className="mt-3 flex-1 text-sm font-light leading-relaxed text-mist-lilac">{feat.description}</p>
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-light text-cyan-300 transition-transform group-hover:translate-x-1">
                        Ver más
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-24">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-[35px] border border-inkline-violet/60 bg-deep-indigo/70 px-6 py-16 text-center sm:px-12">
              <div className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pulse-cobalt/25 blur-3xl" aria-hidden="true" />
              <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-signal-teal/10 blur-3xl" aria-hidden="true" />
              <div className="relative">
                <Sparkles className="mx-auto h-8 w-8 text-signal-teal" strokeWidth={1} />
                <h2 className="mt-6 text-3xl font-extralight text-pure-white sm:text-4xl">¿Sos proveedor de servicios?</h2>
                <p className="mx-auto mt-4 max-w-2xl text-base font-light leading-relaxed text-quartz-lavender">
                  Unite a miles de profesionales que ya confían en Contrato Directo para conseguir nuevos clientes.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                  <Link href="/proveedores/convertir?paso=2">
                    <Button size="lg">Quiero Ser Proveedor</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
